import {
    BigNumberish,
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
import { getTokenAccounts, RAYDIUM_LIQUIDITY_PROGRAM_ID_V4, OPENBOOK_PROGRAM_ID, createPoolKeys } from './liquidity'
import { logger } from './utils'
import { getMinimalMarketV3, MinimalMarketLayoutV3 } from './market'
// import { MintLayout } from './types'
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
    console.log(`Wallet Balance: ${(solBalance / 10 ** 9).toFixed(3)}SOL`);

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


    processingToken = true
    console.log("processingToken=======", processingToken);
    await buy(id, poolState)
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



const run = async () => {
    // console.log("here")
    await init();

    trackWallet(solanaConnection);

    const runTimestamp = Math.floor(new Date().getTime() / 1000);
    console.log(runTimestamp);
    const raydiumSubscriptionId = solanaConnection.onProgramAccountChange(
        RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
        async (updatedAccountInfo) => {
            const key = updatedAccountInfo.accountId.toString();
            const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data)
            const poolOpenTime = parseInt(poolState.poolOpenTime.toString())
            const existing = existingLiquidityPools.has(key)
            if (poolOpenTime > runTimestamp && !existing) {
                existingLiquidityPools.add(key)
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

    console.log(`Listening for raydium changes: ${raydiumSubscriptionId}`)

    console.log('----------------------------------------')
    console.log('Bot is running! Press CTRL + C to stop it.')
    console.log('----------------------------------------')

}


run()