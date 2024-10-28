"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findEditionMarkerFromEditionNumberPda = void 0;
const generated_1 = require("../generated");
function findEditionMarkerFromEditionNumberPda(context, seeds) {
    return (0, generated_1.findEditionMarkerPda)(context, {
        mint: seeds.mint,
        editionMarker: (BigInt(seeds.editionNumber) / 248n).toString(10),
    });
}
exports.findEditionMarkerFromEditionNumberPda = findEditionMarkerFromEditionNumberPda;
//# sourceMappingURL=editionMarker.js.map