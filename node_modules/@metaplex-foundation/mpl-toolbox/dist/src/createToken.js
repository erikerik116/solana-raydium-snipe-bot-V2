"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToken = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const generated_1 = require("./generated");
// Instruction.
function createToken(context, input) {
    return (0, umi_1.transactionBuilder)()
        .add((0, generated_1.createAccountWithRent)(context, {
        newAccount: input.token,
        space: (0, generated_1.getTokenSize)(),
        programId: context.programs.get('splToken').publicKey,
    }))
        .add((0, generated_1.initializeToken3)(context, {
        account: input.token.publicKey,
        mint: input.mint,
        owner: input.owner ?? context.identity.publicKey,
    }));
}
exports.createToken = createToken;
//# sourceMappingURL=createToken.js.map