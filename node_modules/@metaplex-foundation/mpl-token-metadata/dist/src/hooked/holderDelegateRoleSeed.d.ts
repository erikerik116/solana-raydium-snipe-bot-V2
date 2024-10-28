import { Serializer } from '@metaplex-foundation/umi/serializers';
import { HolderDelegateRole } from '../generated/types/holderDelegateRole';
export type HolderDelegateRoleSeed = 'print_delegate';
export type HolderDelegateRoleSeedArgs = HolderDelegateRoleSeed | HolderDelegateRole;
export declare function getHolderDelegateRoleSeedSerializer(): Serializer<HolderDelegateRoleSeedArgs, HolderDelegateRoleSeed>;
