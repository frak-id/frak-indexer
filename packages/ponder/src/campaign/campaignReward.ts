import { type Context, ponder } from "@/generated";
import { type Address, erc20Abi } from "viem";
import { campaignBankAbi } from "../../abis/campaignAbis";
import { emptyCampaignStats } from "../interactions/stats";

ponder.on("CampaignBanks:RewardAdded", async ({ event, context }) => {
    const { BankingContract, Reward, RewardAddedEvent, ReferralCampaignStats } =
        context.db;

    // Try to find a rewarding contract for the given event emitter
    const bankingContract = await getBankingContract({
        contract: event.log.address,
        context,
    });

    // Update rewarding contract
    await BankingContract.update({
        id: bankingContract.id,
        data: {
            totalDistributed:
                bankingContract.totalDistributed + event.args.amount,
        },
    });

    // Update the current user reward (insert it if not found)
    const rewardId = `${event.log.address}-${event.args.user}`;
    await Reward.upsert({
        id: rewardId,
        create: {
            contractId: bankingContract.id,
            user: event.args.user,
            pendingAmount: event.args.amount,
            totalReceived: event.args.amount,
            totalClaimed: 0n,
        },
        update: ({ current }) => ({
            pendingAmount: current.pendingAmount + event.args.amount,
            totalReceived: current.totalReceived + event.args.amount,
        }),
    });

    // Insert the reward event
    await RewardAddedEvent.create({
        id: event.log.id,
        data: {
            rewardId,
            emitter: event.args.emitter,
            amount: event.args.amount,
            txHash: event.log.transactionHash,
            timestamp: event.block.timestamp,
        },
    });

    // Update the current campaigns stats for the distributed amount
    await ReferralCampaignStats.upsert({
        id: event.log.address,
        create: {
            ...emptyCampaignStats,
            campaignId: event.log.address,
            totalRewards: event.args.amount,
        },
        // Update the given field by incrementing them
        update: ({ current }) => {
            return {
                ...current,
                totalRewards: current.totalRewards + (event.args.amount ?? 0n),
            };
        },
    });
});

ponder.on("CampaignBanks:RewardClaimed", async ({ event, context }) => {
    const { BankingContract, Reward, RewardClaimedEvent } = context.db;

    // Try to find a rewarding contract for the given event emitter
    const bankingContract = await getBankingContract({
        contract: event.log.address,
        context,
    });

    // Update rewarding contract
    await BankingContract.update({
        id: bankingContract.id,
        data: {
            totalClaimed: bankingContract.totalClaimed + event.args.amount,
        },
    });

    // Update the current user reward (insert it if not found)
    const rewardId = `${event.log.address}-${event.args.user}`;
    await Reward.upsert({
        id: rewardId,
        create: {
            contractId: bankingContract.id,
            user: event.args.user,
            totalClaimed: event.args.amount,
            totalReceived: 0n,
            pendingAmount: 0n,
        },
        update: ({ current }) => ({
            pendingAmount: current.pendingAmount - event.args.amount,
            totalClaimed: current.totalClaimed + event.args.amount,
        }),
    });

    // Insert the reward event
    await RewardClaimedEvent.create({
        id: event.log.id,
        data: {
            rewardId,
            amount: event.args.amount,
            txHash: event.log.transactionHash,
            timestamp: event.block.timestamp,
        },
    });
});

/**
 * Get the rewarding contract for the given event emitter
 * @param contract
 * @param context
 */
async function getBankingContract({
    contract,
    context,
}: {
    contract: Address;
    context: Context;
}) {
    const { BankingContract, Token } = context.db;
    // Try to find a rewarding contract for the given event emitter
    let bankingContract = await BankingContract.findUnique({
        id: contract,
    });
    if (!bankingContract) {
        // If not found, find the token of this campaign
        const [productId, token] = await context.client.readContract({
            abi: campaignBankAbi,
            address: contract,
            functionName: "getConfig",
        });

        bankingContract = await BankingContract.create({
            id: contract,
            data: {
                tokenId: token,
                totalDistributed: 0n,
                totalClaimed: 0n,
                productId,
            },
        });
    }

    // Create the token if needed
    const token = await Token.findUnique({ id: bankingContract.tokenId });
    if (!token) {
        try {
            // Fetch a few onchain data
            const [name, symbol, decimals] = await context.client.multicall({
                contracts: [
                    {
                        abi: erc20Abi,
                        functionName: "name",
                        address: bankingContract.tokenId,
                    },
                    {
                        abi: erc20Abi,
                        functionName: "symbol",
                        address: bankingContract.tokenId,
                    },
                    {
                        abi: erc20Abi,
                        functionName: "decimals",
                        address: bankingContract.tokenId,
                    },
                ] as const,
                allowFailure: false,
            });

            // Create the token
            await Token.create({
                id: bankingContract.tokenId,
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

    return bankingContract;
}
