import { ponder } from "@/generated";
import {
    bankingContractTable,
    rewardAddedEventTable,
    rewardClaimedEventTable,
    rewardTable,
} from "../../ponder.schema";
import { increaseCampaignsStats } from "../interactions/stats";

ponder.on("CampaignBanks:RewardAdded", async ({ event, context }) => {
    // Try to find a rewarding contract for the given event emitter
    const bankingContract = await context.db.find(bankingContractTable, {
        id: event.log.address,
    });
    if (!bankingContract) {
        console.error(`Banking contract not found: ${event.log.address}`);
        return;
    }

    // Update rewarding contract
    await context.db
        .update(bankingContractTable, {
            id: event.log.address,
        })
        .set({
            totalDistributed:
                bankingContract.totalDistributed + event.args.amount,
        });

    // Update the current user reward (insert it if not found)
    const rewardId = `${event.log.address}-${event.args.user}`;
    await context.db
        .insert(rewardTable)
        .values({
            id: rewardId,
            contractId: bankingContract.id,
            user: event.args.user,
            pendingAmount: event.args.amount,
            totalReceived: event.args.amount,
            totalClaimed: 0n,
        })
        .onConflictDoUpdate((current) => ({
            pendingAmount: current.pendingAmount + event.args.amount,
            totalReceived: current.totalReceived + event.args.amount,
        }));

    // Insert the reward event
    await context.db.insert(rewardAddedEventTable).values({
        id: event.log.id,
        rewardId,
        emitter: event.args.emitter,
        amount: event.args.amount,
        txHash: event.log.transactionHash,
        timestamp: event.block.timestamp,
    });

    // Update the current campaigns stats for the distributed amount
    await increaseCampaignsStats({
        productId: bankingContract.productId,
        context,
        blockNumber: event.block.number,
        increments: {
            totalRewards: event.args.amount,
        },
    });
});

ponder.on("CampaignBanks:RewardClaimed", async ({ event, context: { db } }) => {
    // Try to find a rewarding contract for the given event emitter
    const bankingContract = await db.find(bankingContractTable, {
        id: event.log.address,
    });
    if (!bankingContract) {
        console.error(`Banking contract not found: ${event.log.address}`);
        return;
    }

    // Update rewarding contract
    await db
        .update(bankingContractTable, {
            id: event.log.address,
        })
        .set({
            totalClaimed: bankingContract.totalClaimed + event.args.amount,
        });

    // Update the current user reward (insert it if not found)
    const rewardId = `${event.log.address}-${event.args.user}`;
    await db
        .insert(rewardTable)
        .values({
            id: rewardId,
            contractId: bankingContract.id,
            user: event.args.user,
            totalClaimed: event.args.amount,
            totalReceived: 0n,
            pendingAmount: 0n,
        })
        .onConflictDoUpdate((current) => ({
            pendingAmount: current.pendingAmount - event.args.amount,
            totalClaimed: current.totalClaimed + event.args.amount,
        }));

    // Insert the reward event
    await db.insert(rewardClaimedEventTable).values({
        id: event.log.id,
        rewardId,
        amount: event.args.amount,
        txHash: event.log.transactionHash,
        timestamp: event.block.timestamp,
    });
});
