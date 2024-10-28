"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTokensByOwnerAndMint = exports.fetchTokensByOwner = exports.fetchAllMintByOwner = exports.fetchAllMintPublicKeyByOwner = exports.fetchAllTokenByOwnerAndMint = exports.fetchAllTokenByOwner = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const serializers_1 = require("@metaplex-foundation/umi/serializers");
const generated_1 = require("./generated");
const getTokenAccountsByOwnerCall = async (context, owner, tokenAmountFilter, options = {}) => {
    const splToken = context.programs.get('splToken').publicKey;
    const filter = options.mint
        ? { mint: options.mint }
        : { programId: splToken };
    const result = await context.rpc.call('getTokenAccountsByOwner', [owner, filter], {
        ...options,
        extra: { encoding: 'base64' },
    });
    return result.value.filter(({ account }) => {
        const data = serializers_1.base64.serialize(account.data[0]);
        const amount = (0, serializers_1.u64)().deserialize(data.slice(64, 72))[0];
        return tokenAmountFilter(amount);
    });
};
const fetchAllTokenByOwner = async (context, owner, options = {}) => {
    const { mint, tokenStrategy = 'getProgramAccounts', tokenAmountFilter = (amount) => amount > 0, ...rpcOptions } = options;
    if (tokenStrategy === 'getTokenAccountsByOwner') {
        const result = await getTokenAccountsByOwnerCall(context, owner, tokenAmountFilter, { mint, ...rpcOptions });
        return result.map(({ pubkey, account }) => (0, generated_1.deserializeToken)({
            ...account,
            data: serializers_1.base64.serialize(account.data[0]),
            publicKey: (0, umi_1.publicKey)(pubkey),
            owner: (0, umi_1.publicKey)(account.owner),
            lamports: (0, umi_1.lamports)(account.lamports),
        }));
    }
    let builder = (0, generated_1.getTokenGpaBuilder)(context).whereField('owner', owner);
    if (mint) {
        builder = builder.whereField('mint', mint);
    }
    return (await builder.get())
        .filter((account) => {
        const amount = (0, serializers_1.u64)().deserialize(account.data.slice(64, 72))[0];
        return tokenAmountFilter(amount);
    })
        .map((account) => (0, generated_1.deserializeToken)(account));
};
exports.fetchAllTokenByOwner = fetchAllTokenByOwner;
const fetchAllTokenByOwnerAndMint = (context, owner, mint, options = {}) => (0, exports.fetchAllTokenByOwner)(context, owner, { ...options, mint });
exports.fetchAllTokenByOwnerAndMint = fetchAllTokenByOwnerAndMint;
const fetchAllMintPublicKeyByOwner = async (context, owner, options = {}) => {
    const { tokenStrategy = 'getProgramAccounts', tokenAmountFilter = (amount) => amount > 0, ...rpcOptions } = options;
    if (tokenStrategy === 'getTokenAccountsByOwner') {
        const result = await getTokenAccountsByOwnerCall(context, owner, tokenAmountFilter, rpcOptions);
        return result.map(({ account }) => (0, umi_1.publicKey)(serializers_1.base64.serialize(account.data[0]).slice(0, 32)));
    }
    return (await (0, generated_1.getTokenGpaBuilder)(context)
        .slice(0, 72) // Includes mint, owner and amount.
        .whereField('owner', owner)
        .get())
        .filter((account) => {
        const amount = (0, serializers_1.u64)().deserialize(account.data.slice(64, 72))[0];
        return tokenAmountFilter(amount);
    })
        .map((account) => (0, umi_1.publicKey)(account.data.slice(0, 32)));
};
exports.fetchAllMintPublicKeyByOwner = fetchAllMintPublicKeyByOwner;
const fetchAllMintByOwner = async (context, owner, options = {}) => {
    const { tokenStrategy, tokenAmountFilter, ...rpcOptions } = options;
    const mints = await (0, exports.fetchAllMintPublicKeyByOwner)(context, owner, options);
    return (0, generated_1.fetchAllMint)(context, mints, rpcOptions);
};
exports.fetchAllMintByOwner = fetchAllMintByOwner;
/** @deprecated Use fetchAllTokenByOwner instead. Worry not, it has the same signature. */
exports.fetchTokensByOwner = exports.fetchAllTokenByOwner;
/** @deprecated Use fetchAllTokenByOwnerAndMint instead. Worry not, it has the same signature. */
exports.fetchTokensByOwnerAndMint = exports.fetchAllTokenByOwnerAndMint;
//# sourceMappingURL=fetchAllByOwner.js.map