import {
    type Config,
    type ProjectConfig,
    buildAlchemyUpstream,
    buildEnvioUpstream,
    buildEvmNetworks,
    buildPimlicoUpstream,
    buildProject,
    buildRateLimit,
    buildSecretAuthStrategy,
    bundlersMethods,
    envVariable,
} from "@konfeature/erpc-config-generator";
import type { RpcMethodWithRegex } from "@konfeature/erpc-config-generator";
import type { EIP1474Methods } from "viem";
import {
    arbitrum,
    arbitrumSepolia,
    base,
    baseSepolia,
    optimism,
    optimismSepolia,
    polygon,
} from "viem/chains";

/* -------------------------------------------------------------------------- */
/*                  Config generator for the Frak eRPC config                 */
/* -------------------------------------------------------------------------- */

// Build every rate limits
const envioRateLimits = buildRateLimit({
    id: "envio-rate-limit",
    rules: [
        {
            method: "*",
            maxCount: 1_000,
            period: "1s",
        },
    ],
});
const alchemyRateLimits = buildRateLimit({
    id: "alchemy-rate-limit",
    rules: [
        {
            method: "*",
            maxCount: 200,
            period: "1s",
        },
    ],
});
const pimlicoRateLimits = buildRateLimit({
    id: "pimlico-rate-limit",
    rules: [
        {
            method: "*",
            maxCount: 400,
            period: "1s",
        },
    ],
});

// Each networks we will use
const mainnetNetworks = buildEvmNetworks({
    chains: [polygon, arbitrum, optimism, base],
    generic: {
        // Some failsafe config
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
                delay: "5s",
                maxCount: 2,
            },
        },
    },
});
const testnetNetworks = buildEvmNetworks({
    chains: [arbitrumSepolia, optimismSepolia, baseSepolia],
    generic: {
        // Some failsafe config
        failsafe: {
            timeout: {
                duration: "60s",
            },
            retry: {
                maxAttempts: 3,
                delay: "1s",
                backoffMaxDelay: "20s",
                backoffFactor: 0.5,
                jitter: "500ms",
            },
        },
        // Overide finality depth
        evm: {
            finalityDepth: 64,
        },
    },
});
const networks = [...mainnetNetworks, ...testnetNetworks];

const pimlicoSpecificMethods: RpcMethodWithRegex<EIP1474Methods>[] = [
    ...bundlersMethods,
    "pm_*",
    "pimlico_*",
];

// Build each upstream we will use
const upstreams = [
    buildEnvioUpstream({
        rateLimitBudget: envioRateLimits.id,
        ignoreMethods: ["*"],
        allowMethods: [
            // Explicitly set allowed method for envio to remove `eth_getBlockByHash` and `eth_getBlockByNumber`
            //  since they are not returning `baseFeePerGas` attribute required for frontend use
            //  and since eRPC is overing the allowed method if not defined here: https://github.com/erpc/erpc/blob/cafe32b9d231012de5d329e7825589096f5af4b0/vendors/envio.go#L22
            "eth_chainId",
            "eth_blockNumber",
            "eth_getTransactionByHash",
            "eth_getTransactionByBlockHashAndIndex",
            "eth_getTransactionByBlockNumberAndIndex",
            "eth_getTransactionReceipt",
            "eth_getBlockReceipts",
            "eth_getLogs",
            "eth_getFilterLogs",
            "eth_getFilterChanges",
            "eth_uninstallFilter",
            "eth_newFilter",
        ],
    }),
    buildAlchemyUpstream({
        apiKey: envVariable("ALCHEMY_API_KEY"),
        rateLimitBudget: alchemyRateLimits.id,
        ignoreMethods: pimlicoSpecificMethods,
    }),
];
const pimlicoUpstream = buildPimlicoUpstream({
    apiKey: envVariable("PIMLICO_API_KEY"),
    rateLimitBudget: pimlicoRateLimits.id,
    ignoreMethods: ["*"],
    allowMethods: pimlicoSpecificMethods,
});

// Build the ponder indexing project
const ponderProject: ProjectConfig = buildProject({
    id: "ponder-rpc",
    networks,
    upstreams,
    auth: {
        strategies: [
            buildSecretAuthStrategy({
                secret: {
                    value: envVariable("PONDER_RPC_SECRET"),
                },
            }),
        ],
    },
});

// Build the nexus rpc project
// todo: add authentication + more restrictie cors origin
const nexusProject: ProjectConfig = buildProject({
    id: "nexus-rpc",
    networks,
    upstreams: [...upstreams, pimlicoUpstream],
    cors: {
        allowedOrigins: [
            "https://nexus.frak.id",
            "https://nexus-dev.frak.id",
            "http://localhost:3000",
        ],
        allowedMethods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["X-Request-ID"],
        allowCredentials: true,
        maxAge: 3600,
    },
    auth: {
        strategies: [
            buildSecretAuthStrategy({
                secret: {
                    value: envVariable("NEXUS_RPC_SECRET"),
                },
            }),
        ],
    },
});

// Build the global config
const config: Config = {
    logLevel: envVariable("ERPC_LOG_LEVEL"),
    database: {
        evmJsonRpcCache: {
            driver: "postgresql",
            postgresql: {
                connectionUri: envVariable("ERPC_DATABASE_URL"),
                table: "rpc_cache",
            },
        },
    },
    server: {
        httpHost: "0.0.0.0",
        httpPort: 8080,
        maxTimeout: "60s",
    },
    metrics: {
        enabled: true,
        host: "0.0.0.0",
        port: 4001,
    },
    projects: [ponderProject, nexusProject],
    rateLimiters: {
        budgets: [envioRateLimits, alchemyRateLimits, pimlicoRateLimits],
    },
};

export default config;
