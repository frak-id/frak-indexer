import { ponder } from "@/generated";
import { emptyCampaignStats } from "../interactions/stats";

ponder.on("CampaignBanks:RewardAdded", async ({ event, context }) => {
    const { BankingContract, Reward, RewardAddedEvent, ReferralCampaignStats } =
        context.db;

    // Try to find a rewarding contract for the given event emitter
    const bankingContract = await BankingContract.findUnique({
        id: event.log.address,
    });
    if (!bankingContract) {
        console.error(`Banking contract not found: ${event.log.address}`);
        return;
    }

    // Update rewarding contract
    await BankingContract.update({
        id: bankingContract.id,
        data: ({ current }) => ({
            totalDistributed: current.totalDistributed + event.args.amount,
        }),
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
    const bankingContract = await BankingContract.findUnique({
        id: event.log.address,
    });
    if (!bankingContract) {
        console.error(`Banking contract not found: ${event.log.address}`);
        return;
    }

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
