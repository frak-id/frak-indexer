import { createConfig, mergeAbis } from "@ponder/core";
import { http, parseAbiItem } from "viem";
import {
    interactionCampaignAbi,
    referralCampaignAbi,
} from "./abis/frak-campaign-abis";
import {
    contentInteractionDiamondAbi,
    contentInteractionManagerAbi,
    dappInteractionFacetAbi,
    pressInteractionFacetAbi,
} from "./abis/frak-interaction-abis";
import { contentRegistryAbi } from "./abis/frak-registry-abis";
import { multiWebAuthNValidatorV2Abi } from "./abis/multiWebAuthNValidatorABI";

const pollingConfig = {
    pollingInterval: 5_000,
    maxRequestsPerSecond: 12,
} as const;

export default createConfig({
    database: {
        kind: "postgres",
        connectionString: process.env.DATABASE_URL,
        publishSchema: "publish",
    },
    networks: {
        // Mainnets
        /*arbitrum: {
            chainId: 42161,
            transport: http(process.env.PONDER_RPC_URL_ARB),
            ...pollingConfig,
        },*/
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
                /*arbitrum: {
                    startBlock: 203956680,
                },*/
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
            address: "0xC110ecb55EbAa4Ea9eFC361C4bBB224A6664Ea45",
            network: {
                arbitrumSepolia: {
                    startBlock: 54321880,
                },
            },
        },
        // The interaction manager
        ContentInteractionManager: {
            abi: contentInteractionManagerAbi,
            address: "0xC97D72A8a9d1D2Ed326EB04f2d706A21cEe2B94E",
            network: {
                arbitrumSepolia: {
                    startBlock: 60118981,
                },
            },
        },
        // Every content interactions
        ContentInteraction: {
            abi: mergeAbis([
                contentInteractionDiamondAbi,
                pressInteractionFacetAbi,
                dappInteractionFacetAbi,
            ]),
            factory: {
                address: "0xC97D72A8a9d1D2Ed326EB04f2d706A21cEe2B94E",
                event: parseAbiItem(
                    "event InteractionContractDeployed(uint256 indexed contentId, address interactionContract)"
                ),
                parameter: "interactionContract",
            },
            network: {
                arbitrumSepolia: {
                    startBlock: 60118981,
                },
            },
        },
        // Every campaigns
        Campaigns: {
            abi: mergeAbis([interactionCampaignAbi, referralCampaignAbi]),
            factory: {
                address: "0x1f65A60340E4D017DdfeE45aA2905b6D79a55672",
                event: parseAbiItem("event CampaignCreated(address campaign)"),
                parameter: "campaign",
            },
            network: {
                arbitrumSepolia: {
                    startBlock: 60118981,
                },
            },
        },
    },
});
