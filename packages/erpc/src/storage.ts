import {
    type CacheConfig,
    CacheEmptyBehaviorAllow,
    type CachePolicyConfig,
    type ConnectorConfig,
    DataFinalityStateFinalized,
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
    // {
    //     id: "memory-unfinalized",
    //     driver: "memory",
    //     memory: {
    //         // max 4k items for unfinalized cache
    //         maxItems: 4_096,
    //     },
    // },
    // {
    //     id: "memory-realtime",
    //     driver: "memory",
    //     memory: {
    //         // Max 4k items for realtime cache
    //         maxItems: 4_096,
    //     },
    // },
] as const satisfies ConnectorConfig[];

/**
 * Define the cache policies we will use
 *  todo: Should check with 4337 userOpGas price if it play nicely
 *  todo: Also find a way to cache 4337 related et_getCode method for longer period in memory? Only if non empty maybe?
 */
const cachePolicies = [
    // Cache all finalized data in the pg database
    {
        connector: "pg-main",
        network: "*",
        method: "*",
        finality: DataFinalityStateFinalized,
        empty: CacheEmptyBehaviorAllow,
    },
    // // Cache not finalized data for 2sec in the memory
    // {
    //     connector: "memory-unfinalized",
    //     network: "*",
    //     method: "*",
    //     finality: DataFinalityStateUnfinalized,
    //     empty: CacheEmptyBehaviorIgnore,
    //     // 2sec in nanoseconds
    //     ttl: 2_000_000_000,
    //     maxItemSize: "20kb",
    // },
    // // Cache realtime data for 2sec on the memory on arbitrum
    // {
    //     connector: "memory-realtime",
    //     network: "evm:42161",
    //     method: "*",
    //     finality: DataFinalityStateRealtime,
    //     empty: CacheEmptyBehaviorIgnore,
    //     // 2sec in nanoseconds
    //     ttl: 2_000_000_000,
    // },
    // // Cache realtime data for 30sec on arbitrum sepolia
    // {
    //     connector: "memory-realtime",
    //     network: "evm:421614",
    //     method: "*",
    //     finality: DataFinalityStateRealtime,
    //     empty: CacheEmptyBehaviorIgnore,
    //     // 30sec in nanoseconds
    //     ttl: 30_000_000_000,
    // },
] as const satisfies CachePolicyConfig[];

/**
 * Custom caching methods
 *  - Added blockHash on the `eth_getLogs` method
 */
const methods = {
    // Static methods that return fixed values:
    eth_chainId: {
        finalized: true,
    },
    net_version: {
        finalized: true,
    },

    // Realtime methods that change frequently (i.e. on every block):
    eth_hashrate: {
        realtime: true,
    },
    eth_mining: {
        realtime: true,
    },
    eth_syncing: {
        realtime: true,
    },
    net_peerCount: {
        realtime: true,
    },
    eth_gasPrice: {
        realtime: true,
    },
    eth_maxPriorityFeePerGas: {
        realtime: true,
    },
    eth_blobBaseFee: {
        realtime: true,
    },
    eth_blockNumber: {
        realtime: true,
    },
    erigon_blockNumber: {
        realtime: true,
    },

    // Methods with block references in request/response:
    // Make sure number is first in the array if hash is also present
    eth_getLogs: {
        reqRefs: [
            [0, "fromBlock"],
            [0, "toBlock"],
            [0, "blockHash"],
        ],
    },
    eth_getBlockByHash: {
        reqRefs: [[0]],
        respRefs: [["number"], ["hash"]],
    },
    eth_getBlockByNumber: {
        reqRefs: [[0]],
        respRefs: [["number"], ["hash"]],
    },
    eth_getTransactionByBlockHashAndIndex: {
        reqRefs: [[0]],
        respRefs: [["blockNumber"], ["blockHash"]],
    },
    eth_getTransactionByBlockNumberAndIndex: {
        reqRefs: [[0]],
        respRefs: [["blockNumber"], ["blockHash"]],
    },
    eth_getUncleByBlockHashAndIndex: {
        reqRefs: [[0]],
        respRefs: [["number"], ["hash"]],
    },
    eth_getUncleByBlockNumberAndIndex: {
        reqRefs: [[0]],
        respRefs: [["number"], ["hash"]],
    },
    eth_getBlockTransactionCountByHash: {
        reqRefs: [[0]],
    },
    eth_getBlockTransactionCountByNumber: {
        reqRefs: [[0]],
    },
    eth_getUncleCountByBlockHash: {
        reqRefs: [[0]],
    },
    eth_getUncleCountByBlockNumber: {
        reqRefs: [[0]],
    },
    eth_getStorageAt: {
        reqRefs: [[2]],
    },
    eth_getBalance: {
        reqRefs: [[1]],
    },
    eth_getTransactionCount: {
        reqRefs: [[1]],
    },
    eth_getCode: {
        reqRefs: [[1]],
    },
    eth_call: {
        reqRefs: [[1]],
    },
    eth_getProof: {
        reqRefs: [[2]],
    },
    arbtrace_call: {
        reqRefs: [[2]],
    },
    eth_feeHistory: {
        reqRefs: [[1]],
    },
    eth_getAccount: {
        reqRefs: [[1]],
    },
    eth_estimateGas: {
        reqRefs: [[1]],
    },
    debug_traceCall: {
        reqRefs: [[1]],
    },
    eth_simulateV1: {
        reqRefs: [[1]],
    },
    erigon_getBlockByTimestamp: {
        reqRefs: [[1]],
    },
    arbtrace_callMany: {
        reqRefs: [[1]],
    },
    eth_getBlockReceipts: {
        reqRefs: [[0]],
    },
    trace_block: {
        reqRefs: [[0]],
    },
    debug_traceBlockByNumber: {
        reqRefs: [[0]],
    },
    trace_replayBlockTransactions: {
        reqRefs: [[0]],
    },
    debug_storageRangeAt: {
        reqRefs: [[0]],
    },
    debug_traceBlockByHash: {
        reqRefs: [[0]],
    },
    debug_getRawBlock: {
        reqRefs: [[0]],
    },
    debug_getRawHeader: {
        reqRefs: [[0]],
    },
    debug_getRawReceipts: {
        reqRefs: [[0]],
    },
    erigon_getHeaderByNumber: {
        reqRefs: [[0]],
    },
    arbtrace_block: {
        reqRefs: [[0]],
    },
    arbtrace_replayBlockTransactions: {
        reqRefs: [[0]],
    },

    // Special methods that can be cached regardless of block:
    // Most often finality of these responses is 'unknown'.
    // For these data it is safe to keep the data in cache even after reorg,
    // because if client explcitly querying such data (e.g. a specific tx hash receipt)
    // they know it might be reorged from a separate process.
    // For example this is not safe to do for eth_getBlockByNumber because users
    // require the method to always give them current accurate data (even if it's reorged).
    // Using "*" as request blockRef means that these data are safe be cached irrevelant of their block.
    eth_getTransactionReceipt: {
        reqRefs: [["*"]],
        respRefs: [["blockNumber"], ["blockHash"]],
    },
    eth_getTransactionByHash: {
        reqRefs: [["*"]],
        respRefs: [["blockNumber"], ["blockHash"]],
    },
    arbtrace_replayTransaction: {
        reqRefs: [["*"]],
    },
    trace_replayTransaction: {
        reqRefs: [["*"]],
    },
    debug_traceTransaction: {
        reqRefs: [["*"]],
    },
    trace_rawTransaction: {
        reqRefs: [["*"]],
    },
    trace_transaction: {
        reqRefs: [["*"]],
    },
    debug_traceBlock: {
        reqRefs: [["*"]],
    },
} as unknown as CacheConfig["methods"];

/**
 * Export our final cache config
 */
export const cacheConfig = {
    connectors,
    policies: cachePolicies,
    methods,
} as const satisfies CacheConfig;
