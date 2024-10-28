"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHolderDelegateRoleSeedSerializer = void 0;
const serializers_1 = require("@metaplex-foundation/umi/serializers");
const errors_1 = require("../errors");
const holderDelegateRole_1 = require("../generated/types/holderDelegateRole");
function getHolderDelegateRoleSeedSerializer() {
    return (0, serializers_1.mapSerializer)((0, serializers_1.string)({ size: 'variable' }), (args) => {
        if (typeof args === 'string')
            return args;
        switch (args) {
            case holderDelegateRole_1.HolderDelegateRole.PrintDelegate:
                return 'print_delegate';
            default:
                throw new errors_1.TokenMetadataError(`Invalid PrintDelegateRoleArgs ${args}`);
        }
    }, (seed) => seed);
}
exports.getHolderDelegateRoleSeedSerializer = getHolderDelegateRoleSeedSerializer;
//# sourceMappingURL=holderDelegateRoleSeed.js.map