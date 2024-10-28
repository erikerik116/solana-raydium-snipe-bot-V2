import { PublicKey } from '@metaplex-foundation/umi';
export type Sysvar = 'clock' | 'epochSchedule' | 'instructions' | 'recentBlockhashes' | 'rent' | 'rewards' | 'slotHashes' | 'slotHistory' | 'stakeHistory';
export declare const getSysvar: (sysvar: Sysvar) => PublicKey;
