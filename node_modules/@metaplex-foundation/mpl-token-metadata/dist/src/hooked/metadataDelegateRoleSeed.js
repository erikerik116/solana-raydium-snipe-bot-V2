"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetadataDelegateRoleSeedSerializer = void 0;
const serializers_1 = require("@metaplex-foundation/umi/serializers");
const errors_1 = require("../errors");
const metadataDelegateRole_1 = require("../generated/types/metadataDelegateRole");
function getMetadataDelegateRoleSeedSerializer() {
    return (0, serializers_1.mapSerializer)((0, serializers_1.string)({ size: 'variable' }), (args) => {
        if (typeof args === 'string')
            return args;
        switch (args) {
            case metadataDelegateRole_1.MetadataDelegateRole.AuthorityItem:
                return 'authority_item_delegate';
            case metadataDelegateRole_1.MetadataDelegateRole.Collection:
                return 'collection_delegate';
            case metadataDelegateRole_1.MetadataDelegateRole.Use:
                return 'use_delegate';
            case metadataDelegateRole_1.MetadataDelegateRole.Data:
                return 'data_delegate';
            case metadataDelegateRole_1.MetadataDelegateRole.ProgrammableConfig:
                return 'programmable_config_delegate';
            case metadataDelegateRole_1.MetadataDelegateRole.DataItem:
                return 'data_item_delegate';
            case metadataDelegateRole_1.MetadataDelegateRole.CollectionItem:
                return 'collection_item_delegate';
            case metadataDelegateRole_1.MetadataDelegateRole.ProgrammableConfigItem:
                return 'prog_config_item_delegate';
            default:
                throw new errors_1.TokenMetadataError(`Invalid MetadataDelegateRoleArgs ${args}`);
        }
    }, (seed) => seed);
}
exports.getMetadataDelegateRoleSeedSerializer = getMetadataDelegateRoleSeedSerializer;
//# sourceMappingURL=metadataDelegateRoleSeed.js.map