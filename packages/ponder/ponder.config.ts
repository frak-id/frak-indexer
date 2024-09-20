import { createConfig, mergeAbis } from "@ponder/core";
import { http, type Address, parseAbiItem } from "viem";
import * as deployedAddresses from "./abis/addresses.json";
import {
    campaignBankAbi,
    interactionCampaignAbi,
    referralCampaignAbi,
} from "./abis/campaignAbis";
import {
    dappInteractionFacetAbi,
    pressInteractionFacetAbi,
    productInteractionDiamondAbi,
    productInteractionManagerAbi,
    purchaseFeatureFacetAbi,
    referralFeatureFacetAbi,
} from "./abis/interactionAbis";
import {
    productAdministratorRegistryAbi,
    productRegistryAbi,
} from "./abis/registryAbis";

/**
 * Get an transport for the given chain id
 * @param chainId
 * @returns
 */
function getTransport(chainId: number) {
    // Get our erpc instance transport
    const erpcUrl =
        process.env.ERPC_INTERNAL_URL ?? process.env.ERPC_EXTERNAL_URL;
    return http(`${erpcUrl}/${chainId}?token=${process.env.PONDER_RPC_SECRET}`);
}

/**
 * Shared network config
 */
const networkConfig = {
    arbitrumSepolia: {
        startBlock: 75793399,
    },
} as const;

/**
 * Ponder configuration
 */
export default createConfig({
    database: {
        kind: "postgres",
        connectionString: process.env.DATABASE_URL,
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
            address: deployedAddresses.productRegistry as Address,
            network: networkConfig,
        },
        // The product registry
        ProductAdministratorRegistry: {
            abi: productAdministratorRegistryAbi,
            address: deployedAddresses.productAdministratorlRegistry as Address,
            network: networkConfig,
        },
        // The interaction manager
        ProductInteractionManager: {
            abi: productInteractionManagerAbi,
            address: deployedAddresses.productInteractionManager as Address,
            network: networkConfig,
        },
        // Every product interactions
        ProductInteraction: {
            abi: mergeAbis([
                productInteractionDiamondAbi,
                // Each facets
                pressInteractionFacetAbi,
                dappInteractionFacetAbi,
                referralFeatureFacetAbi,
                purchaseFeatureFacetAbi,
            ]),
            factory: {
                address: deployedAddresses.productInteractionManager as Address,
                event: parseAbiItem(
                    "event InteractionContractDeployed(uint256 indexed productId, address interactionContract)"
                ),
                parameter: "interactionContract",
            },
            network: networkConfig,
        },
        // Every campaigns
        Campaigns: {
            abi: mergeAbis([interactionCampaignAbi, referralCampaignAbi]),
            factory: {
                address: deployedAddresses.campaignFactory as Address,
                event: parseAbiItem("event CampaignCreated(address campaign)"),
                parameter: "campaign",
            },
            network: networkConfig,
        },
        // Every campaign banks
        CampaignBanks: {
            abi: mergeAbis([campaignBankAbi]),
            factory: {
                address: deployedAddresses.campaignBankFactory as Address,
                event: parseAbiItem(
                    "event CampaignBankCreated(address campaignBank)"
                ),
                parameter: "campaignBank",
            },
            network: networkConfig,
        },
    },
});
