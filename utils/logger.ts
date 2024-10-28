import { Base } from "@raydium-io/raydium-sdk";
import pino from "pino";
import { clearLine } from 'readline';

const transport = pino.transport({
    target: 'pino-pretty',
});

export const logger = pino(
    {
        level: 'info',
        redact: ['poolKeys'],
        serializers: {
            error: pino.stdSerializers.err,
        },
        base: undefined,
    },
    transport,
);
