"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeDigitalAssetWithToken = exports.fetchAllDigitalAssetWithTokenByMint = exports.fetchAllDigitalAssetWithTokenByOwnerAndMint = exports.fetchAllDigitalAssetWithTokenByOwner = exports.fetchDigitalAssetWithTokenByMint = exports.fetchDigitalAssetWithAssociatedToken = exports.fetchDigitalAssetWithToken = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const mpl_toolbox_1 = require("@metaplex-foundation/mpl-toolbox");
const digitalAsset_1 = require("./digitalAsset");
const generated_1 = require("./generated");
async function fetchDigitalAssetWithToken(context, mint, token, options) {
    const [mintAccount, metadataAccount, editionAccount, tokenAccount, tokenRecordAccount,] = await context.rpc.getAccounts([
        mint,
        (0, generated_1.findMetadataPda)(context, { mint })[0],
        (0, generated_1.findMasterEditionPda)(context, { mint })[0],
        token,
        (0, generated_1.findTokenRecordPda)(context, { mint, token })[0],
    ], options);
    (0, umi_1.assertAccountExists)(mintAccount, 'Mint');
    (0, umi_1.assertAccountExists)(metadataAccount, 'Metadata');
    (0, umi_1.assertAccountExists)(tokenAccount, 'Token');
    return deserializeDigitalAssetWithToken(mintAccount, metadataAccount, tokenAccount, editionAccount.exists ? editionAccount : undefined, tokenRecordAccount.exists ? tokenRecordAccount : undefined);
}
exports.fetchDigitalAssetWithToken = fetchDigitalAssetWithToken;
async function fetchDigitalAssetWithAssociatedToken(context, mint, owner, options) {
    const [token] = (0, mpl_toolbox_1.findAssociatedTokenPda)(context, { mint, owner });
    return fetchDigitalAssetWithToken(context, mint, token, options);
}
exports.fetchDigitalAssetWithAssociatedToken = fetchDigitalAssetWithAssociatedToken;
async function fetchDigitalAssetWithTokenByMint(context, mint, options) {
    const digitalAssets = await fetchAllDigitalAssetWithTokenByMint(context, mint, options);
    if (digitalAssets.length === 0) {
        throw new Error('No valid token accounts found for the provided mint');
    }
    if (digitalAssets.length > 1) {
        throw new Error('Multiple valid token accounts found for the provided mint' +
            'use `fetchAllDigitalAssetWithTokenByMint` instead to retrieve them all.');
    }
    return digitalAssets[0];
}
exports.fetchDigitalAssetWithTokenByMint = fetchDigitalAssetWithTokenByMint;
async function fetchAllDigitalAssetWithTokenByOwner(context, owner, options) {
    const tokens = await (0, mpl_toolbox_1.fetchAllTokenByOwner)(context, owner, options);
    const accountsToFetch = tokens.flatMap((token) => [
        token.mint,
        (0, generated_1.findMetadataPda)(context, { mint: token.mint })[0],
        (0, generated_1.findMasterEditionPda)(context, { mint: token.mint })[0],
        (0, generated_1.findTokenRecordPda)(context, {
            mint: token.mint,
            token: token.publicKey,
        })[0],
    ]);
    const accounts = await context.rpc.getAccounts(accountsToFetch, options);
    return (0, umi_1.zipMap)(tokens, (0, umi_1.chunk)(accounts, 4), (token, otherAccounts) => {
        if (!otherAccounts || otherAccounts.length !== 4) {
            return [];
        }
        const [mintAccount, metadataAccount, editionAccount, tokenRecordAccount] = otherAccounts;
        if (!mintAccount.exists || !metadataAccount.exists) {
            return [];
        }
        try {
            return [
                {
                    ...(0, digitalAsset_1.deserializeDigitalAsset)(mintAccount, metadataAccount, editionAccount.exists ? editionAccount : undefined),
                    token,
                    tokenRecord: tokenRecordAccount.exists
                        ? (0, generated_1.deserializeTokenRecord)(tokenRecordAccount)
                        : undefined,
                },
            ];
        }
        catch (e) {
            return [];
        }
    }).flat();
}
exports.fetchAllDigitalAssetWithTokenByOwner = fetchAllDigitalAssetWithTokenByOwner;
function fetchAllDigitalAssetWithTokenByOwnerAndMint(context, owner, mint, options) {
    return fetchAllDigitalAssetWithTokenByOwner(context, owner, {
        ...options,
        mint,
    });
}
exports.fetchAllDigitalAssetWithTokenByOwnerAndMint = fetchAllDigitalAssetWithTokenByOwnerAndMint;
/**
 * Retrives the largest 20 token accounts only for performance reasons.
 * For a more robust solution, please use an external indexer.
 */
async function fetchAllDigitalAssetWithTokenByMint(context, mint, options) {
    const largestTokens = await (0, mpl_toolbox_1.findLargestTokensByMint)(context, mint, options);
    const nonEmptyTokens = largestTokens
        .filter((token) => token.amount.basisPoints > 0)
        .map((token) => token.publicKey);
    const accountsToFetch = [
        mint,
        (0, generated_1.findMetadataPda)(context, { mint })[0],
        (0, generated_1.findMasterEditionPda)(context, { mint })[0],
    ];
    accountsToFetch.push(...nonEmptyTokens.flatMap((token) => [
        token,
        (0, generated_1.findTokenRecordPda)(context, { mint, token })[0],
    ]));
    const accounts = await context.rpc.getAccounts(accountsToFetch, options);
    const [mintAccount, metadataAccount, editionAccount, ...tokenAccounts] = accounts;
    (0, umi_1.assertAccountExists)(mintAccount, 'Mint');
    (0, umi_1.assertAccountExists)(metadataAccount, 'Metadata');
    return (0, umi_1.chunk)(tokenAccounts, 2).flatMap(([tokenAccount, tokenRecordAccount]) => {
        if (!tokenAccount.exists)
            return [];
        return [
            deserializeDigitalAssetWithToken(mintAccount, metadataAccount, tokenAccount, editionAccount.exists ? editionAccount : undefined, tokenRecordAccount.exists ? tokenRecordAccount : undefined),
        ];
    });
}
exports.fetchAllDigitalAssetWithTokenByMint = fetchAllDigitalAssetWithTokenByMint;
function deserializeDigitalAssetWithToken(mintAccount, metadataAccount, tokenAccount, editionAccount, tokenRecordAccount) {
    return {
        ...(0, digitalAsset_1.deserializeDigitalAsset)(mintAccount, metadataAccount, editionAccount),
        token: (0, mpl_toolbox_1.deserializeToken)(tokenAccount),
        tokenRecord: tokenRecordAccount
            ? (0, generated_1.deserializeTokenRecord)(tokenRecordAccount)
            : undefined,
    };
}
exports.deserializeDigitalAssetWithToken = deserializeDigitalAssetWithToken;
//# sourceMappingURL=digitalAssetWithToken.js.map