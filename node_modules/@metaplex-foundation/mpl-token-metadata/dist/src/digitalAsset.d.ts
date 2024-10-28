import { FetchTokenAmountFilter, FetchTokenStrategy, Mint } from '@metaplex-foundation/mpl-toolbox';
import { Context, Pda, PublicKey, RpcAccount, RpcGetAccountsOptions } from '@metaplex-foundation/umi';
import { Edition, MasterEdition, Metadata, TokenStandard } from './generated';
export type DigitalAsset = {
    publicKey: PublicKey;
    mint: Mint;
    metadata: Metadata;
    edition?: ({
        isOriginal: true;
    } & MasterEdition) | ({
        isOriginal: false;
    } & Edition);
};
export declare function fetchDigitalAsset(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, mint: PublicKey, options?: RpcGetAccountsOptions): Promise<DigitalAsset>;
export declare function fetchDigitalAssetByMetadata(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, metadata: PublicKey | Pda, options?: RpcGetAccountsOptions): Promise<DigitalAsset>;
export declare function fetchAllDigitalAsset(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, mints: PublicKey[], options?: RpcGetAccountsOptions): Promise<DigitalAsset[]>;
export declare function fetchAllDigitalAssetByCreator(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, creator: PublicKey, options?: RpcGetAccountsOptions & {
    position?: number;
}): Promise<DigitalAsset[]>;
/**
 * Fetches all digital assets from a verified collection. This does not work on older nfts that do not have a tokenStandard set.
 */
export declare function fetchAllDigitalAssetByVerifiedCollection(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, collectionAddress: PublicKey, options?: RpcGetAccountsOptions): Promise<DigitalAsset[]>;
export declare function fetchAllDigitalAssetByUpdateAuthority(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, updateAuthority: PublicKey, options?: RpcGetAccountsOptions): Promise<DigitalAsset[]>;
export declare function fetchAllDigitalAssetByOwner(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, owner: PublicKey, options?: RpcGetAccountsOptions & {
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
}): Promise<DigitalAsset[]>;
export declare function fetchAllMetadataByOwner(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, owner: PublicKey, options?: RpcGetAccountsOptions & {
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
}): Promise<Metadata[]>;
export declare function deserializeDigitalAsset(mintAccount: RpcAccount, metadataAccount: RpcAccount, editionAccount?: RpcAccount): DigitalAsset;
export declare const isFungible: (tokenStandard: TokenStandard) => boolean;
export declare const isNonFungible: (tokenStandard: TokenStandard) => boolean;
export declare const isProgrammable: (tokenStandard: TokenStandard) => boolean;
