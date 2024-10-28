import { Context, Option } from '@metaplex-foundation/umi';
import { CollectionDetailsArgs, CreatorArgs, PrintSupplyArgs, ResolvedAccountsWithIndices, TokenStandard } from '../generated';
export declare const resolveCollectionDetails: (context: any, accounts: any, args: {
    isCollection?: boolean;
}, ...rest: any[]) => Option<CollectionDetailsArgs>;
export declare const resolveIsNonFungible: (context: any, accounts: any, args: {
    tokenStandard?: TokenStandard;
}, ...rest: any[]) => boolean;
export declare const resolveDecimals: (context: any, accounts: any, args: {
    tokenStandard?: TokenStandard;
}, ...rest: any[]) => Option<number>;
export declare const resolvePrintSupply: (context: any, accounts: any, args: {
    tokenStandard?: TokenStandard;
}, ...rest: any[]) => Option<PrintSupplyArgs>;
export declare const resolveCreators: (context: any, accounts: ResolvedAccountsWithIndices, ...rest: any[]) => Option<CreatorArgs[]>;
export declare const resolveCreateV1Bytes: (context: any, accounts: any, args: {
    tokenStandard?: TokenStandard;
}, ...rest: any[]) => number;
export declare const resolveOptionalTokenOwner: (context: Pick<Context, 'identity'>, accounts: ResolvedAccountsWithIndices, ...rest: any[]) => {
    value: null;
} | {
    value: import("@metaplex-foundation/umi").PublicKey<string>;
};
export declare const resolveIsNonFungibleOrIsMintSigner: (context: any, accounts: ResolvedAccountsWithIndices, args: {
    tokenStandard?: TokenStandard;
}, ...rest: any[]) => boolean;
