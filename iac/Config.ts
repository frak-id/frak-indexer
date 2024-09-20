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

    // Pimlico AA RPC
    const pimlicoApiKey = new Config.Secret(stack, "PIMLICO_API_KEY");

    // Backend secrets
    const ponderRpcSecret = new Config.Secret(stack, "PONDER_RPC_SECRET");
    const nexusRpcSecret = new Config.Secret(stack, "NEXUS_RPC_SECRET");

    // Databases
    const ponderDb = new Config.Secret(stack, "DATABASE_URL");
    // const ponderDevDb = new Config.Secret(stack, "DATABASE_URL");
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

/**
 * TODO: How to have multi env around ponder?
 *   - We want both dev and prod to have reader + indexer
 *   - We want dev and prod to be in the same ecs cluster
 *   - We want different db + different images for both
 *   - We want different endpoints for both (maybe even different endpoints altogether? Like rpc.frak.id, indexer.frak.id & indexer-dev.frak.id?)
 *   - So different ECR repository + different secrets to use? Or same db secrets we just suffix the db name at runtime?
 *   - Multi ALB domains would greatly simplify the setup
 *       - independant erpc
 *       - each indexing instances with no ALB
 *       - each reader instances with their own ALB
 * 
 *   - Single ALB gud for erpc
 *   - Now needing: 
 *      - Different ALB ponder
 *      - Different db env (suffix at runtime?)
 *      - Different images (also during CI?)
 */
