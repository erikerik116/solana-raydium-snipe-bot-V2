





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

import { logger, } from './utils'

import {

    LOG_LEVEL,
    PRIVATE_KEY,
    RPC_ENDPOINT,
    RPC_WEBSOCKET_ENDPOINT,
    QUOTE_MINT,
    QUOTE_AMOUNT,
    MIN_POOL_SIZE,
    MAX_POOL_SIZE,
    USE_SNIPE_LIST,
    CHECK_IF_MINT_IS_RENOUNCED,
    CHECK_SOCIAL,
    ONE_TOKEN_AT_A_TIME,
    COMMITMENT_LEVEL



} from './constants'

import bs58 from 'bs58';
import * as fs from 'fs'
import * as path from 'path'
import readline from 'readline'
import { getTokenAccounts, } from './liquidity'
import { getMinimalMarketV3, MinimalMarketLayoutV3 } from './market'


export interface MinimalTokenAccountData {
    mint: PublicKey
    address: PublicKey
    poolkey?: LiquidityPoolKeys
    market?: MinimalMarketLayoutV3
}




const existingTokenAccounts: Map<string, MinimalTokenAccountData> = new Map<string, MinimalTokenAccountData>







let wallet: Keypair
let quoteToken: Token
let quoteTokenAssociatedAddress: PublicKey
let quoteAmount: TokenAmount
let quoteMinPoolSizeAmount: TokenAmount
let quoteMaxPoolSizeAmount: TokenAmount
// let processingToken: Boolean = false
// let poolId: PublicKey
// let tokenAccountInCommon: MinimalTokenAccountData | undefined
// let accountDataInCommon: LiquidityStateV4 | undefined
// let idDealt: string = NATIVE_MINT.toBase58()
let snipeList: string[] = []
// let timesChecked: number = 0
// let soldSome: boolean = false


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
    if (!(!wsolBalance || wsolBalance == 0))

        loadSnipeList();

}

function loadSnipeList() {
    if (!USE_SNIPE_LIST) {
        return
    }

    const count = snipeList.length
    const data = fs.readFileSync(path.join(__dirname, 'snipe-list.txt'), 'utf-8')
    snipeList = data.split('\n').map((a) => a.trim())
        .filter((a) => a)

    if (snipeList.length != count) {
        console.log(`Loaded snipe list:${snipeList.length}`)
    }

}


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



const run = async () => {
    // console.log("here")
    await init();

    trackWallet(solanaConnection);




}


run()