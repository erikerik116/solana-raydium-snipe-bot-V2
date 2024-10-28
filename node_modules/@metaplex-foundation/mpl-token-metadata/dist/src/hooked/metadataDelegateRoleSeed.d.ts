import { Serializer } from '@metaplex-foundation/umi/serializers';
import { MetadataDelegateRole } from '../generated/types/metadataDelegateRole';
export type MetadataDelegateRoleSeed = 'authority_item_delegate' | 'collection_delegate' | 'use_delegate' | 'data_delegate' | 'programmable_config_delegate' | 'data_item_delegate' | 'collection_item_delegate' | 'prog_config_item_delegate';
export type MetadataDelegateRoleSeedArgs = MetadataDelegateRoleSeed | MetadataDelegateRole;
export declare function getMetadataDelegateRoleSeedSerializer(): Serializer<MetadataDelegateRoleSeedArgs, MetadataDelegateRoleSeed>;
