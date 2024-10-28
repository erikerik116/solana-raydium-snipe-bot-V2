"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mplEssentials = exports.mplToolbox = void 0;
const umi_1 = require("@metaplex-foundation/umi");
const generated_1 = require("./generated");
const mplToolbox = () => ({
    install(umi) {
        umi.programs.add((0, generated_1.createSplSystemProgram)(), false);
        umi.programs.add((0, generated_1.createSplMemoProgram)(), false);
        umi.programs.add((0, generated_1.createSplTokenProgram)(), false);
        umi.programs.add((0, generated_1.createSplAssociatedTokenProgram)(), false);
        umi.programs.add((0, generated_1.createSplAddressLookupTableProgram)(), false);
        umi.programs.add((0, generated_1.createMplSystemExtrasProgram)(), false);
        umi.programs.add((0, generated_1.createMplTokenExtrasProgram)(), false);
        // Token 2022.
        // For now, we just register it as a splToken program for feature parity.
        umi.programs.add({
            ...(0, generated_1.createSplTokenProgram)(),
            name: 'splToken2022',
            publicKey: (0, umi_1.publicKey)('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
        }, false);
    },
});
exports.mplToolbox = mplToolbox;
/** @deprecated Use `mplToolbox` instead. */
exports.mplEssentials = exports.mplToolbox;
//# sourceMappingURL=plugin.js.map