"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenMetadataError = void 0;
const umi_1 = require("@metaplex-foundation/umi");
class TokenMetadataError extends umi_1.UmiError {
    constructor(message, cause) {
        super(message, 'plugin', 'Token Metadata', cause);
        this.name = 'TokenMetadataError';
    }
}
exports.TokenMetadataError = TokenMetadataError;
//# sourceMappingURL=errors.js.map