import { TransactionBuilder } from '@metaplex-foundation/umi';
import { createV1, mintV1 } from './generated';
export declare const createAndMint: (context: Parameters<typeof createV1>[0], input: Parameters<typeof createV1>[1] & Omit<Parameters<typeof mintV1>[1], 'mint'>) => TransactionBuilder;
export declare const createNft: (context: Parameters<typeof createAndMint>[0], input: Omit<Parameters<typeof createAndMint>[1], 'amount' | 'tokenStandard'>) => TransactionBuilder;
export declare const createProgrammableNft: (context: Parameters<typeof createAndMint>[0], input: Omit<Parameters<typeof createAndMint>[1], 'amount' | 'tokenStandard'>) => TransactionBuilder;
export declare const createFungible: (context: Parameters<typeof createV1>[0], input: Omit<Parameters<typeof createV1>[1], 'tokenStandard'>) => TransactionBuilder;
export declare const createFungibleAsset: (context: Parameters<typeof createV1>[0], input: Omit<Parameters<typeof createV1>[1], 'tokenStandard'>) => TransactionBuilder;
