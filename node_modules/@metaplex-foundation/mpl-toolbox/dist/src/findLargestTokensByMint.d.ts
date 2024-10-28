import { Amount, Context, PublicKey, RpcCallOptions } from '@metaplex-foundation/umi';
export type FindLargestTokensByMintResult = Array<{
    publicKey: PublicKey;
    amount: Amount<'splToken'>;
}>;
export declare const findLargestTokensByMint: (context: Pick<Context, 'rpc'>, mint: PublicKey, options?: RpcCallOptions) => Promise<FindLargestTokensByMintResult>;
