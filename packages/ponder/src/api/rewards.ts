import { ponder } from "@/generated";
import { and, desc, eq, like, not } from "@ponder/core";
import { type Address, isAddress } from "viem";
import { getTokens } from "./tokens";

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
    const { Reward, BankingContract } = ctx.tables;

    // Perform the sql query
    const rewards = await ctx.db
        .select({
            amount: Reward.pendingAmount,
            address: Reward.contractId,
            token: BankingContract.tokenId,
        })
        .from(Reward)
        .innerJoin(BankingContract, eq(BankingContract.id, Reward.contractId))
        .where(and(eq(Reward.user, wallet), not(eq(Reward.pendingAmount, 0n))))
        .orderBy(desc(Reward.pendingAmount));

    // Get all the tokens for the rewards
    const tokens = await getTokens({
        addresses: rewards.map((r) => r.token),
        ctx,
    });

    // Return the result as json
    return ctx.json({
        rewards,
        tokens,
    });
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
    const { RewardAddedEvent, RewardClaimedEvent, BankingContract, Reward } =
        ctx.tables;

    // Perform the sql query
    const rewardAddedPromise = ctx.db
        .select({
            amount: RewardAddedEvent.amount,
            txHash: RewardAddedEvent.txHash,
            timestamp: RewardAddedEvent.timestamp,
            token: BankingContract.tokenId,
        })
        .from(RewardAddedEvent)
        .innerJoin(Reward, eq(Reward.id, RewardAddedEvent.rewardId))
        .innerJoin(BankingContract, eq(BankingContract.id, Reward.contractId))
        .where(like(RewardAddedEvent.rewardId, walletfilter))
        .limit(100)
        .orderBy(desc(RewardAddedEvent.timestamp));

    // Perform the sql query
    const rewardClaimedPromise = ctx.db
        .select({
            amount: RewardClaimedEvent.amount,
            txHash: RewardClaimedEvent.txHash,
            timestamp: RewardClaimedEvent.timestamp,
            token: BankingContract.tokenId,
        })
        .from(RewardClaimedEvent)
        .innerJoin(Reward, eq(Reward.id, RewardClaimedEvent.rewardId))
        .innerJoin(BankingContract, eq(BankingContract.id, Reward.contractId))
        .where(like(RewardClaimedEvent.rewardId, walletfilter))
        .limit(100)
        .orderBy(desc(RewardClaimedEvent.timestamp));

    const [rewardAdded, rewardClaimed] = await Promise.all([
        rewardAddedPromise,
        rewardClaimedPromise,
    ]);

    // Get all the tokens for the rewards events
    const tokens = await getTokens({
        addresses: [...rewardAdded, ...rewardClaimed].map((r) => r.token),
        ctx,
    });

    // Return the result as json
    return ctx.json({
        added: rewardAdded,
        claimed: rewardClaimed,
        tokens,
    });
});
