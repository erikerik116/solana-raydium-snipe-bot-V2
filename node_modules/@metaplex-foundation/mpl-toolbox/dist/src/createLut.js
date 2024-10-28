"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLut = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const generated_1 = require("./generated");
// Instruction.
function createLut(context, input) {
    const { addresses, ...rest } = input;
    const authority = input.authority ?? context.identity;
    const address = input.address ??
        (0, generated_1.findAddressLookupTablePda)(context, {
            authority: authority.publicKey,
            recentSlot: input.recentSlot,
        });
    const builder = (0, umi_1.transactionBuilder)()
        .add((0, generated_1.createEmptyLut)(context, rest))
        .add((0, generated_1.extendLut)(context, {
        address,
        authority,
        addresses,
        payer: input.payer,
    }));
    return [builder, { publicKey: address[0], addresses }];
}
exports.createLut = createLut;
//# sourceMappingURL=createLut.js.map