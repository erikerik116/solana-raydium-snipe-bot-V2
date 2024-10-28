"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchJsonMetadata = void 0;
const errors_1 = require("./errors");
const fetchJsonMetadata = async (context, uri) => {
    try {
        return await context.downloader.downloadJson(uri);
    }
    catch (error) {
        throw new errors_1.TokenMetadataError(`Failed to fetch JSON metadata from ${uri}`, error);
    }
};
exports.fetchJsonMetadata = fetchJsonMetadata;
//# sourceMappingURL=fetchJsonMetadata.js.map