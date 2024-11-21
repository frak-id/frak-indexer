import { vpc } from "./common.ts";

/**
 * Get the ponder entrypoint
 * @param type
 */
export function getPonderEntrypoint(type: "indexer" | "reader") {
    const isProd = $app.stage === "production";
    const logLevel = isProd ? "warn" : "info";
    const configPath = isProd
        ? "config/config-prod.ts"
        : "config/config-dev.ts";
    const command = type === "indexer" ? "start" : "serve";

    return [
        "bun",
        "ponder",
        "--log-format",
        "json",
        "--log-level",
        logLevel,
        "--config",
        configPath,
        command,
    ];
}

/**
 * Get the ponder env and ssm variable
 */
const erpcProject =
    $app.stage === "production" ? "ponder-rpc" : "ponder-dev-rpc";
const cloudmapErpcUrl = vpc.nodes.cloudmapNamespace.name.apply(
    (namespaceName) =>
        `http://Erpc.production.frak-indexer.${namespaceName}:8080/${erpcProject}/evm`
);
const externalErpcUrl = `https://rpc.frak-labs.com/${erpcProject}/evm`;

export const ponderEnv = {
    environment: {
        // For legacy images
        ERPC_URL: cloudmapErpcUrl,
        INTERNAL_RPC_URL: cloudmapErpcUrl,
        EXTERNAL_RPC_URL: externalErpcUrl,
    },
    ssm: {
        // Endpoints secrets,
        PONDER_RPC_SECRET:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/sst/frak-indexer/.fallback/Secret/PONDER_RPC_SECRET/value",
        // Postgres db
        PONDER_DATABASE_URL:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/indexer/sst/Secret/PONDER_DATABASE_URL/value",
    },
};
