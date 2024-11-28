import * as console from "node:console";
import { ponder } from "@/generated";
import { erc20Abi, isAddressEqual } from "viem";
import { campaignBankAbi } from "../../abis/campaignAbis";
import {
    bankingContractTable,
    campaignTable,
    tokenTable,
} from "../../ponder.schema";

ponder.on(
    "CampaignBanksFactory:CampaignBankCreated",
    async ({ event, context: { client, db } }) => {
        const address = event.args.campaignBank;

        // If not found, find the token of this campaign
        const [[productId, token], isDistributing] = await client.multicall({
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
            blockNumber: event.block.number,
        });

        await db.insert(bankingContractTable).values({
            id: address,
            tokenId: token,
            totalDistributed: 0n,
            totalClaimed: 0n,
            productId,
            isDistributing,
        });
        // Create the token if needed
        const tokenDb = await db.find(tokenTable, { id: token });
        if (!tokenDb) {
            try {
                // Fetch a few onchain data
                const [name, symbol, decimals] = await client.multicall({
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
                });

                // Create the token
                await db.insert(tokenTable).values({
                    id: token,
                    name,
                    symbol,
                    decimals,
                });
            } catch (e) {
                console.error(e, "Unable to fetch token data");
            }
        }
    }
);

ponder.on(
    "CampaignBanks:CampaignAuthorisationUpdated",
    async ({ event, context: { db } }) => {
        // Find the interaction contract
        const campaign = await db.find(campaignTable, {
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
        await db
            .update(campaignTable, {
                id: event.args.campaign,
            })
            .set({
                isAuthorisedOnBanking: event.args.isAllowed,
                lastUpdateBlock: event.block.number,
            });
    }
);

ponder.on(
    "CampaignBanks:DistributionStateUpdated",
    async ({ event, context: { db } }) => {
        // Find the interaction contract
        const banking = await db.find(bankingContractTable, {
            id: event.log.address,
        });
        if (!banking) {
            console.error(`Banking contract not found: ${event.log.address}`);
            return;
        }

        // Update the campaign
        await db
            .update(bankingContractTable, {
                id: event.log.address,
            })
            .set({
                isDistributing: event.args.isDistributing,
            });
    }
);
