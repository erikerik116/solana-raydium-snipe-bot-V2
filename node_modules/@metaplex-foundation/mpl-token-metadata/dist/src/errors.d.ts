import { UmiError } from '@metaplex-foundation/umi';
export declare class TokenMetadataError extends UmiError {
    readonly name: string;
    constructor(message: string, cause?: Error);
}
