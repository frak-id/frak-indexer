import { vpc } from "./common.ts";
import { erpcService } from "./erpc.ts";

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
        "pnpm",
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
const cloudmapNamespaceId = vpc.nodes.cloudmapNamespace.id;
const cloudmapErpcUrl = `http://${cloudmapNamespaceId}.${erpcService.nodes.cloudmapService.name}/ponder-dev-rpc/evm`;
const externalErpcUrl = "https://rpc.frak-labs.com/ponder-dev-rpc/evm";

export const ponderEnv = {
    environment: {
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
