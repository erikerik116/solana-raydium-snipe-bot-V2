"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMintWithAssociatedToken = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const createMint_1 = require("./createMint");
const generated_1 = require("./generated");
const hooked_1 = require("./hooked");
// Instruction.
function createMintWithAssociatedToken(context, input) {
    const mintAndOwner = {
        mint: input.mint.publicKey,
        owner: input.owner ?? context.identity.publicKey,
    };
    const amount = input.amount ?? 0;
    let builder = (0, umi_1.transactionBuilder)()
        .add((0, createMint_1.createMint)(context, {
        ...input,
        mintAuthority: input.mintAuthority
            ? (0, umi_1.publicKey)(input.mintAuthority, false)
            : undefined,
    }))
        .add((0, generated_1.createAssociatedToken)(context, mintAndOwner));
    if (amount > 0) {
        builder = builder.add((0, generated_1.mintTokensTo)(context, {
            amount,
            mint: input.mint.publicKey,
            token: (0, hooked_1.findAssociatedTokenPda)(context, mintAndOwner),
            mintAuthority: input.mintAuthority && (0, umi_1.isSigner)(input.mintAuthority)
                ? input.mintAuthority
                : undefined,
        }));
    }
    return builder;
}
exports.createMintWithAssociatedToken = createMintWithAssociatedToken;
//# sourceMappingURL=createMintWithAssociatedToken.js.map