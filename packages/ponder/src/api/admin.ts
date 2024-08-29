import { ponder } from "@/generated";
import { eq } from "@ponder/core";
import { type Address, isAddress } from "viem";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): string {
    return this.toString();
};

/**
 * Get all of the content where a user is either manager or owner
 */
ponder.get("/admin/:wallet/contents", async (ctx) => {
    // Extract wallet
    const wallet = ctx.req.param("wallet") as Address;
    if (!isAddress(wallet)) {
        return ctx.text("Invalid wallet address", 400);
    }

    // Get the tables we will query
    const { Content, ContentAdministrator } = ctx.tables;

    // Perform the sql query
    const contents = await ctx.db
        .select({
            id: ContentAdministrator.contentId,
            isContentOwner: ContentAdministrator.isOwner,
            domain: Content.domain,
            name: Content.name,
            contentTypes: Content.contentTypes,
        })
        .from(ContentAdministrator)
        .innerJoin(Content, eq(ContentAdministrator.contentId, Content.id))
        .where(eq(ContentAdministrator.user, wallet));

    // Return the result as json
    return ctx.json(contents);
});

/**
 * Get all the campaign for a wallet, where the wallet is the manager
 */
ponder.get("/admin/:wallet/campaigns", async (ctx) => {
    // Extract wallet
    const wallet = ctx.req.param("wallet") as Address;
    if (!isAddress(wallet)) {
        return ctx.text("Invalid wallet address", 400);
    }

    // Get the tables we will query
    const { ContentAdministrator, Campaign } = ctx.tables;

    // Perform the sql query
    const campaigns = await ctx.db
        .select({
            contentId: ContentAdministrator.contentId,
            isContentOwner: ContentAdministrator.isOwner,
            id: Campaign.id,
            name: Campaign.name,
            version: Campaign.version,
            attached: Campaign.attached,
            attachTimestamp: Campaign.attachTimestamp,
            detachTimestamp: Campaign.detachTimestamp,
        })
        .from(ContentAdministrator)
        .innerJoin(
            Campaign,
            eq(ContentAdministrator.contentId, Campaign.contentId)
        )
        .where(eq(ContentAdministrator.user, wallet));

    // Return the result as json
    return ctx.json(campaigns);
});

// Get all the campaign stats for a wallet
ponder.get("/admin/:wallet/campaigns/stats", async (ctx) => {
    // Extract wallet
    const wallet = ctx.req.param("wallet") as Address;
    if (!isAddress(wallet)) {
        return ctx.text("Invalid wallet address", 400);
    }

    // Get the tables we will query
    const { ContentAdministrator, Campaign, PressCampaignStats } = ctx.tables;

    // Perform the sql query
    const campaignsStats = await ctx.db
        .select({
            contentId: ContentAdministrator.contentId,
            isContentOwner: ContentAdministrator.isOwner,
            id: Campaign.id,
            totalInteractions: PressCampaignStats.totalInteractions,
            openInteractions: PressCampaignStats.openInteractions,
            readInteractions: PressCampaignStats.readInteractions,
            referredInteractions: PressCampaignStats.referredInteractions,
            createReferredLinkInteractions:
                PressCampaignStats.createReferredLinkInteractions,
            totalRewards: PressCampaignStats.totalRewards,
        })
        .from(ContentAdministrator)
        .innerJoin(
            Campaign,
            eq(ContentAdministrator.contentId, Campaign.contentId)
        )
        .innerJoin(
            PressCampaignStats,
            eq(Campaign.id, PressCampaignStats.campaignId)
        )
        .where(eq(ContentAdministrator.user, wallet));

    // Return the result as json
    return ctx.json(campaignsStats);
});
