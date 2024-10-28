import { Context, PublicKey, Signer, TransactionBuilder } from '@metaplex-foundation/umi';
import { CreateMintArgs } from './createMint';
export type CreateMintWithAssociatedTokenArgs = Omit<CreateMintArgs, 'mintAuthority'> & {
    owner?: PublicKey;
    amount?: number | bigint;
    mintAuthority?: PublicKey | Signer;
};
export declare function createMintWithAssociatedToken(context: Pick<Context, 'programs' | 'identity' | 'payer' | 'eddsa'>, input: CreateMintWithAssociatedTokenArgs): TransactionBuilder;
