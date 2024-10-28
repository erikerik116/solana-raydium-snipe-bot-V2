import { logger, retrieveEnvVariable } from "../utils";
import { Commitment } from "@solana/web3.js";

export const COMMITMENT_LEVEL: Commitment = retrieveEnvVariable("COMMITMENT_LEVEL", logger) as Commitment;
export const LOG_LEVEL = retrieveEnvVariable("LOG_LEVEL", logger);
export const PRIVATE_KEY = retrieveEnvVariable("PRIVATE_KEY", logger);
export const RPC_ENDPOINT = retrieveEnvVariable("RPC_ENDPOINT", logger);
export const RPC_WEBSOCKET_ENDPOINT = retrieveEnvVariable("RPC_WEBSOCKET_ENDPOINT", logger);
export const QUOTE_MINT = retrieveEnvVariable("QUOTE_MINT", logger);
export const QUOTE_AMOUNT = retrieveEnvVariable("QUOTE_AMOUNT", logger);
export const MIN_POOL_SIZE = retrieveEnvVariable("MIN_POOL_SIZE", logger);
export const MAX_POOL_SIZE = retrieveEnvVariable("MAX_POOL_SIZE", logger);
export const USE_SNIPE_LIST = retrieveEnvVariable("USE_SNIPE_LIST", logger);
export const CHECK_IF_MINT_IS_RENOUNCED = retrieveEnvVariable("CHECK_IF_MINT_IS_RENOUNCED", logger);
export const CHECK_SOCIAL = retrieveEnvVariable("CHECK_SOCIAL", logger);
export const ONE_TOKEN_AT_A_TIME = retrieveEnvVariable("ONE_TOKEN_AT_A_TIME", logger);
