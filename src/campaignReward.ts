import { type Context, ponder } from "@/generated";
import type { Address } from "viem";
import { referralCampaignAbi } from "../abis/frak-campaign-abis";

ponder.on("Campaigns:RewardAdded", async ({ event, context }) => {
    const { Reward, RewardAddedEvent } = context.db;

    // Try to find a rewarding contract for the given event emitter
    const rewardingContract = await getRewardingContract({
        contract: event.log.address,
        context,
    });

    // Update the current user reward (insert it if not found)
    const rewardId = `${event.log.address}-${event.args.user}`;
    await Reward.upsert({
        id: rewardId,
        create: {
            contractId: rewardingContract.id,
            user: event.args.user,
            pendingAmount: event.args.amount,
            totalAmount: event.args.amount,
        },
        update: ({ current }) => ({
            pendingAmount: current.pendingAmount + event.args.amount,
            totalAmount: current.totalAmount + event.args.amount,
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
});

ponder.on("Campaigns:RewardClaimed", async ({ event, context }) => {
    const { Reward, RewardClaimedEvent } = context.db;

    // Try to find a rewarding contract for the given event emitter
    const rewardingContract = await getRewardingContract({
        contract: event.log.address,
        context,
    });

    // Update the current user reward (insert it if not found)
    const rewardId = `${event.log.address}-${event.args.user}`;
    await Reward.upsert({
        id: rewardId,
        create: {
            contractId: rewardingContract.id,
            user: event.args.user,
            pendingAmount: -event.args.amount,
            totalAmount: 0n,
        },
        update: ({ current }) => ({
            pendingAmount: current.pendingAmount - event.args.amount,
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
            },
        });
    }

    return rewardingContract;
}
