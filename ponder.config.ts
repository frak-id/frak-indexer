import { createConfig } from "@ponder/core";
import {http, parseAbiItem} from "viem";
import {contentInteractionDiamondAbi, contentInteractionManagerAbi} from "./abis/frak-interaction-abis";
import { contentRegistryAbi } from "./abis/frak-registry-abis";
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
        // The WebAuthN validator to index
        WebAuthNValidator: {
            abi: multiWebAuthNValidatorV2Abi,
            address: "0xD546c4Ba2e8e5e5c961C36e6Db0460Be03425808",
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
        },
        // The content registry
        ContentRegistry: {
            abi: contentRegistryAbi,
            address: "0xc02209e937dB50C80AA1A280f9172163D8aC6a38",
            network: {
                arbitrumSepolia: {
                    startBlock: 52222107,
                },
            },
        },
        // The interaction manager
        ContentInteractionManager: {
            abi: contentInteractionManagerAbi,
            address: "0x71a54b7Edb803b0FB6c7A930794BcA13587Af21b",
            network: {
                arbitrumSepolia: {
                    startBlock: 52222107,
                },
            },
        },
        // Every content interactions
        ContentInteraction: {
            abi: contentInteractionDiamondAbi,
            factory: {
                address: "0x71a54b7Edb803b0FB6c7A930794BcA13587Af21b",
                event: parseAbiItem("event InteractionContractDeployed(uint256 indexed contentId, address interactionContract)"),
                parameter: "interactionContract",
            },
            network: {
                arbitrumSepolia: {
                    startBlock: 52222107,
                },
            },
        }
    },
});
