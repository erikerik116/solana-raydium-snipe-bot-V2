"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mplTokenMetadata = void 0;
const mpl_toolbox_1 = require("@metaplex-foundation/mpl-toolbox");
const generated_1 = require("./generated");
const mplTokenMetadata = () => ({
    install(umi) {
        umi.use((0, mpl_toolbox_1.mplToolbox)());
        umi.programs.add((0, generated_1.createMplTokenMetadataProgram)(), false);
    },
});
exports.mplTokenMetadata = mplTokenMetadata;
//# sourceMappingURL=plugin.js.map