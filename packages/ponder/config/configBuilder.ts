import { createConfig, mergeAbis } from "@ponder/core";
import { http, type Address, parseAbiItem } from "viem";
import * as deployedAddresses from "../abis/addresses.json";
import {
    campaignBankAbi,
    interactionCampaignAbi,
    referralCampaignAbi,
} from "../abis/campaignAbis";
import {
    dappInteractionFacetAbi,
    pressInteractionFacetAbi,
    productInteractionDiamondAbi,
    productInteractionManagerAbi,
    purchaseFeatureFacetAbi,
    referralFeatureFacetAbi,
} from "../abis/interactionAbis";
import {
    productAdministratorRegistryAbi,
    productRegistryAbi,
} from "../abis/registryAbis";

/**
 * Get an transport for the given chain id
 * @param chainId
 * @returns
 */
function getTransport(chainId: number) {
    // Get our erpc instance transport
    const erpcUrl =
        process.env.ERPC_URL ?? "https://rpc.frak.id/ponder-rpc/evm";
    if (!erpcUrl) {
        throw new Error("Missing ERPC_URL environment variable");
    }
    return http(`${erpcUrl}/${chainId}?token=${process.env.PONDER_RPC_SECRET}`);
}

type EnvNetworkConfig = {
    chainId: number;
    deploymentBlock?: number;
};

/**
 * Create a env gated config
 */
export function createEnvConfig<NetworkKey extends string>({
    pgDatabase,
    network,
    networkKey,
}: { pgDatabase?: string; network: EnvNetworkConfig; networkKey: NetworkKey }) {
    const contractNetworkConfig = {
        [networkKey]: {
            startBlock: network.deploymentBlock,
        },
    } as const;

    return createConfig({
        // db config
        database: pgDatabase
            ? {
                  kind: "postgres",
                  connectionString: `${process.env.DATABASE_URL}?${pgDatabase}`,
              }
            : {
                  kind: "sqlite",
              },
        // networks config
        networks: {
            [networkKey]: {
                chainId: network.chainId,
                transport: getTransport(network.chainId),
                pollingInterval: 5_000,
            },
        },
        // contracts config
        contracts: {
            // The product registry
            ProductRegistry: {
                abi: productRegistryAbi,
                address: deployedAddresses.productRegistry as Address,
                network: contractNetworkConfig,
            },
            // The product registry
            ProductAdministratorRegistry: {
                abi: productAdministratorRegistryAbi,
                address:
                    deployedAddresses.productAdministratorlRegistry as Address,
                network: contractNetworkConfig,
            },
            // The interaction manager
            ProductInteractionManager: {
                abi: productInteractionManagerAbi,
                address: deployedAddresses.productInteractionManager as Address,
                network: contractNetworkConfig,
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
                    address:
                        deployedAddresses.productInteractionManager as Address,
                    event: parseAbiItem(
                        "event InteractionContractDeployed(uint256 indexed productId, address interactionContract)"
                    ),
                    parameter: "interactionContract",
                },
                network: contractNetworkConfig,
            },
            // Every campaigns
            Campaigns: {
                abi: mergeAbis([interactionCampaignAbi, referralCampaignAbi]),
                factory: {
                    address: deployedAddresses.campaignFactory as Address,
                    event: parseAbiItem(
                        "event CampaignCreated(address campaign)"
                    ),
                    parameter: "campaign",
                },
                network: contractNetworkConfig,
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
                network: contractNetworkConfig,
            },
        },
    });
}
