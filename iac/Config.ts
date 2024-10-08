import { Config, type StackContext } from "sst/constructs";

/**
 * Simple stack for the config
 * @param stack
 * @constructor
 */
export function ConfigStack({ stack }: StackContext) {
    // RPCs
    const rpcSecrets = [
        // BlockPi rpcs
        new Config.Secret(stack, "BLOCKPI_API_KEY_ARB_SEPOLIA"),
        new Config.Secret(stack, "BLOCKPI_API_KEY_ARB"),
        // Alchemy RPC
        new Config.Secret(stack, "ALCHEMY_API_KEY"),
    ];

    // Pimlico AA RPC
    const pimlicoApiKey = new Config.Secret(stack, "PIMLICO_API_KEY");

    // Backend secrets
    const ponderRpcSecret = new Config.Secret(stack, "PONDER_RPC_SECRET");
    const nexusRpcSecret = new Config.Secret(stack, "NEXUS_RPC_SECRET");

    // Databases
    const ponderDb = new Config.Secret(stack, "PONDER_DATABASE_URL");
    const erpcDb = new Config.Secret(stack, "ERPC_DATABASE_URL");

    // Return all of that
    return {
        rpcSecrets,
        pimlicoApiKey,
        ponderDb,
        erpcDb,
        ponderRpcSecret,
        nexusRpcSecret,
    };
}
