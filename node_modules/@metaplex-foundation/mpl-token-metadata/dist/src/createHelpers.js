"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFungibleAsset = exports.createFungible = exports.createProgrammableNft = exports.createNft = exports.createAndMint = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const generated_1 = require("./generated");
const createAndMint = (context, input) => (0, umi_1.transactionBuilder)()
    .add((0, generated_1.createV1)(context, input))
    .add((0, generated_1.mintV1)(context, { ...input, mint: (0, umi_1.publicKey)(input.mint) }));
exports.createAndMint = createAndMint;
const createNft = (context, input) => (0, exports.createAndMint)(context, {
    ...input,
    tokenStandard: generated_1.TokenStandard.NonFungible,
    amount: 1,
});
exports.createNft = createNft;
const createProgrammableNft = (context, input) => (0, exports.createAndMint)(context, {
    ...input,
    tokenStandard: generated_1.TokenStandard.ProgrammableNonFungible,
    amount: 1,
});
exports.createProgrammableNft = createProgrammableNft;
const createFungible = (context, input) => (0, generated_1.createV1)(context, {
    ...input,
    tokenStandard: generated_1.TokenStandard.Fungible,
});
exports.createFungible = createFungible;
const createFungibleAsset = (context, input) => (0, generated_1.createV1)(context, {
    ...input,
    tokenStandard: generated_1.TokenStandard.FungibleAsset,
});
exports.createFungibleAsset = createFungibleAsset;
//# sourceMappingURL=createHelpers.js.map