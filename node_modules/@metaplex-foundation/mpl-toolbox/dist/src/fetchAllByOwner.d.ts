import { Context, PublicKey, RpcBaseOptions } from '@metaplex-foundation/umi';
import { Mint, Token } from './generated';
/**
 * The strategy to use when fetching token accounts.
 * - `getTokenAccountsByOwner` is the default and uses the `getTokenAccountsByOwner` RPC call.
 * - `getProgramAccounts` uses a `getProgramAccounts` RPC call to fetch the tokens.
 * It is slightly faster but may be disabled on some RPC nodes.
 *
 * @defaultValue `'getTokenAccountsByOwner'`
 */
export type FetchTokenStrategy = 'getTokenAccountsByOwner' | 'getProgramAccounts';
/**
 * A callback to filter token accounts by their amount.
 *
 * @defaultValue `(amount) => amount > 0`
 */
export type FetchTokenAmountFilter = (amount: bigint) => boolean;
export declare const fetchAllTokenByOwner: (context: Pick<Context, 'rpc' | 'programs'>, owner: PublicKey, options?: RpcBaseOptions & {
    mint?: PublicKey;
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
}) => Promise<Array<Token>>;
export declare const fetchAllTokenByOwnerAndMint: (context: Pick<Context, 'rpc' | 'programs'>, owner: PublicKey, mint: PublicKey, options?: RpcBaseOptions & {
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
}) => Promise<Array<Token>>;
export declare const fetchAllMintPublicKeyByOwner: (context: Pick<Context, 'rpc' | 'programs'>, owner: PublicKey, options?: RpcBaseOptions & {
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
}) => Promise<Array<PublicKey>>;
export declare const fetchAllMintByOwner: (context: Pick<Context, 'rpc' | 'programs'>, owner: PublicKey, options?: RpcBaseOptions & {
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
}) => Promise<Array<Mint>>;
/** @deprecated Use fetchAllTokenByOwner instead. Worry not, it has the same signature. */
export declare const fetchTokensByOwner: (context: Pick<Context, 'rpc' | 'programs'>, owner: PublicKey, options?: RpcBaseOptions & {
    mint?: PublicKey;
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
}) => Promise<Array<Token>>;
/** @deprecated Use fetchAllTokenByOwnerAndMint instead. Worry not, it has the same signature. */
export declare const fetchTokensByOwnerAndMint: (context: Pick<Context, 'rpc' | 'programs'>, owner: PublicKey, mint: PublicKey, options?: RpcBaseOptions & {
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
}) => Promise<Array<Token>>;
