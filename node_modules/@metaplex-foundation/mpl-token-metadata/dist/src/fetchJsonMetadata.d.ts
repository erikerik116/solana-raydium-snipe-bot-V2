import { Context } from '@metaplex-foundation/umi';
export type JsonMetadata = {
    name?: string;
    symbol?: string;
    description?: string;
    seller_fee_basis_points?: number;
    image?: string;
    animation_url?: string;
    external_url?: string;
    attributes?: Array<{
        trait_type?: string;
        value?: string;
        [key: string]: unknown;
    }>;
    properties?: {
        creators?: Array<{
            address?: string;
            share?: number;
            [key: string]: unknown;
        }>;
        files?: Array<{
            type?: string;
            uri?: string;
            [key: string]: unknown;
        }>;
        [key: string]: unknown;
    };
    collection?: {
        name?: string;
        family?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};
export declare const fetchJsonMetadata: (context: Pick<Context, 'downloader'>, uri: string) => Promise<JsonMetadata>;
