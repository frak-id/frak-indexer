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
 * Get an erpc transport for the given chain id
 * @param chainId
 * @returns
 */
function getErpcTransport(chainId: number) {
    // Build the internal erpc transport, directly hitting the ALB internal DNS
    if (!process.env.ERPC_INTERNAL_URL) {
        return http(
            `${process.env.ERPC_INTERNAL_URL}/${chainId}?token=${process.env.PONDER_RPC_SECRET}`,
            {
                key: `erpc-internal-transport-${chainId}`,
                name: `eRPC internal transport for chain ${chainId}`,
            }
        );
    }

    // Build the externel erpc transport, going through the internet gateway each time
    return http(
        `${process.env.ERPC_EXTERNAL_URL}/${chainId}?token=${process.env.PONDER_RPC_SECRET}`,
        {
            batch: true,
            key: `erpc-external-transport-${chainId}`,
            name: `eRPC external transport for chain ${chainId}`,
        }
    );
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
            pollingInterval: 5_000,
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
                },
            },
        },
    },
});
