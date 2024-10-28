"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSysvar = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const getSysvar = (sysvar) => {
    switch (sysvar) {
        case 'clock':
            return (0, umi_1.publicKey)('SysvarC1ock11111111111111111111111111111111');
        case 'epochSchedule':
            return (0, umi_1.publicKey)('SysvarEpochSchedu1e111111111111111111111111');
        case 'instructions':
            return (0, umi_1.publicKey)('Sysvar1nstructions1111111111111111111111111');
        case 'recentBlockhashes':
            return (0, umi_1.publicKey)('SysvarRecentB1ockHashes11111111111111111111');
        case 'rent':
            return (0, umi_1.publicKey)('SysvarRent111111111111111111111111111111111');
        case 'rewards':
            return (0, umi_1.publicKey)('SysvarRewards111111111111111111111111111111');
        case 'slotHashes':
            return (0, umi_1.publicKey)('SysvarS1otHashes111111111111111111111111111');
        case 'slotHistory':
            return (0, umi_1.publicKey)('SysvarS1otHistory11111111111111111111111111');
        case 'stakeHistory':
            return (0, umi_1.publicKey)('SysvarStakeHistory1111111111111111111111111');
        default:
            throw new umi_1.SdkError(`Unknown sysvar: ${sysvar}`);
    }
};
exports.getSysvar = getSysvar;
//# sourceMappingURL=sysvars.js.map