import { ponder } from "@/generated";
import { graphql } from "@ponder/core";
import { eq } from "@ponder/core";
import type { Address } from "viem";

// This is the entry point for the Graphql api
ponder.use("/graphql", graphql());

/* -------------------------------------------------------------------------- */
/*                             Rest campaign APIs                             */
/* -------------------------------------------------------------------------- */

// Get all the campaign for a wallet
ponder.use("/admin/:wallet/campaigns", async (ctx) => {
    // Extract wallet
    const wallet = ctx.req.param("wallet");

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
        .innerJoin(Campaign, eq(ContentAdministrator.contentId, Campaign.id))
        .where(eq(ContentAdministrator.user, wallet as Address));

    // Return the result as json
    return ctx.json(campaigns);
});

// Get all the campaign stats for a wallet
ponder.use("/admin/:wallet/campaigns/stats", async (ctx) => {
    // Extract wallet
    const wallet = ctx.req.param("wallet");

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
        .innerJoin(Campaign, eq(ContentAdministrator.contentId, Campaign.id))
        .innerJoin(
            PressCampaignStats,
            eq(Campaign.contentId, PressCampaignStats.campaignId)
        )
        .where(eq(ContentAdministrator.user, wallet as Address));

    // Return the result as json
    return ctx.json(campaignsStats);
});
