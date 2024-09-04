import { createConfig, mergeAbis } from "@ponder/core";
import { http, parseAbiItem } from "viem";
import {
    interactionCampaignAbi,
    referralCampaignAbi,
} from "./abis/frak-campaign-abis";
import {
    dappInteractionFacetAbi,
    pressInteractionFacetAbi,
    productInteractionDiamondAbi,
    productInteractionManagerAbi,
    referralFeatureFacetAbi,
} from "./abis/frak-interaction-abis";
import {
    productAdministratorRegistryAbi,
    productRegistryAbi,
} from "./abis/frak-registry-abis";

/**
 * Get an transport for the given chain id
 * @param chainId
 * @returns
 */
function getTransport(chainId: number) {
    // Get our erpc instance transport
    const erpcUrl =
        process.env.ERPC_INTERNAL_URL ?? process.env.ERPC_EXTERNAL_URL;
    const erpcTransport = http(
        `${erpcUrl}/${chainId}?token=${process.env.PONDER_RPC_SECRET}`
    );
    return erpcTransport;
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
            transport: getTransport(421614),
            pollingInterval: 5_000,
        },
    },
    contracts: {
        // The product registry
        ProductRegistry: {
            abi: productRegistryAbi,
            address: "0xdA7fBD02eb048bDf6f1607122eEe071e44f0b9F2",
            network: {
                arbitrumSepolia: {
                    startBlock: 75793399,
                },
            },
        },
        // The product registry
        ProductAdministratorRegistry: {
            abi: productAdministratorRegistryAbi,
            address: "0x62254d732C078BF0484EA7dBd61f7F620184F95e",
            network: {
                arbitrumSepolia: {
                    startBlock: 75793399,
                },
            },
        },
        // The interaction manager
        ProductInteractionManager: {
            abi: productInteractionManagerAbi,
            address: "0xC9d1BAB1B9A07c11AB0C264B13AFfD500DD4c2ee",
            network: {
                arbitrumSepolia: {
                    startBlock: 75793399,
                },
            },
        },
        // Every product interactions
        ProductInteraction: {
            abi: mergeAbis([
                productInteractionDiamondAbi,
                pressInteractionFacetAbi,
                dappInteractionFacetAbi,
                referralFeatureFacetAbi,
            ]),
            factory: {
                address: "0xC9d1BAB1B9A07c11AB0C264B13AFfD500DD4c2ee",
                event: parseAbiItem(
                    "event InteractionContractDeployed(uint256 indexed productId, address interactionContract)"
                ),
                parameter: "interactionContract",
            },
            network: {
                arbitrumSepolia: {
                    startBlock: 75793399,
                },
            },
        },
        // Every campaigns
        Campaigns: {
            abi: mergeAbis([interactionCampaignAbi, referralCampaignAbi]),
            factory: {
                address: "0xBE461b8Eb39050cd1c41aaa2f686C93Ec4a5958E",
                event: parseAbiItem("event CampaignCreated(address campaign)"),
                parameter: "campaign",
            },
            network: {
                arbitrumSepolia: {
                    startBlock: 75793399,
                },
            },
        },
    },
});
