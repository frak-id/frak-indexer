import { createConfig } from "@ponder/core";
import { http } from "viem";
import { erc20ABI } from "./abis/erc20ABI";

const pollingConfig = {
    pollingInterval: 5_000,
    maxRequestsPerSecond: 1,
} as const;

export default createConfig({
    networks: {
        // Mainnets
        arbitrum: {
            chainId: 42161,
            transport: http(process.env.PONDER_RPC_URL_ARB),
            ...pollingConfig,
        },
        base: {
            chainId: 8453,
            transport: http(process.env.PONDER_RPC_URL_BASE),
            ...pollingConfig,
        },
        optimism: {
            chainId: 10,
            transport: http(process.env.PONDER_RPC_URL_OPTIMISM),
            ...pollingConfig,
        },
        polygon: {
            chainId: 137,
            transport: http(process.env.PONDER_RPC_URL_POLYGON),
            ...pollingConfig,
        },
        // Testnets
        arbitrumSepolia: {
            chainId: 421614,
            transport: http(process.env.PONDER_RPC_URL_ARB_SEPOLIA),
            ...pollingConfig,
        },
    },
    contracts: {
        // The erc20 tokens to index
        ERC20: {
            abi: erc20ABI,
            network: "arbitrumSepolia",
            address: "0x9584A61F70cC4BEF5b8B5f588A1d35740f0C7ae2",
            startBlock: 46426074,
            endBlock: 48000000,
        },
    },
});
