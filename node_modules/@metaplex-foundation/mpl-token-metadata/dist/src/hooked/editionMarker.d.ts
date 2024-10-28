import { Pda, PublicKey } from '@metaplex-foundation/umi';
import { findEditionMarkerPda } from '../generated';
export declare function findEditionMarkerFromEditionNumberPda(context: Parameters<typeof findEditionMarkerPda>[0], seeds: {
    /** The address of the mint account */
    mint: PublicKey;
    /** The edition number. */
    editionNumber: number | bigint;
}): Pda;
