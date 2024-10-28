"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMint = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const generated_1 = require("./generated");
// Instruction.
function createMint(context, input) {
    return (0, umi_1.transactionBuilder)()
        .add((0, generated_1.createAccountWithRent)(context, {
        newAccount: input.mint,
        space: (0, generated_1.getMintSize)(),
        programId: context.programs.get('splToken').publicKey,
    }))
        .add((0, generated_1.initializeMint2)(context, {
        mint: input.mint.publicKey,
        decimals: input.decimals ?? 0,
        mintAuthority: input.mintAuthority ?? context.identity.publicKey,
        freezeAuthority: input.freezeAuthority === undefined
            ? (0, umi_1.some)(context.identity.publicKey)
            : input.freezeAuthority,
    }));
}
exports.createMint = createMint;
//# sourceMappingURL=createMint.js.map