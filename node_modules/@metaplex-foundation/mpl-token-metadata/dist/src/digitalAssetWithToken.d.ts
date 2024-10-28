import { Context, PublicKey, RpcAccount, RpcBaseOptions, RpcGetAccountsOptions } from '@metaplex-foundation/umi';
import { FetchTokenAmountFilter, FetchTokenStrategy, Token } from '@metaplex-foundation/mpl-toolbox';
import { DigitalAsset } from './digitalAsset';
import { TokenRecord } from './generated';
export type DigitalAssetWithToken = DigitalAsset & {
    token: Token;
    tokenRecord?: TokenRecord;
};
export declare function fetchDigitalAssetWithToken(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, mint: PublicKey, token: PublicKey, options?: RpcGetAccountsOptions): Promise<DigitalAssetWithToken>;
export declare function fetchDigitalAssetWithAssociatedToken(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, mint: PublicKey, owner: PublicKey, options?: RpcGetAccountsOptions): Promise<DigitalAssetWithToken>;
export declare function fetchDigitalAssetWithTokenByMint(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, mint: PublicKey, options?: RpcBaseOptions): Promise<DigitalAssetWithToken>;
export declare function fetchAllDigitalAssetWithTokenByOwner(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, owner: PublicKey, options?: RpcBaseOptions & {
    mint?: PublicKey;
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
}): Promise<DigitalAssetWithToken[]>;
export declare function fetchAllDigitalAssetWithTokenByOwnerAndMint(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, owner: PublicKey, mint: PublicKey, options?: RpcBaseOptions): Promise<DigitalAssetWithToken[]>;
/**
 * Retrives the largest 20 token accounts only for performance reasons.
 * For a more robust solution, please use an external indexer.
 */
export declare function fetchAllDigitalAssetWithTokenByMint(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, mint: PublicKey, options?: RpcBaseOptions): Promise<DigitalAssetWithToken[]>;
export declare function deserializeDigitalAssetWithToken(mintAccount: RpcAccount, metadataAccount: RpcAccount, tokenAccount: RpcAccount, editionAccount?: RpcAccount, tokenRecordAccount?: RpcAccount): DigitalAssetWithToken;
