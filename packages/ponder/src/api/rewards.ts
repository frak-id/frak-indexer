import { ponder } from "@/generated";
import { and, desc, eq, like, not } from "@ponder/core";
import { type Address, isAddress } from "viem";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): string {
    return this.toString();
};

/**
 * Get all the current rewards for a wallet
 */
ponder.get("/rewards/:wallet", async (ctx) => {
    // Extract wallet
    const wallet = ctx.req.param("wallet") as Address;
    if (!isAddress(wallet)) {
        return ctx.text("Invalid wallet address", 400);
    }

    // Get the tables we will query
    const { Reward } = ctx.tables;

    // Perform the sql query
    const rewards = await ctx.db
        .select({
            amount: Reward.pendingAmount,
            address: Reward.contractId,
        })
        .from(Reward)
        .where(and(eq(Reward.user, wallet), not(eq(Reward.pendingAmount, 0n))))
        .orderBy(desc(Reward.pendingAmount));

    // Return the result as json
    return ctx.json(rewards);
});

/**
 * Get all the rewards history for a wallet
 */
ponder.get("/rewards/:wallet/history", async (ctx) => {
    // Extract wallet
    const wallet = ctx.req.param("wallet") as Address;
    if (!isAddress(wallet)) {
        return ctx.text("Invalid wallet address", 400);
    }

    const walletfilter = `%${wallet}`;

    // Get the tables we will query
    const { RewardAddedEvent, RewardClaimedEvent } = ctx.tables;

    // Perform the sql query
    const rewardAddedPromise = ctx.db
        .select({
            amount: RewardAddedEvent.amount,
            txHash: RewardAddedEvent.txHash,
            timestamp: RewardAddedEvent.timestamp,
        })
        .from(RewardAddedEvent)
        .where(like(RewardAddedEvent.rewardId, walletfilter))
        .limit(100)
        .orderBy(desc(RewardAddedEvent.timestamp));

    // Perform the sql query
    const rewardClaimedPromise = ctx.db
        .select({
            amount: RewardClaimedEvent.amount,
            txHash: RewardClaimedEvent.txHash,
            timestamp: RewardClaimedEvent.timestamp,
        })
        .from(RewardClaimedEvent)
        .where(like(RewardClaimedEvent.rewardId, walletfilter))
        .limit(100)
        .orderBy(desc(RewardClaimedEvent.timestamp));

    const [rewardAdded, rewardClaimed] = await Promise.all([
        rewardAddedPromise,
        rewardClaimedPromise,
    ]);

    // Return the result as json
    return ctx.json({
        added: rewardAdded,
        claimed: rewardClaimed,
    });
});
