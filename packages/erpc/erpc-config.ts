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
            maxCount: 500,
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
const envioUpstream = buildEnvioUpstream();
const alchemyUpstream = buildAlchemyUpstream({
    apiKey: envVariable("ALCHEMY_API_KEY"),
    rateLimitBudget: alchemyRateLimits.id,
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
    upstreams: [envioUpstream, alchemyUpstream],
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
        allowedOrigins: [
            "https://nexus.frak.id",
            "https://nexus-dev.frak.id",
            "http://localhost:30*",
            "https://localhost:30*",
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
            // No cache test
            // driver: "memory",
            // memory: {
            //     maxItems: 1,
            // },
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
        budgets: [alchemyRateLimits, pimlicoRateLimits],
    },
};

export default config;
