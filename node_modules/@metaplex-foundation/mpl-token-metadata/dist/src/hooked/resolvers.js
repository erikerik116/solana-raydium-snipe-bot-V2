"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveIsNonFungibleOrIsMintSigner = exports.resolveOptionalTokenOwner = exports.resolveCreateV1Bytes = exports.resolveCreators = exports.resolvePrintSupply = exports.resolveDecimals = exports.resolveIsNonFungible = exports.resolveCollectionDetails = void 0;
const mpl_toolbox_1 = require("@metaplex-foundation/mpl-toolbox");
const umi_1 = require("@metaplex-foundation/umi");
const digitalAsset_1 = require("../digitalAsset");
const generated_1 = require("../generated");
const METADATA_SIZE = 679;
const MASTER_EDITION_SIZE = 282;
const resolveCollectionDetails = (context, accounts, args, ...rest) => args.isCollection ? (0, umi_1.some)((0, generated_1.collectionDetails)('V1', { size: 0 })) : (0, umi_1.none)();
exports.resolveCollectionDetails = resolveCollectionDetails;
const resolveIsNonFungible = (context, accounts, args, ...rest) => (0, digitalAsset_1.isNonFungible)((0, generated_1.expectSome)(args.tokenStandard));
exports.resolveIsNonFungible = resolveIsNonFungible;
const resolveDecimals = (context, accounts, args, ...rest) => (0, digitalAsset_1.isNonFungible)((0, generated_1.expectSome)(args.tokenStandard)) ? (0, umi_1.none)() : (0, umi_1.some)(0);
exports.resolveDecimals = resolveDecimals;
const resolvePrintSupply = (context, accounts, args, ...rest) => (0, digitalAsset_1.isNonFungible)((0, generated_1.expectSome)(args.tokenStandard))
    ? (0, umi_1.some)((0, generated_1.printSupply)('Zero'))
    : (0, umi_1.none)();
exports.resolvePrintSupply = resolvePrintSupply;
const resolveCreators = (context, accounts, ...rest) => (0, umi_1.some)([
    {
        address: (0, generated_1.expectPublicKey)(accounts.authority.value),
        share: 100,
        verified: true,
    },
]);
exports.resolveCreators = resolveCreators;
const resolveCreateV1Bytes = (context, accounts, args, ...rest) => {
    const base = (0, mpl_toolbox_1.getMintSize)() + METADATA_SIZE + 2 * umi_1.ACCOUNT_HEADER_SIZE;
    if ((0, digitalAsset_1.isNonFungible)((0, generated_1.expectSome)(args.tokenStandard))) {
        return base + MASTER_EDITION_SIZE + umi_1.ACCOUNT_HEADER_SIZE;
    }
    return base;
};
exports.resolveCreateV1Bytes = resolveCreateV1Bytes;
const resolveOptionalTokenOwner = (context, accounts, ...rest) => accounts.token.value
    ? { value: null }
    : { value: context.identity.publicKey };
exports.resolveOptionalTokenOwner = resolveOptionalTokenOwner;
const resolveIsNonFungibleOrIsMintSigner = (context, accounts, args, ...rest) => (0, digitalAsset_1.isNonFungible)((0, generated_1.expectSome)(args.tokenStandard)) ||
    (0, umi_1.isSigner)((0, generated_1.expectSome)(accounts.mint.value));
exports.resolveIsNonFungibleOrIsMintSigner = resolveIsNonFungibleOrIsMintSigner;
//# sourceMappingURL=resolvers.js.map