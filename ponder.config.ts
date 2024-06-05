import { createConfig } from "@ponder/core";
import { http } from "viem";
import { erc20ABI } from "./abis/erc20ABI";
import { multiWebAuthNValidatorV2Abi } from "./abis/multiWebAuthNValidatorABI";

const pollingConfig = {
    pollingInterval: 5_000,
    maxRequestsPerSecond: 1,
} as const;

export default createConfig({
    database: {
        kind: "postgres",
        connectionString: process.env.DATABASE_URL,
    },
    networks: {
        // Mainnets
        arbitrum: {
            chainId: 42161,
            transport: http(process.env.PONDER_RPC_URL_ARB),
            ...pollingConfig,
        },
        /*base: {
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
        },*/
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
            startBlock: 29562417,
        },
        // The WebAuthN validator to index
        WebAuthNValidator: {
            abi: multiWebAuthNValidatorV2Abi,
            network: {
                arbitrumSepolia: {
                    startBlock: 35765963,
                },
                arbitrum: {
                    startBlock: 203956680,
                },
                /*base: {
                    startBlock: 13537832,
                },
                optimism: {
                    startBlock: 119133117,
                },
                polygon: {
                    startBlock: 56157675,
                },*/
            },
            address: "0xD546c4Ba2e8e5e5c961C36e6Db0460Be03425808",
        },
    },
});
