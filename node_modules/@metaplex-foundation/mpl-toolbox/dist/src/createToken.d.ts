import { Context, PublicKey, Signer, TransactionBuilder } from '@metaplex-foundation/umi';
export type CreateTokenArgs = {
    token: Signer;
    mint: PublicKey;
    owner?: PublicKey;
};
export declare function createToken(context: Pick<Context, 'programs' | 'identity' | 'payer'>, input: CreateTokenArgs): TransactionBuilder;
