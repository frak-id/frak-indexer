import { type Context, ponder } from "@/generated";
import type { Address } from "viem";
import { referralCampaignAbi } from "../abis/frak-campaign-abis";

ponder.on("Campaigns:RewardAdded", async ({ event, context }) => {
    const { RewardingContract, Reward, RewardAddedEvent, PressCampaignStats } =
        context.db;

    // Try to find a rewarding contract for the given event emitter
    const rewardingContract = await getRewardingContract({
        contract: event.log.address,
        context,
    });

    // Update rewarding contract
    await RewardingContract.update({
        id: rewardingContract.id,
        data: {
            totalDistributed:
                rewardingContract.totalDistributed + event.args.amount,
        },
    });

    // Update the current user reward (insert it if not found)
    const rewardId = `${event.log.address}-${event.args.user}`;
    await Reward.upsert({
        id: rewardId,
        create: {
            contractId: rewardingContract.id,
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
            amount: event.args.amount,
            txHash: event.log.transactionHash,
            timestamp: event.block.timestamp,
        },
    });

    // Update the current campaigns stats for the distributed amount
    await PressCampaignStats.upsert({
        id: event.log.address,
        create: {
            campaignId: event.log.address,
            totalInteractions: 0n,
            openInteractions: 0n,
            readInteractions: 0n,
            referredInteractions: 0n,
            createReferredLinkInteractions: 0n,
            totalRewards: 0n,
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

ponder.on("Campaigns:RewardClaimed", async ({ event, context }) => {
    const { RewardingContract, Reward, RewardClaimedEvent } = context.db;

    // Try to find a rewarding contract for the given event emitter
    const rewardingContract = await getRewardingContract({
        contract: event.log.address,
        context,
    });

    // Update rewarding contract
    await RewardingContract.update({
        id: rewardingContract.id,
        data: {
            totalClaimed: rewardingContract.totalClaimed + event.args.amount,
        },
    });

    // Update the current user reward (insert it if not found)
    const rewardId = `${event.log.address}-${event.args.user}`;
    await Reward.upsert({
        id: rewardId,
        create: {
            contractId: rewardingContract.id,
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
async function getRewardingContract({
    contract,
    context,
}: {
    contract: Address;
    context: Context;
}) {
    const { RewardingContract } = context.db;
    // Try to find a rewarding contract for the given event emitter
    let rewardingContract = await RewardingContract.findUnique({
        id: contract,
    });
    if (!rewardingContract) {
        // If not found, find the token of this campaign
        const { token } = await context.client.readContract({
            abi: referralCampaignAbi,
            address: contract,
            functionName: "getConfig",
        });

        rewardingContract = await RewardingContract.create({
            id: contract,
            data: {
                token,
                totalDistributed: 0n,
                totalClaimed: 0n,
            },
        });
    }

    return rewardingContract;
}
