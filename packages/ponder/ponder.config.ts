import { createConfig, mergeAbis } from "@ponder/core";
import { http, fallback, parseAbiItem } from "viem";
import {
    interactionCampaignAbi,
    referralCampaignAbi,
} from "./abis/frak-campaign-abis";
import {
    contentInteractionDiamondAbi,
    contentInteractionManagerAbi,
    dappInteractionFacetAbi,
    pressInteractionFacetAbi,
    referralFeatureFacetAbi,
} from "./abis/frak-interaction-abis";
import { contentRegistryAbi } from "./abis/frak-registry-abis";

/**
 * Overall max block range
 */
const maxBlockRange = 10000;

/**
 * Get an erpc transport for the given chain id
 * @param chainId
 * @returns
 */
function getErpcTransport(chainId: number) {
    const internalTransport = http(
        `${process.env.ERPC_INTERNAL_URL}/${chainId}?token=${process.env.PONDER_RPC_SECRET}`,
        {
            batch: true,
            onFetchResponse: async (response) => {
                if (response.status !== 200) {
                    const id = (Math.random() * 1000).toFixed(0);
                    console.error(
                        `[${id}] Failed to fetch from internal erpc, status: ${response.url} - ${response.status}`
                    );
                    if (response.bodyUsed) {
                        console.error(
                            `[${id}] Body details: ${await response.text()}`
                        );
                    }
                }
            },
        }
    );
    const externalTransport = http(
        `${process.env.ERPC_EXTERNAL_URL}/${chainId}?token=${process.env.PONDER_RPC_SECRET}`,
        {
            batch: true,
        }
    );
    return fallback([internalTransport, externalTransport], {
        key: `erpc-transport-${chainId}`,
        name: `eRPC transport for chain ${chainId}`,
    });
}

/**
 * Ponder configuration
 */
export default createConfig({
    database: {
        kind: "postgres",
        connectionString: process.env.DATABASE_URL,
        publishSchema: "publish",
    },
    networks: {
        // Testnets
        arbitrumSepolia: {
            chainId: 421614,
            transport: fallback([
                getErpcTransport(421614),
                http(
                    `https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
                ),
            ]),
            pollingInterval: 10_000,
            maxRequestsPerSecond: 64,
        },
    },
    contracts: {
        // The content registry
        ContentRegistry: {
            abi: contentRegistryAbi,
            address: "0x758F01B484212b38EAe264F75c0DD7842d510D9c",
            network: {
                arbitrumSepolia: {
                    startBlock: 64121913,
                    maxBlockRange,
                },
            },
        },
        // The interaction manager
        ContentInteractionManager: {
            abi: contentInteractionManagerAbi,
            address: "0xFE0717cACd6Fff3001EdD3f360Eb2854F54861DD",
            network: {
                arbitrumSepolia: {
                    startBlock: 64121923,
                    maxBlockRange,
                },
            },
        },
        // Every content interactions
        ContentInteraction: {
            abi: mergeAbis([
                contentInteractionDiamondAbi,
                pressInteractionFacetAbi,
                dappInteractionFacetAbi,
                referralFeatureFacetAbi,
            ]),
            factory: {
                address: "0xFE0717cACd6Fff3001EdD3f360Eb2854F54861DD",
                event: parseAbiItem(
                    "event InteractionContractDeployed(uint256 indexed contentId, address interactionContract)"
                ),
                parameter: "interactionContract",
            },
            network: {
                arbitrumSepolia: {
                    startBlock: 64121923,
                    maxBlockRange,
                },
            },
        },
        // Every campaigns
        Campaigns: {
            abi: mergeAbis([interactionCampaignAbi, referralCampaignAbi]),
            factory: {
                address: "0x440B19d7694f4B8949b02e674870880c5e40250C",
                event: parseAbiItem("event CampaignCreated(address campaign)"),
                parameter: "campaign",
            },
            network: {
                arbitrumSepolia: {
                    startBlock: 64121923,
                    maxBlockRange,
                },
            },
        },
    },
});
