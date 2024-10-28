import { Context, OptionOrNullable, PublicKey, Signer, TransactionBuilder } from '@metaplex-foundation/umi';
export type CreateMintArgs = {
    mint: Signer;
    decimals?: number;
    mintAuthority?: PublicKey;
    freezeAuthority?: OptionOrNullable<PublicKey>;
};
export declare function createMint(context: Pick<Context, 'programs' | 'identity' | 'payer'>, input: CreateMintArgs): TransactionBuilder;
