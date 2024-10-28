"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLutForTransactionBuilder = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const generated_1 = require("./generated");
const createLutForTransactionBuilder = (context, builder, recentSlot, authority) => {
    const lutAuthority = authority ?? context.identity;
    const signerAddresses = (0, umi_1.uniquePublicKeys)([
        builder.getFeePayer(context).publicKey,
        ...builder.items.flatMap(({ instruction }) => instruction.keys
            .filter((meta) => meta.isSigner)
            .map((meta) => meta.pubkey)),
    ]);
    const extractableAddresses = (0, umi_1.uniquePublicKeys)(builder.items.flatMap(({ instruction }) => [
        instruction.programId,
        ...instruction.keys.map((meta) => meta.pubkey),
    ])).filter((address) => !signerAddresses.includes(address));
    const lutAccounts = [];
    const createLutBuilders = [];
    (0, umi_1.chunk)(extractableAddresses, 256).forEach((addresses, index) => {
        const localRecentSlot = recentSlot - index;
        const [lut] = (0, generated_1.findAddressLookupTablePda)(context, {
            authority: lutAuthority.publicKey,
            recentSlot: localRecentSlot,
        });
        lutAccounts.push({ publicKey: lut, addresses });
        createLutBuilders.push(...generatecreateLutBuilders(context, (0, generated_1.createEmptyLut)(context, { recentSlot: localRecentSlot }), lut, lutAuthority, addresses));
    });
    return [createLutBuilders, lutAccounts];
};
exports.createLutForTransactionBuilder = createLutForTransactionBuilder;
function generatecreateLutBuilders(context, builder, lutAddress, lutAuthority, addresses) {
    const builders = [];
    let addressesThatFit = [];
    let lastValidBuilder = builder;
    addresses.forEach((address) => {
        const newBuilder = builder.add((0, generated_1.extendLut)(context, {
            address: lutAddress,
            addresses: [...addressesThatFit, address],
            authority: lutAuthority,
        }));
        if (newBuilder.fitsInOneTransaction(context)) {
            addressesThatFit.push(address);
            lastValidBuilder = newBuilder;
        }
        else {
            addressesThatFit = [address];
            builders.push(lastValidBuilder);
            builder = builder.empty();
            lastValidBuilder = builder;
        }
    });
    if (addressesThatFit.length > 0) {
        builders.push(lastValidBuilder);
    }
    return builders;
}
//# sourceMappingURL=createLutForTransactionBuilder.js.map