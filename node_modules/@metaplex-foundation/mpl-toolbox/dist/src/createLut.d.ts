import { AddressLookupTableInput, Context, PublicKey, TransactionBuilder } from '@metaplex-foundation/umi';
import { createEmptyLut } from './generated';
export type CreateLutArgs = Parameters<typeof createEmptyLut>[1] & {
    addresses: PublicKey[];
};
export declare function createLut(context: Pick<Context, 'eddsa' | 'programs' | 'identity' | 'payer'>, input: CreateLutArgs): [TransactionBuilder, AddressLookupTableInput];
