import { Context, Pda, PublicKey } from '@metaplex-foundation/umi';
export declare function findAssociatedTokenPda(context: Pick<Context, 'eddsa' | 'programs'>, seeds: {
    /** The address of the mint account */
    mint: PublicKey;
    /** The owner of the token account */
    owner: PublicKey;
    /** The Token or Token2022 Program id */
    tokenProgramId?: PublicKey;
}): Pda;
