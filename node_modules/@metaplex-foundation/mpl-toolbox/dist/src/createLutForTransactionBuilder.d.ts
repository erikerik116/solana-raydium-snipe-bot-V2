import { AddressLookupTableInput, Context, Signer, TransactionBuilder } from '@metaplex-foundation/umi';
export declare const createLutForTransactionBuilder: (context: Pick<Context, 'eddsa' | 'programs' | 'transactions' | 'identity' | 'payer'>, builder: TransactionBuilder, recentSlot: number, authority?: Signer) => [TransactionBuilder[], AddressLookupTableInput[]];
