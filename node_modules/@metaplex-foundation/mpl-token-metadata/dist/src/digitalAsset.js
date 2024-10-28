"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProgrammable = exports.isNonFungible = exports.isFungible = exports.deserializeDigitalAsset = exports.fetchAllMetadataByOwner = exports.fetchAllDigitalAssetByOwner = exports.fetchAllDigitalAssetByUpdateAuthority = exports.fetchAllDigitalAssetByVerifiedCollection = exports.fetchAllDigitalAssetByCreator = exports.fetchAllDigitalAsset = exports.fetchDigitalAssetByMetadata = exports.fetchDigitalAsset = void 0;
const mpl_toolbox_1 = require("@metaplex-foundation/mpl-toolbox");
const umi_1 = require("@metaplex-foundation/umi");
const errors_1 = require("./errors");
const generated_1 = require("./generated");
const CREATORS_OFFSET = 326;
const MAX_CREATOR_SIZE = 34;
const COLLECTION_OFFSETS = [366, 400, 434, 468, 502];
const VERIFIED_COLLECTION_OFFSET = 1;
const COLLECTION_ADDRESS_OFFSET = 2;
async function fetchDigitalAsset(context, mint, options) {
    const [metadata] = (0, generated_1.findMetadataPda)(context, { mint });
    const [edition] = (0, generated_1.findMasterEditionPda)(context, { mint });
    const [mintAccount, metadataAccount, editionAccount] = await context.rpc.getAccounts([mint, metadata, edition], options);
    (0, umi_1.assertAccountExists)(mintAccount, 'Mint');
    (0, umi_1.assertAccountExists)(metadataAccount, 'Metadata');
    return deserializeDigitalAsset(mintAccount, metadataAccount, editionAccount.exists ? editionAccount : undefined);
}
exports.fetchDigitalAsset = fetchDigitalAsset;
async function fetchDigitalAssetByMetadata(context, metadata, options) {
    const metadataAccount = await (0, generated_1.fetchMetadata)(context, metadata, options);
    return fetchDigitalAsset(context, metadataAccount.mint, options);
}
exports.fetchDigitalAssetByMetadata = fetchDigitalAssetByMetadata;
async function fetchAllDigitalAsset(context, mints, options) {
    const accountsToFetch = mints.flatMap((mint) => [
        mint,
        (0, generated_1.findMetadataPda)(context, { mint })[0],
        (0, generated_1.findMasterEditionPda)(context, { mint })[0],
    ]);
    const accounts = await context.rpc.getAccounts(accountsToFetch, options);
    return (0, umi_1.chunk)(accounts, 3).flatMap(([mintAccount, metadataAccount, editionAccount]) => {
        try {
            (0, umi_1.assertAccountExists)(mintAccount, 'Mint');
            (0, umi_1.assertAccountExists)(metadataAccount, 'Metadata');
            return [
                deserializeDigitalAsset(mintAccount, metadataAccount, editionAccount.exists ? editionAccount : undefined),
            ];
        }
        catch (e) {
            return [];
        }
    });
}
exports.fetchAllDigitalAsset = fetchAllDigitalAsset;
async function fetchAllDigitalAssetByCreator(context, creator, options) {
    const creatorIndex = (options?.position ?? 1) - 1;
    const mints = await (0, generated_1.getMetadataGpaBuilder)(context)
        .where(CREATORS_OFFSET + creatorIndex * MAX_CREATOR_SIZE, creator)
        .sliceField('mint')
        .getDataAsPublicKeys();
    return fetchAllDigitalAsset(context, mints, options);
}
exports.fetchAllDigitalAssetByCreator = fetchAllDigitalAssetByCreator;
/**
 * Fetches all digital assets from a verified collection. This does not work on older nfts that do not have a tokenStandard set.
 */
async function fetchAllDigitalAssetByVerifiedCollection(context, collectionAddress, options) {
    const mints = await Promise.all(COLLECTION_OFFSETS.map(async (offset) => (0, generated_1.getMetadataGpaBuilder)(context)
        .where(offset, 1)
        .where(offset + VERIFIED_COLLECTION_OFFSET, 1)
        .where(offset + COLLECTION_ADDRESS_OFFSET, collectionAddress)
        .sliceField('mint')
        .getDataAsPublicKeys()));
    return fetchAllDigitalAsset(context, mints.flat(), options);
}
exports.fetchAllDigitalAssetByVerifiedCollection = fetchAllDigitalAssetByVerifiedCollection;
async function fetchAllDigitalAssetByUpdateAuthority(context, updateAuthority, options) {
    const mints = await (0, generated_1.getMetadataGpaBuilder)(context)
        .whereField('updateAuthority', updateAuthority)
        .sliceField('mint')
        .getDataAsPublicKeys();
    return fetchAllDigitalAsset(context, mints, options);
}
exports.fetchAllDigitalAssetByUpdateAuthority = fetchAllDigitalAssetByUpdateAuthority;
async function fetchAllDigitalAssetByOwner(context, owner, options) {
    const mints = await (0, mpl_toolbox_1.fetchAllMintPublicKeyByOwner)(context, owner, options);
    return fetchAllDigitalAsset(context, mints, options);
}
exports.fetchAllDigitalAssetByOwner = fetchAllDigitalAssetByOwner;
async function fetchAllMetadataByOwner(context, owner, options) {
    const mints = await (0, mpl_toolbox_1.fetchAllMintPublicKeyByOwner)(context, owner, options);
    const publicKeys = mints.map((mint) => (0, generated_1.findMetadataPda)(context, { mint })[0]);
    const maybeAccounts = await context.rpc.getAccounts(publicKeys, options);
    return maybeAccounts.flatMap((maybeAccount) => {
        try {
            (0, umi_1.assertAccountExists)(maybeAccount, 'Metadata');
            return [(0, generated_1.deserializeMetadata)(maybeAccount)];
        }
        catch (e) {
            return [];
        }
    });
}
exports.fetchAllMetadataByOwner = fetchAllMetadataByOwner;
function deserializeDigitalAsset(mintAccount, metadataAccount, editionAccount) {
    const mint = (0, mpl_toolbox_1.deserializeMint)(mintAccount);
    const metadata = (0, generated_1.deserializeMetadata)(metadataAccount);
    const tokenStandard = (0, umi_1.unwrapOption)(metadata.tokenStandard);
    if (tokenStandard && (0, exports.isNonFungible)(tokenStandard) && !editionAccount) {
        // TODO(loris): Custom error.
        throw new Error('Edition account must be provided for non-fungible assets.');
    }
    const digitalAsset = { publicKey: mint.publicKey, mint, metadata };
    if (!editionAccount)
        return digitalAsset;
    const editionKey = (0, generated_1.getKeySerializer)().deserialize(editionAccount.data)[0];
    let edition;
    if (editionKey === generated_1.Key.MasterEditionV1 ||
        editionKey === generated_1.Key.MasterEditionV2) {
        edition = {
            isOriginal: true,
            ...(0, generated_1.deserializeMasterEdition)(editionAccount),
        };
    }
    else if (editionKey === generated_1.Key.EditionV1) {
        edition = {
            isOriginal: false,
            ...(0, generated_1.deserializeEdition)(editionAccount),
        };
    }
    else {
        throw new errors_1.TokenMetadataError(`Invalid key "${editionKey}" for edition account.`);
    }
    return { ...digitalAsset, edition };
}
exports.deserializeDigitalAsset = deserializeDigitalAsset;
const isFungible = (tokenStandard) => tokenStandard === generated_1.TokenStandard.Fungible ||
    tokenStandard === generated_1.TokenStandard.FungibleAsset;
exports.isFungible = isFungible;
const isNonFungible = (tokenStandard) => !(0, exports.isFungible)(tokenStandard);
exports.isNonFungible = isNonFungible;
const isProgrammable = (tokenStandard) => tokenStandard === generated_1.TokenStandard.ProgrammableNonFungible;
exports.isProgrammable = isProgrammable;
//# sourceMappingURL=digitalAsset.js.map