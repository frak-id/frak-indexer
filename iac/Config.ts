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
        // Alchemy RPC
        new Config.Secret(stack, "ALCHEMY_API_KEY"),
    ];

    // Databases
    const ponderDb = new Config.Secret(stack, "DATABASE_URL");
    const erpcDb = new Config.Secret(stack, "ERPC_DATABASE_URL");

    // Return all of that
    return {
        rpcSecrets,
        ponderDb,
        erpcDb,
    };
}
