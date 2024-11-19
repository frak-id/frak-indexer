import {
    type ProjectConfig,
    buildAlchemyUpstream,
    buildEnvioUpstream,
    buildEvmNetworks,
    buildEvmUpstream,
    buildPimlicoUpstream,
    buildProject,
    buildRateLimit,
    buildSecretAuthStrategy,
    bundlersMethods,
    envVariable,
} from "@konfeature/erpc-config-generator";
import {
    type RpcMethodWithRegex,
    buildErpcConfig,
} from "@konfeature/erpc-config-generator";
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
    id: "envion-rate-limit",
    rules: [
        {
            method: "*",
            maxCount: 600,
            period: "1s",
        },
    ],
});
const alchemyRateLimits = buildRateLimit({
    id: "alchemy-rate-limit",
    rules: [
        {
            method: "*",
            maxCount: 400,
            period: "1s",
        },
    ],
});
const blockPiRateLimits = buildRateLimit({
    id: "block-pi-rate-limit",
    rules: [
        {
            method: "*",
            maxCount: 250,
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
            hedge: {
                delay: "5s",
                maxCount: 2,
            },
        },
        // Overide finality depth since arb sepolia could have huge reorgs
        evm: {
            finalityDepth: 2048,
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
// Envio only op for arbitrum sepolia, it's fcked up on arbitrum
// Disabled for now since it's returning incosistant data
const envioUpstream = buildEnvioUpstream({
    rateLimitBudget: envioRateLimits.id,
    ignoreMethods: ["*"],
    // todo: simple port of the vendors/evio.go stuff hereh
    //  since ts sdk doesn't support null value if ts definition doesn't give optional stuff
    allowMethods: [
        "eth_chainId",
        "eth_blockNumber",
        "eth_getBlockByNumber",
        "eth_getBlockByHash",
        "eth_getTransactionByHash",
        "eth_getTransactionByBlockHashAndIndex",
        "eth_getTransactionByBlockNumberAndIndex",
        "eth_getTransactionReceipt",
        "eth_getBlockReceipts",
        "eth_getLogs",
    ],
});
const alchemyUpstream = buildAlchemyUpstream({
    apiKey: envVariable("ALCHEMY_API_KEY"),
    rateLimitBudget: alchemyRateLimits.id,
    ignoreMethods: pimlicoSpecificMethods,
});
const _blockpiArbSepoliaUpstream = buildEvmUpstream({
    id: "blockpi-arbSepolia",
    endpoint: `https://arbitrum-sepolia.blockpi.network/v1/rpc/${envVariable("BLOCKPI_API_KEY_ARB_SEPOLIA")}`,
    rateLimitBudget: blockPiRateLimits.id,
    ignoreMethods: pimlicoSpecificMethods,
});
const _blockpiArbUpstream = buildEvmUpstream({
    id: "blockpi-arb",
    endpoint: `https://arbitrum.blockpi.network/v1/rpc/${envVariable("BLOCKPI_API_KEY_ARB")}`,
    rateLimitBudget: blockPiRateLimits.id,
    ignoreMethods: pimlicoSpecificMethods,
});
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
    upstreams: [alchemyUpstream, envioUpstream],
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

// Build the ponder indexing project
const ponderDevProject: ProjectConfig = buildProject({
    id: "ponder-dev-rpc",
    networks,
    upstreams: [alchemyUpstream, envioUpstream],
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
    upstreams: [alchemyUpstream, pimlicoUpstream],
    cors: {
        allowedOrigins: ["*"],
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
export default buildErpcConfig({
    config: {
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
            httpPort: 8080,
            maxTimeout: "60s",
            listenV6: false,
        },
        metrics: {
            enabled: true,
            listenV6: false,
        },
        projects: [ponderProject, ponderDevProject, nexusProject],
        rateLimiters: {
            budgets: [
                envioRateLimits,
                alchemyRateLimits,
                pimlicoRateLimits,
                blockPiRateLimits,
            ],
        },
    },
});
