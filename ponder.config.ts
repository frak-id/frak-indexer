import { createConfig, mergeAbis } from "@ponder/core";
import {
    http,
    type Transport,
    type TransportConfig,
    createTransport,
    fallback,
    parseAbiItem,
} from "viem";
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

/**
 * @description Creates a load balanced transport that spreads requests between child transports using a round robin algorithm.
 */
export const loadBalance = (_transports: Transport[]): Transport => {
    const fallbackTransport = fallback(_transports);

    return ({ chain, retryCount, timeout }) => {
        const fallback = fallbackTransport({ chain, retryCount, timeout });

        const transports = _transports.map((t) =>
            chain === undefined
                ? t({ retryCount: 0, timeout })
                : t({ chain, retryCount: 0, timeout })
        );

        return createTransport({
            key: "loadBalance",
            name: "Load Balance",
            request: async (body) => {
                // Random between 0 and transports.length
                const index = Math.round(Math.random() * transports.length);

                // Perform the request
                try {
                    const response = await transports[index]?.request(body);
                    // If we got a response return it directly
                    if (response) {
                        return response;
                    }
                } catch (e) {
                    console.error(
                        "Error when using load balanced transport",
                        e
                    );
                }
                // If we arrived here, return a stuff via the fallback transport
                return fallback.request(body);
            },
            retryCount,
            timeout,
            type: "loadBalance",
        } as TransportConfig);
    };
};

const pollingConfig = {
    pollingInterval: 30_000,
    maxRequestsPerSecond: 4,
} as const;

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
            transport: loadBalance([
                http(
                    `https://arbitrum-sepolia.blockpi.network/v1/rpc/${process.env.BLOCKPI_API_KEY_ARB_SEPOLIA}`
                ),
                http(
                    `https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
                ),
            ]),
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
                    maxBlockRange: 5000,
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
                    maxBlockRange: 5000,
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
                    maxBlockRange: 5000,
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
                    maxBlockRange: 5000,
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
                    startBlock: 60118981,
                    maxBlockRange: 5000,
                },
            },
        },
    },
});
