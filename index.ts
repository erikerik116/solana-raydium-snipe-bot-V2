import {
    BigNumberish,
    getStablePrice,
    Liquidity,
    LIQUIDITY_STATE_LAYOUT_V4,
    LiquidityPoolKeys,
    LiquidityPoolKeysV4,
    LiquidityStateV4,
    MARKET_STATE_LAYOUT_V3,
    MarketStateV3,
    Percent,
    Token,
    TokenAmount,
} from '@raydium-io/raydium-sdk'
import {
    AccountLayout,
    createAssociatedTokenAccountIdempotentInstruction,
    createAssociatedTokenAccountInstruction,
    createCloseAccountInstruction,
    createSyncNativeInstruction,
    getAssociatedTokenAddress,
    getAssociatedTokenAddressSync,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import {
    Keypair,
    Connection,
    PublicKey,
    KeyedAccountInfo,
    TransactionMessage,
    VersionedTransaction,
    TransactionInstruction,
    SystemProgram,
    Transaction,
} from '@solana/web3.js'
import { checkBurn, checkMutable, checkSocial } from './tokenFilter'
import { getTokenAccounts, RAYDIUM_LIQUIDITY_PROGRAM_ID_V4, OPENBOOK_PROGRAM_ID, createPoolKeys } from './liquidity'
import { logger } from './utils'
import { getMinimalMarketV3, MinimalMarketLayoutV3 } from './market'
import { MintLayout } from './types'
import bs58 from 'bs58'
import * as fs from 'fs'
import * as path from 'path'
import readline from 'readline'
import {
    CHECK_IF_MINT_IS_RENOUNCED,
    COMMITMENT_LEVEL,
    LOG_LEVEL,
    MAX_SELL_RETRIES,
    PRIVATE_KEY,
    QUOTE_AMOUNT,
    QUOTE_MINT,
    RPC_ENDPOINT,
    RPC_WEBSOCKET_ENDPOINT,
    SNIPE_LIST_REFRESH_INTERVAL,
    USE_SNIPE_LIST,
    MIN_POOL_SIZE,
    MAX_POOL_SIZE,
    ONE_TOKEN_AT_A_TIME,
    PRICE_CHECK_DURATION,
    PRICE_CHECK_INTERVAL,
    TAKE_PROFIT1,
    TAKE_PROFIT2,
    STOP_LOSS,
    SELL_SLIPPAGE,
    CHECK_IF_MINT_IS_MUTABLE,
    CHECK_IF_MINT_IS_BURNED,
    JITO_MODE,
    JITO_ALL,
    SELL_AT_TP1,
    JITO_FEE,
    CHECK_SOCIAL,
} from './constants'
// import { clearMonitor, monitor } from './monitor'
import { BN } from 'bn.js'
// import { checkBurn, checkMutable, checkSocial } from './tokenFilter'
import { bundle } from './executor/jito'
import { execute } from './executor/legacy'
import { jitoWithAxios } from './executor/jitoWithAxios'
import { updateArgs } from '@metaplex-foundation/mpl-token-metadata'
// import { PoolKeys } from './utils/getPoolKeys'

export interface MinimalTokenAccountData {
    mint: PublicKey
    address: PublicKey
    poolkeys?: LiquidityPoolKeys
    market?: MinimalMarketLayoutV3
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})


const existingLiquidityPools: Set<string> = new Set<string>()
const existingOpenBookMarkets: Set<string> = new Set<string>()
const existingTokenAccounts: Map<string, MinimalTokenAccountData> = new Map<string, MinimalTokenAccountData>()







let wallet: Keypair
let quoteToken: Token
let quoteTokenAssociatedAddress: PublicKey
let quoteAmount: TokenAmount
let quoteMinPoolSizeAmount: TokenAmount
let quoteMaxPoolSizeAmount: TokenAmount
let processingToken: Boolean = false
let poolId: PublicKey
let tokenAccountInCommon: MinimalTokenAccountData | undefined
let accountDataInCommon: LiquidityStateV4 | undefined
let idDealt: string = NATIVE_MINT.toBase58()
let snipeList: string[] = []
let timesChecked: number = 0
let soldSome: boolean = false


const solanaConnection = new Connection(RPC_ENDPOINT, {
    wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
})

async function init(): Promise<void> {
    logger.level = LOG_LEVEL;

    //get wallet
    wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    const solBalance = await solanaConnection.getBalance(wallet.publicKey);
    console.log(`Wallet Address: ${wallet.publicKey}`);
    console.log(`Wallet Balance: ${(solBalance / 10 ** 9).toFixed(8)}SOL`);

    //get quote mint and amount
    switch (QUOTE_MINT) {
        case 'WSOL': {
            quoteToken = Token.WSOL;
            quoteAmount = new TokenAmount(Token.WSOL, QUOTE_AMOUNT, false)
            quoteMinPoolSizeAmount = new TokenAmount(quoteToken, MIN_POOL_SIZE, false)
            quoteMaxPoolSizeAmount = new TokenAmount(quoteToken, MAX_POOL_SIZE, false)
            break;
        }
        case 'USDC': {
            quoteToken = new Token(
                TOKEN_PROGRAM_ID,
                new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                6,
                'USDC',
                'USDC',
            )
            quoteAmount = new TokenAmount(quoteToken, QUOTE_AMOUNT, false);
            quoteMinPoolSizeAmount = new TokenAmount(quoteToken, MIN_POOL_SIZE, false)
            quoteMaxPoolSizeAmount = new TokenAmount(quoteToken, MAX_POOL_SIZE, false)
            break;
        }

        default: {
            throw new Error(`Unsupported quote mint "${QUOTE_MINT}". Supported values are USDC and WSOL`)
        }

    }



    console.log(`Snipe list: ${USE_SNIPE_LIST}`)
    console.log(`Check mint renounced: ${CHECK_IF_MINT_IS_RENOUNCED}`)
    console.log(`Check token socials: ${CHECK_SOCIAL}`)
    console.log(
        `Min pool size: ${quoteMinPoolSizeAmount.isZero() ? 'false' : quoteMinPoolSizeAmount.toFixed(2)} ${quoteToken.symbol}`,
    )
    console.log(
        `Max pool size: ${quoteMaxPoolSizeAmount.isZero() ? 'false' : quoteMaxPoolSizeAmount.toFixed(2)} ${quoteToken.symbol}`,
    )
    console.log(`One token at a time: ${ONE_TOKEN_AT_A_TIME}`)
    console.log(`Buy amount: ${quoteAmount.toFixed()} ${quoteToken.symbol}`)

    // check existing wallet for associated token account of quote mint
    const tokenAccounts = await getTokenAccounts(solanaConnection, wallet.publicKey, COMMITMENT_LEVEL)

    for (const ta of tokenAccounts) {
        existingTokenAccounts.set(ta.accountInfo.mint.toString(), <MinimalTokenAccountData>{
            mint: ta.accountInfo.mint,
            address: ta.pubkey,
        })
    }

    quoteTokenAssociatedAddress = await getAssociatedTokenAddress(NATIVE_MINT, wallet.publicKey)

    const wsolBalance = await solanaConnection.getBalance(quoteTokenAssociatedAddress)

    console.log(`WSOL Balance: ${wsolBalance}`)
    // if (!(!wsolBalance || wsolBalance == 0))

    //     loadSnipeList();

}

// function loadSnipeList() {
//     if (!USE_SNIPE_LIST) {
//         return
//     }

//     const count = snipeList.length
//     const data = fs.readFileSync(path.join(__dirname, 'snipe-list.txt'), 'utf-8')
//     snipeList = data.split('\n').map((a) => a.trim())
//         .filter((a) => a)

//     if (snipeList.length != count) {
//         console.log(`Loaded snipe list:${snipeList.length}`)
//     }

// }


async function trackWallet(connection: Connection): Promise<void> {
    try {
        const wsolAta = await getAssociatedTokenAddress(NATIVE_MINT, wallet.publicKey)
        connection.onLogs(
            wsolAta,
            async ({ logs, err, signature }) => {
                if (err)
                    console.log("Transaction failed")
                else {
                    console.log(`\nTransaction success: https://solscan.io/tx/${signature}\n`)
                }
            },
            "confirmed"
        );
    } catch (error) {
        console.log("Transaction error : ", error)
    }
}

// function shouldBuy(key: string): boolean {
//     return USE_SNIPE_LIST ? snipeList.includes(key) : ONE_TOKEN_AT_A_TIME ? !processingToken : true
// }


function saveTokenAccount(mint: PublicKey, accountData: MinimalMarketLayoutV3) {
    const ata = getAssociatedTokenAddressSync(mint, wallet.publicKey)
    const tokenAccount = <MinimalTokenAccountData>{
        address: ata,
        mint: mint,
        market: <MinimalMarketLayoutV3>{
            bids: accountData.bids,
            asks: accountData.asks,
            eventQueue: accountData.eventQueue,
        },
    }
    existingTokenAccounts.set(mint.toString(), tokenAccount)
    return tokenAccount

}


async function buy(accountId: PublicKey, accountData: LiquidityStateV4): Promise<void> {
    console.log(`Buy action triggered`)
    console.log(`Buy action triggered in buy`);
    console.log("accountId in buy ========", accountId);
    console.log("accountData in buy =========", accountData)
    ///
    wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    const solBalance = await solanaConnection.getBalance(wallet.publicKey);
    console.log(`Wallet Address: ${wallet.publicKey}`);
    console.log(`Wallet Balance: ${(solBalance / 10 ** 9).toFixed(8)}SOL`);

    ///
    try {
        let tokenAccount = existingTokenAccounts.get(accountData.baseMint.toString())
        tokenAccountInCommon = tokenAccount
        accountDataInCommon = accountData
        if (!tokenAccount) {
            // it's possible that we didn't have time to fetch open book data
            const market = await getMinimalMarketV3(solanaConnection, accountData.marketId, COMMITMENT_LEVEL)
            tokenAccount = saveTokenAccount(accountData.baseMint, market)
        }
        tokenAccount.poolkeys = createPoolKeys(accountId, accountData, tokenAccount.market!)
        const { innerTransaction } = Liquidity.makeSwapFixedInInstruction(
            {
                poolKeys: tokenAccount.poolkeys,
                userKeys: {
                    tokenAccountIn: quoteTokenAssociatedAddress,
                    tokenAccountOut: tokenAccount.address,
                    owner: wallet.publicKey,
                },
                amountIn: quoteAmount.raw,
                minAmountOut: 0,
            },
            tokenAccount.poolkeys.version,
        )

        const latestBlockhash = await solanaConnection.getLatestBlockhash({
            commitment: COMMITMENT_LEVEL,
        })

        const instructions: TransactionInstruction[] = []

        if (!await solanaConnection.getAccountInfo(quoteTokenAssociatedAddress))
            instructions.push(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    quoteTokenAssociatedAddress,
                    wallet.publicKey,
                    NATIVE_MINT,
                )
            )
        instructions.push(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: quoteTokenAssociatedAddress,
                lamports: Math.ceil(parseFloat(QUOTE_AMOUNT) * 10 ** 9),
            }),
            createSyncNativeInstruction(quoteTokenAssociatedAddress, TOKEN_PROGRAM_ID),
            createAssociatedTokenAccountIdempotentInstruction(
                wallet.publicKey,
                tokenAccount.address,
                wallet.publicKey,
                accountData.baseMint,
            ),
            ...innerTransaction.instructions,
        )

        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions,
        }).compileToV0Message()
        const transaction = new VersionedTransaction(messageV0)
        transaction.sign([wallet, ...innerTransaction.signers])
        console.log("buy transaction========", transaction);


        if (JITO_MODE) {
            if (JITO_ALL) {
                await jitoWithAxios(transaction, wallet, latestBlockhash)
            } else {
                const result = await bundle([transaction], wallet)
            }
        } else {
            await execute(transaction, latestBlockhash)
        }
    } catch (e) {
        logger.debug(e)
        console.log(`Failed to buy token, ${accountData.baseMint}`)
    }
}



export async function processRaydiumPool(id: PublicKey, poolState: LiquidityStateV4) {

    if (idDealt == id.toString()) return
    idDealt = id.toBase58()
    console.log("idDealt===========", idDealt);
    try {
        const quoteBalance = (await solanaConnection.getBalance(poolState.quoteVault, "processed")) / 10 ** 9
        console.log("quoteBalance===========", quoteBalance);
        console.log("quoteBalanceaddress===========", poolState.quoteVault)
        // if (!shouldBuy(poolState.baseMint.toString())) {
        //     return
        // }
        console.log(`Detected a new pool: https://dexscreener.com/solana/${id.toString()}`)
        if (!quoteMinPoolSizeAmount.isZero()) {
            console.log(`Processing pool: ${id.toString()} with ${quoteBalance.toFixed(2)} ${quoteToken.symbol} in liquidity`)

            // if (poolSize.lt(quoteMinPoolSizeAmount)) {
            if (parseFloat(MIN_POOL_SIZE) > quoteBalance) {
                console.log(`Skipping pool, smaller than ${MIN_POOL_SIZE} ${quoteToken.symbol}`)
                console.log(`-------------------------------------- \n`)
                return
            }
        }

        if (!quoteMaxPoolSizeAmount.isZero()) {
            const poolSize = new TokenAmount(quoteToken, poolState.swapQuoteInAmount, true)

            // if (poolSize.gt(quoteMaxPoolSizeAmount)) {
            if (parseFloat(MAX_POOL_SIZE) < quoteBalance) {
                console.log(`Skipping pool, larger than ${MIN_POOL_SIZE} ${quoteToken.symbol}`)
                console.log(
                    `Skipping pool, bigger than ${quoteMaxPoolSizeAmount.toFixed()} ${quoteToken.symbol}`,
                    `Swap quote in amount: ${poolSize.toFixed()}`,
                )
                console.log(`-------------------------------------- \n`)
                return
            }
        }
    } catch (error) {
        console.log(`Error in getting new pool balance, ${error}`)
    }


    if (CHECK_IF_MINT_IS_RENOUNCED) {
        const mintOption = await checkMintable(poolState.baseMint)

        if (mintOption !== true) {
            console.log('Skipping, owner can mint tokens!', poolState.baseMint)
            return
        }
    }

    if (CHECK_SOCIAL) {
        const isSocial = await checkSocial(solanaConnection, poolState.baseMint, COMMITMENT_LEVEL)
        if (isSocial !== true) {
            console.log('Skipping, token does not have socials', poolState.baseMint)
            return
        }
    }

    if (CHECK_IF_MINT_IS_MUTABLE) {
        const mutable = await checkMutable(solanaConnection, poolState.baseMint)
        if (mutable == true) {
            console.log('Skipping, token is mutable!', poolState.baseMint)
            return
        }
    }

    if (CHECK_IF_MINT_IS_BURNED) {
        const burned = await checkBurn(solanaConnection, poolState.lpMint, COMMITMENT_LEVEL)
        if (burned !== true) {
            console.log('Skipping, token is not burned!', poolState.baseMint)
            return
        }
    }


    processingToken = true
    console.log("processingToken==========", processingToken);
    //
    wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    const solBalance = await solanaConnection.getBalance(wallet.publicKey);
    console.log(`Wallet Address: ${wallet.publicKey}`);
    console.log(`Wallet Balance: ${(solBalance / 10 ** 9).toFixed(8)}SOL`);
    //
    await buy(id, poolState)
}

export async function checkMintable(vault: PublicKey): Promise<boolean | undefined> {
    try {
        let { data } = (await solanaConnection.getAccountInfo(vault)) || {}
        if (!data) {
            return
        }
        const deserialize = MintLayout.decode(data)
        return deserialize.mintAuthorityOption === 0
    } catch (e) {
        logger.debug(e)
        console.log(`Failed to check if mint is renounced`, vault)
    }
}
const priceMatch = async (amountIn: TokenAmount, poolKeys: LiquidityPoolKeysV4) => {
    try {
        if (PRICE_CHECK_DURATION === 0 || PRICE_CHECK_INTERVAL === 0) {
            return
        }
        let priceMatchAtOne = false
        const timesToCheck = PRICE_CHECK_DURATION / PRICE_CHECK_INTERVAL
        const temp = amountIn.raw.toString()
        const tokenAmount = new BN(temp.substring(0, temp.length - 2))
        const sellAt1 = tokenAmount.mul(new BN(SELL_AT_TP1)).toString()
        const slippage = new Percent(SELL_SLIPPAGE, 100)

        const tp1 = Number((Number(QUOTE_AMOUNT) * (100 + TAKE_PROFIT1) / 100).toFixed(4))
        const tp2 = Number((Number(QUOTE_AMOUNT) * (100 + TAKE_PROFIT2) / 100).toFixed(4))
        const sl = Number((Number(QUOTE_AMOUNT) * (100 - STOP_LOSS) / 100).toFixed(4))
        timesChecked = 0
        do {
            try {
                const poolInfo = await Liquidity.fetchInfo({
                    connection: solanaConnection,
                    poolKeys,
                })

                const { amountOut } = Liquidity.computeAmountOut({
                    poolKeys,
                    poolInfo,
                    amountIn,
                    currencyOut: quoteToken,
                    slippage,
                })
                const pnl = (Number(amountOut.toFixed(6)) - Number(QUOTE_AMOUNT)) / Number(QUOTE_AMOUNT) * 100
                if (timesChecked > 0) {
                    // deleteConsoleLines(1)
                }
                const data = await getPrice()
                if (data) {
                    const {
                        priceUsd,
                        liquidity,
                        fdv,
                        txns,
                        marketCap,
                        pairCreatedAt,
                        volume_m5,
                        volume_h1,
                        volume_h6,
                        priceChange_m5,
                        priceChange_h1,
                        priceChange_h6
                    } = data
                    // console.log(`Take profit1: ${tp1} SOL | Take profit2: ${tp2} SOL  | Stop loss: ${sl} SOL | Buy amount: ${QUOTE_AMOUNT} SOL | Current: ${amountOut.toFixed(4)} SOL | PNL: ${pnl.toFixed(3)}%`)
                    console.log(`TP1: ${tp1} | TP2: ${tp2} | SL: ${sl} | Lq: $${(liquidity.usd / 1000).toFixed(3)}K | MC: $${(marketCap / 1000).toFixed(3)}K | Price: $${Number(priceUsd).toFixed(3)} | 5M: ${priceChange_m5}% | 1H: ${priceChange_h1}% | TXs: ${(txns.h1.buys + txns.h1.sells)} | Buy: ${txns.h1.buys} | Sell: ${txns.h1.sells} | Vol: $${(volume_h1 / 1000).toFixed(3)}K`)
                }
                const amountOutNum = Number(amountOut.toFixed(7))
                if (amountOutNum < sl) {
                    console.log("Token is on stop loss point, will sell with loss")
                    break
                }

                // if (amountOutNum > tp1) {
                if (pnl > TAKE_PROFIT1) {
                    if (!priceMatchAtOne) {
                        console.log("Token is on first level profit, will sell some and wait for second level higher profit")
                        priceMatchAtOne = true
                        soldSome = true
                        sell(poolKeys.baseMint, sellAt1, true)
                        // break
                    }
                }

                // if (amountOutNum < tp1 && priceMatchAtOne) {
                if (pnl < TAKE_PROFIT1 && priceMatchAtOne) {
                    console.log("Token is on first level profit again, will sell with first level")
                    break
                }

                // if (amountOutNum > tp2) {
                if (pnl > TAKE_PROFIT2) {
                    console.log("Token is on second level profit, will sell with second level profit")
                    break
                }

            } catch (e) {
            } finally {
                timesChecked++
            }
            // await sleep(PRICE_CHECK_INTERVAL)
        } while (timesChecked < timesToCheck)
    } catch (error) {
        console.log("Error when setting profit amounts", error)
    }
}

const getPrice = async () => {
    if (!poolId) return
    try {
        // let poolId = new PublicKey("13bqEPVQewKAVbprEZVgqkmaCgSMsdBN9up5xfvLtXDV")
        const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${poolId?.toBase58()}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })
        const data = await res.clone().json()
        if (!data.pair) {
            return
        }
        // console.log("🚀 ~ getprice ~ data:", data)
        // console.log("price data => ", data.pair.priceUsd)
        const { priceUsd, priceNative, volume, priceChange, liquidity, fdv, marketCap, pairCreatedAt, txns } = data.pair
        const { m5: volume_m5, h1: volume_h1, h6: volume_h6 } = volume
        const { m5: priceChange_m5, h1: priceChange_h1, h6: priceChange_h6 } = priceChange
        // console.log(`Lq: $${(liquidity.usd / 1000).toFixed(3)}K | MC: $${(marketCap / 1000).toFixed(3)}K | Price: $${Number(priceUsd).toFixed(3)} | 5M: ${priceChange_m5}% | 1H: ${priceChange_h1}% | TXs: ${txns.h1.buys + txns.h1.sells} | Buy: ${txns.h1.buys} | Sell: ${txns.h1.sells} | Vol: $${(volume_h1 / 1000).toFixed(3)}K`)
        // console.log(`${priceUsd} ${priceNative} ${liquidity.usd} ${fdv} ${marketCap} ${pairCreatedAt} ${volume_m5} ${volume_h1} ${volume_h6} ${priceChange_m5} ${priceChange_h1} ${priceChange_h6}`)
        return {
            priceUsd,
            priceNative,
            liquidity,
            fdv,
            txns,
            marketCap,
            pairCreatedAt,
            volume_m5,
            volume_h1,
            volume_h6,
            priceChange_m5,
            priceChange_h1,
            priceChange_h6
        }
    } catch (e) {
        console.log("error in fetching price of pool", e)
        return
    }
}


export async function processOpenBookMarket(updatedAccounteInfo: KeyedAccountInfo) {
    let accountData: MarketStateV3 | undefined
    try {
        accountData = MARKET_STATE_LAYOUT_V3.decode(updatedAccounteInfo.accountInfo.data)

        if (existingTokenAccounts.has(accountData.baseMint.toString())) {
            return
        }

        saveTokenAccount(accountData.baseMint, accountData)
    } catch (e) {
        logger.debug(e)
        console.log(`Failed to process market, mint:`, accountData?.baseMint)
    }
}


const getTokenBalance = async (tokenAccount: PublicKey) => {
    let tokenBalance = "0"
    let index = 0
    do {
        try {
            const tokenBal = (await solanaConnection.getTokenAccountBalance(tokenAccount, 'processed')).value
            const uiAmount = tokenBal.uiAmount
            if (index > 10) {
                break
            }
            if (uiAmount && uiAmount > 0) {
                tokenBalance = tokenBal.amount
                console.log(`Token balance is ${uiAmount}`)
                break
            }

            index++
        } catch (error) {

        }
    } while (true);
    return tokenBalance
}



let bought: string = NATIVE_MINT.toBase58()

const walletChange = async (updatedAccountInfo: KeyedAccountInfo) => {
    const accountData = AccountLayout.decode(updatedAccountInfo.accountInfo!.data)
    if (updatedAccountInfo.accountId.equals(quoteTokenAssociatedAddress)) {
        return
    }
    if (tokenAccountInCommon && accountDataInCommon) {

        if (bought != accountDataInCommon.baseMint.toBase58()) {
            console.log(`\n--------------- bought token successfully ---------------------- \n`)
            console.log(`https://dexscreener.com/solana/${accountDataInCommon.baseMint.toBase58()}`)
            console.log(`PHOTON: https://photon-sol.tinyastro.io/en/lp/${tokenAccountInCommon.poolkeys!.id.toString()}`)
            console.log(`DEXSCREENER: https://dexscreener.com/solana/${tokenAccountInCommon.poolkeys!.id.toString()}`)
            console.log(`JUPITER: https://jup.ag/swap/${accountDataInCommon.baseMint.toBase58()}-SOL`)
            console.log(`BIRDEYE: https://birdeye.so/token/${accountDataInCommon.baseMint.toBase58()}?chain=solana\n\n`)
            bought = accountDataInCommon.baseMint.toBase58()

            const tokenAccount = await getAssociatedTokenAddress(accountData.mint, wallet.publicKey)
            const tokenBalance = await getTokenBalance(tokenAccount)
            if (tokenBalance == "0") {
                console.log(`Detected a new pool, but didn't confirm buy action`)
                return
            }

            const tokenIn = new Token(TOKEN_PROGRAM_ID, tokenAccountInCommon.poolkeys!.baseMint, tokenAccountInCommon.poolkeys!.baseDecimals)
            const tokenAmountIn = new TokenAmount(tokenIn, tokenBalance, true)
            inputAction(updatedAccountInfo.accountId, accountData.mint, tokenBalance)
            await priceMatch(tokenAmountIn, tokenAccountInCommon.poolkeys!)


            const tokenBalanceAfterCheck = await getTokenBalance(tokenAccount)
            if (tokenBalanceAfterCheck == "0") {
                return
            }
            if (soldSome) {
                soldSome = false
                const _ = await sell(tokenAccountInCommon.poolkeys!.baseMint, tokenBalanceAfterCheck)
            } else {
                const _ = await sell(tokenAccountInCommon.poolkeys!.baseMint, accountData.amount)
            }
        }
    }
}

export async function sell(mint: PublicKey, amount: BigNumberish, isTp1Sell: boolean = false): Promise<void> {
    try {
        const tokenAccount = existingTokenAccounts.get(mint.toString())

        if (!tokenAccount) {
            console.log("Sell token account not exist")
            return
        }

        if (!tokenAccount.poolkeys) {
            console.log('No pool keys found: ', mint)
            return
        }

        if (amount == "0") {
            console.log(`Checking: Sold already`, tokenAccount.mint)
            return
        }

        const { innerTransaction } = Liquidity.makeSwapFixedInInstruction(
            {
                poolKeys: tokenAccount.poolkeys!,
                userKeys: {
                    tokenAccountOut: quoteTokenAssociatedAddress,
                    tokenAccountIn: tokenAccount.address,
                    owner: wallet.publicKey,
                },
                amountIn: amount,
                minAmountOut: 0,
            },
            tokenAccount.poolkeys!.version,
        )

        const tx = new Transaction().add(...innerTransaction.instructions)
        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = (await solanaConnection.getLatestBlockhash()).blockhash

        const latestBlockhash = await solanaConnection.getLatestBlockhash({
            commitment: COMMITMENT_LEVEL,
        })

        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: [
                ...innerTransaction.instructions,
                createCloseAccountInstruction(quoteTokenAssociatedAddress, wallet.publicKey, wallet.publicKey),
            ],
        }).compileToV0Message()

        const transaction = new VersionedTransaction(messageV0)
        transaction.sign([wallet, ...innerTransaction.signers])
        // if (JITO_MODE) {
        //     if (JITO_ALL) {
        //         await jitoWithAxios(transaction, wallet, latestBlockhash)
        //     } else {
        //         await bundle([transaction], wallet)
        //     }
        // } else {
        await execute(transaction, latestBlockhash)
        // }
    } catch (e: any) {
        //   await sleep(1000)
        logger.debug(e)
    }
    if (!isTp1Sell) {
        await sell(mint, amount, true)
        processingToken = false
    }
}

const inputAction = async (accountId: PublicKey, mint: PublicKey, amount: BigNumberish) => {
    console.log("\n\n\n==========================================================\n\n\n")
    rl.question('If you want to sell, plz input "sell" and press enter: \n\n', async (data) => {
        const input = data.toString().trim()
        if (input === 'sell') {
            timesChecked = 1000000
        } else {
            console.log('Received input invalid :\t', input)
            inputAction(accountId, mint, amount)
        }
    })
}

const run = async () => {
    // console.log("here")
    await init();

    trackWallet(solanaConnection);

    const runTimestamp = Math.floor(new Date().getTime() / 1000);
    console.log("runTimestamp==============", runTimestamp);
    const raydiumSubscriptionId = solanaConnection.onProgramAccountChange(
        RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
        async (updatedAccountInfo) => {
            const key = updatedAccountInfo.accountId.toString();
            const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data)
            const poolOpenTime = parseInt(poolState.poolOpenTime.toString())
            const existing = existingLiquidityPools.has(key)




            if (poolOpenTime > runTimestamp && !existing) {
                console.log("poolOpenTime===========", poolOpenTime)
                console.log("existing===========", existing)
                console.log("runTimestamp===========", runTimestamp)
                existingLiquidityPools.add(key)

                console.log("existingLiquidityPools================", existingLiquidityPools)
                const _ = processRaydiumPool(updatedAccountInfo.accountId, poolState)
                poolId = updatedAccountInfo.accountId;
                console.log("this is poolId=============", poolId);
                console.log("this is poolOpenTime=============", poolOpenTime);
                console.log("this is runTimestamp=============", runTimestamp);
                console.log("this is key=============", key);
            }

        },

        COMMITMENT_LEVEL,

        [
            { dataSize: LIQUIDITY_STATE_LAYOUT_V4.span },
            {
                memcmp: {
                    offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
                    bytes: quoteToken.mint.toBase58(),
                },
            },
            {
                memcmp: {
                    offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('marketProgramId'),
                    bytes: OPENBOOK_PROGRAM_ID.toBase58(),
                },
            },
            {
                memcmp: {
                    offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('status'),
                    bytes: bs58.encode([6, 0, 0, 0, 0, 0, 0, 0]),
                },
            },
        ],
    )


    const openBookSubscriptionId = solanaConnection.onProgramAccountChange(
        OPENBOOK_PROGRAM_ID,
        async (updatedAccounteInfo) => {
            const key = updatedAccounteInfo.accountId.toString()
            const existing = existingOpenBookMarkets.has(key)
            if (!existing) {
                existingOpenBookMarkets.add(key)
                const _ = processOpenBookMarket(updatedAccounteInfo)
            }
        },
        COMMITMENT_LEVEL,
        [
            { dataSize: MARKET_STATE_LAYOUT_V3.span },
            {
                memcmp: {
                    offset: MARKET_STATE_LAYOUT_V3.offsetOf('quoteMint'),
                    bytes: quoteToken.mint.toBase58(),
                }
            }
        ]
    )


    const walletSubscriptionId = solanaConnection.onProgramAccountChange(
        TOKEN_PROGRAM_ID,
        async (updatedAccountInfo) => {
            await walletChange(updatedAccountInfo)
        },
        COMMITMENT_LEVEL,
        [
            {
                dataSize: 165,
            },
            {
                memcmp: {
                    offset: 32,
                    bytes: wallet.publicKey.toBase58(),
                },
            },
        ],
    )

    console.log(`Listening for raydium changes: ${raydiumSubscriptionId}`)

    console.log('----------------------------------------')
    console.log('Bot is running! Press CTRL + C to stop it.')
    console.log('----------------------------------------')

}


run()