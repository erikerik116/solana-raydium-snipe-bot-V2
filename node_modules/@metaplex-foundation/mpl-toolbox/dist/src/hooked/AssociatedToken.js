"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAssociatedTokenPda = void 0;
const serializers_1 = require("@metaplex-foundation/umi/serializers");
function findAssociatedTokenPda(context, seeds) {
    const associatedTokenProgramId = context.programs.getPublicKey('splAssociatedToken');
    const tokenProgramIdResolved = seeds.tokenProgramId ?? context.programs.getPublicKey('splToken');
    return context.eddsa.findPda(associatedTokenProgramId, [
        (0, serializers_1.publicKey)().serialize(seeds.owner),
        (0, serializers_1.publicKey)().serialize(tokenProgramIdResolved),
        (0, serializers_1.publicKey)().serialize(seeds.mint),
    ]);
}
exports.findAssociatedTokenPda = findAssociatedTokenPda;
//# sourceMappingURL=AssociatedToken.js.map