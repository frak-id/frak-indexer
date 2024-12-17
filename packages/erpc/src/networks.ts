import type { NetworkConfig } from "@erpc-cloud/config";

export const arbNetwork = {
    architecture: "evm",
    failsafe: {
        timeout: {
            duration: "30s",
        },
        retry: {
            maxAttempts: 5,
            delay: "500ms",
            backoffMaxDelay: "10s",
            backoffFactor: 0.5,
            jitter: "200ms",
        },
        hedge: {
            delay: "3s",
            maxCount: 2,
        },
    },
    evm: {
        chainId: 42161,
    },
} as const satisfies NetworkConfig;

export const arbSepoliaNetwork = {
    architecture: "evm",
    failsafe: {
        timeout: {
            duration: "120s",
        },
        retry: {
            maxAttempts: 3,
            delay: "1s",
            backoffMaxDelay: "30s",
            backoffFactor: 0.5,
            jitter: "200ms",
        },
        hedge: {
            delay: "5s",
            maxCount: 2,
        },
    },
    evm: {
        chainId: 421614,
    },
} as const satisfies NetworkConfig;
