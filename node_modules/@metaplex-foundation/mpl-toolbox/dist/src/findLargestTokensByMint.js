"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLargestTokensByMint = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const findLargestTokensByMint = async (context, mint, options = {}) => {
    const result = await context.rpc.call('getTokenLargestAccounts', [mint], options);
    return result.value.map(({ address, amount, decimals }) => ({
        publicKey: (0, umi_1.publicKey)(address),
        amount: (0, umi_1.createAmount)(amount, 'splToken', decimals),
    }));
};
exports.findLargestTokensByMint = findLargestTokensByMint;
//# sourceMappingURL=findLargestTokensByMint.js.map