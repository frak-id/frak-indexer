import {
    type CacheConfig,
    CacheEmptyBehaviorAllow,
    CacheEmptyBehaviorIgnore,
    type CachePolicyConfig,
    type ConnectorConfig,
    DataFinalityStateFinalized,
    DataFinalityStateRealtime,
    DataFinalityStateUnfinalized,
} from "@erpc-cloud/config";

if (!process.env.ERPC_DATABASE_URL) {
    throw new Error("Missing ERPC_DATABASE_URL environment variable");
}

/**
 * The connectors we will use
 */
const connectors = [
    {
        id: "pg-main",
        driver: "postgresql",
        postgresql: {
            connectionUri: process.env.ERPC_DATABASE_URL as string,
            table: "rpc_cache",
        },
    },
    {
        id: "memory-main",
        driver: "memory",
        memory: {
            maxItems: 65_536,
        },
    },
] as const satisfies ConnectorConfig[];

/**
 * Define the cache policies we will use
 *  todo: Should check with 4337 userOpGas price if it play nicely
 *  todo: Also find a way to cache 4337 related et_getCode method for longer period in memory? Only if non empty maybe?
 */
const cachePolicies = [
    // Cache credits intensive calls on the pg when data are finalised
    {
        connector: "pg-main",
        network: "*",
        method: "eth_getLogs | eth_getBlock* | eth_getTransactionBy* | eth_getStorageAt",
        finality: DataFinalityStateFinalized,
        empty: CacheEmptyBehaviorAllow,
    },
    // Cache not finalized data for 2sec in the memory
    {
        connector: "memory-main",
        network: "*",
        method: "*",
        finality: DataFinalityStateUnfinalized,
        empty: CacheEmptyBehaviorIgnore,
        // 5sec in nanoseconds
        ttl: 2_000_000_000,
    },
    // Cache realtime data for 5sec on the memory on arbitrum
    {
        connector: "memory-main",
        network: "evm:42161",
        method: "*",
        finality: DataFinalityStateRealtime,
        empty: CacheEmptyBehaviorIgnore,
        // 5sec in nanoseconds
        ttl: 5_000_000_000,
    },
    // Cache realtime data for 30sec on arbitrum sepolia
    {
        connector: "memory-main",
        network: "evm:421614",
        method: "*",
        finality: DataFinalityStateRealtime,
        empty: CacheEmptyBehaviorIgnore,
        // 5sec in nanoseconds
        ttl: 30_000_000_000,
    },
] as const satisfies CachePolicyConfig[];

/**
 * Export our final cache config
 */
export const cacheConfig = {
    connectors,
    policies: cachePolicies,
} as const satisfies CacheConfig;
