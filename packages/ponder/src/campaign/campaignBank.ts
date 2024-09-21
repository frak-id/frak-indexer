import * as console from "node:console";
import { ponder } from "@/generated";
import { erc20Abi, isAddressEqual } from "viem";
import { campaignBankAbi } from "../../abis/campaignAbis";

ponder.on(
    "CampaignBanksFactory:CampaignBankCreated",
    async ({ event, context }) => {
        const { BankingContract, Token } = context.db;
        const address = event.args.campaignBank;

        // If not found, find the token of this campaign
        const [[productId, token], isDistributing] =
            await context.client.multicall({
                contracts: [
                    {
                        abi: campaignBankAbi,
                        address,
                        functionName: "getConfig",
                    } as const,
                    {
                        abi: campaignBankAbi,
                        address,
                        functionName: "isDistributionEnabled",
                    } as const,
                ],
                allowFailure: false,
            });

        await BankingContract.create({
            id: address,
            data: {
                tokenId: token,
                totalDistributed: 0n,
                totalClaimed: 0n,
                productId,
                isDistributing,
            },
        });
        // Create the token if needed
        const tokenDb = await Token.findUnique({ id: token });
        if (!tokenDb) {
            try {
                // Fetch a few onchain data
                const [name, symbol, decimals] = await context.client.multicall(
                    {
                        contracts: [
                            {
                                abi: erc20Abi,
                                functionName: "name",
                                address: token,
                            },
                            {
                                abi: erc20Abi,
                                functionName: "symbol",
                                address: token,
                            },
                            {
                                abi: erc20Abi,
                                functionName: "decimals",
                                address: token,
                            },
                        ] as const,
                        allowFailure: false,
                    }
                );

                // Create the token
                await Token.create({
                    id: token,
                    data: {
                        name,
                        symbol,
                        decimals,
                    },
                });
            } catch (e) {
                console.error(e, "Unable to fetch token data");
            }
        }
    }
);

ponder.on(
    "CampaignBanks:CampaignAuthorisationUpdated",
    async ({ event, context }) => {
        const { Campaign } = context.db;

        // Find the interaction contract
        const campaign = await Campaign.findUnique({
            id: event.args.campaign,
        });
        if (!campaign?.bankingContractId) {
            console.error(
                `Campaign contract not found: ${event.args.campaign}`
            );
            return;
        }

        if (!isAddressEqual(event.log.address, campaign.bankingContractId)) {
            console.error(
                `Banking contract mismatch: ${event.log.address} vs ${campaign.bankingContractId}`
            );
            return;
        }

        // Update the campaign
        await Campaign.update({
            id: event.args.campaign,
            data: {
                isAuthorisedOnBanking: event.args.isAllowed,
            },
        });
    }
);

ponder.on(
    "CampaignBanks:DistributionStateUpdated",
    async ({ event, context }) => {
        const { BankingContract } = context.db;

        // Find the interaction contract
        const banking = await BankingContract.findUnique({
            id: event.log.address,
        });
        if (!banking) {
            console.error(`Banking contract not found: ${event.log.address}`);
            return;
        }

        // Update the campaign
        await BankingContract.update({
            id: event.log.address,
            data: {
                isDistributing: event.args.isDistributing,
            },
        });
    }
);
