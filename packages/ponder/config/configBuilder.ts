import { createConfig, mergeAbis } from "@ponder/core";
import {
    http,
    type Address,
    type PublicRpcSchema,
    type Transport,
    type TransportConfig,
    createTransport,
    fallback,
    parseAbiItem,
} from "viem";
import * as deployedAddresses from "../abis/addresses.json";
import {
    campaignBankAbi,
    campaignBankFactoryAbi,
    campaignFactoryAbi,
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
    webShopInteractionFacetAbi,
} from "../abis/interactionAbis";
import {
    productAdministratorRegistryAbi,
    productRegistryAbi,
} from "../abis/registryAbis";

type GetLogsRpcType = Extract<
    PublicRpcSchema[number],
    { Method: "eth_getLogs" }
>;

type GetBlockByNumber = Extract<
    PublicRpcSchema[number],
    { Method: "eth_getBlockByNumber" }
>;

/**
 * Custom transport with some failsafe options specific for envio upstream
 * @param initialTransport
 */
function safeClient(initialTransport: Transport): Transport {
    return (args) => {
        const transport = initialTransport(args);

        return createTransport({
            key: "safeClient",
            name: "Safe Indexing Client",
            type: "safeClient",
            async request(body) {
                // If that's an eth_getLogs request, with a blockHash parameter, encore we got no block leak in the response (and if that's the case, filter out the logs with a different blockHash)
                if (
                    body.method === "eth_getLogs" &&
                    Array.isArray(body.params) &&
                    (body.params as GetLogsRpcType["Parameters"])?.[0]
                        ?.blockHash
                ) {
                    const requestedBlockHash = (
                        body.params as GetLogsRpcType["Parameters"]
                    )?.[0]?.blockHash;
                    if (!requestedBlockHash) {
                        throw new Error("Missing blockHash parameter");
                    }

                    // Perform the request
                    const response = (await transport.request(
                        body
                    )) as GetLogsRpcType["ReturnType"];

                    // Filter out logs with a different blockHash
                    //  envio can leak parent / child block logs in the response
                    const filteredResponse = response.filter(
                        (log) => log.blockHash === requestedBlockHash
                    );
                    if (filteredResponse.length !== response.length) {
                        console.log(
                            `Filtered out ${
                                response.length - filteredResponse.length
                            } logs cause of mismatching blockHash, requested: ${requestedBlockHash}`
                        );
                    }
                    return filteredResponse;
                }

                // If that's an eth_getBlockByNumber request, with latest block, do some manual thread lock, to ensure this block is well synchronised across different rpcs
                if (
                    body.method === "eth_getBlockByNumber" &&
                    Array.isArray(body.params) &&
                    (body.params as GetBlockByNumber["Parameters"])?.[0] ===
                        "latest"
                ) {
                    // Perform the request
                    const response = await transport.request(body);
                    // Lock the thread for 3s
                    await new Promise((resolve) => setTimeout(resolve, 3_000));
                    // Return the response
                    return response;
                }

                // Otherwise, simple request
                return transport.request(body);
            },
            retryCount: args.retryCount,
            timeout: args.timeout,
        } as TransportConfig);
    };
}

/**
 * Get an transport for the given chain id
 * @param chainId
 * @returns
 */
function getTransport(chainId: number) {
    // Get our erpc instance transport
    const erpcInternalUrl = process.env.INTERNAL_RPC_URL;
    const erpcExternalUrl = process.env.EXTERNAL_RPC_URL;
    if (!erpcInternalUrl || !erpcExternalUrl) {
        throw new Error("Missing erpc environment variable");
    }

    // Base client is just a fallback between cloudmap direct service and external service
    const baseClient = fallback([
        http(
            `${erpcInternalUrl}/${chainId}?token=${process.env.PONDER_RPC_SECRET}`
        ),
        http(
            `${erpcExternalUrl}/${chainId}?token=${process.env.PONDER_RPC_SECRET}`
        ),
        // And envio client directly
        http(`https://${chainId}.rpc.hypersync.xyz`),
    ]);

    // Return the base client wrapper in a cooldown one, aiming to slow down real time indexing on arbitrum / arbitrum sepolia
    return safeClient(baseClient);
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
                  connectionString: `${process.env.PONDER_DATABASE_URL}/${pgDatabase}`,
              }
            : {
                  kind: "sqlite",
              },
        // networks config
        networks: {
            [networkKey]: {
                chainId: network.chainId,
                transport: getTransport(network.chainId),
                pollingInterval: 30_000,
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
                    deployedAddresses.productAdministratorRegistry as Address,
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
                    webShopInteractionFacetAbi,
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
            // The campaign factory
            CampaignsFactory: {
                abi: campaignFactoryAbi,
                address: deployedAddresses.campaignFactory as Address,
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
            // The campaign banks factory
            CampaignBanksFactory: {
                abi: campaignBankFactoryAbi,
                address: deployedAddresses.campaignBankFactory as Address,
                network: contractNetworkConfig,
            },
            // Every campaign banks
            CampaignBanks: {
                abi: campaignBankAbi,
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
