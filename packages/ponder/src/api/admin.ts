import { ponder } from "@/generated";
import { eq } from "@ponder/core";
import { type Address, isAddress } from "viem";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): string {
    return this.toString();
};

/**
 * Get all of the product where a user is either manager or owner
 */
ponder.get("/admin/:wallet/products", async (ctx) => {
    // Extract wallet
    const wallet = ctx.req.param("wallet") as Address;
    if (!isAddress(wallet)) {
        return ctx.text("Invalid wallet address", 400);
    }

    // Get the tables we will query
    const { Product, ProductAdministrator } = ctx.tables;

    // Perform the sql query
    const products = await ctx.db
        .select({
            id: ProductAdministrator.productId,
            isOwner: ProductAdministrator.isOwner,
            roles: ProductAdministrator.roles,
            domain: Product.domain,
            name: Product.name,
            productTypes: Product.productTypes,
        })
        .from(ProductAdministrator)
        .innerJoin(Product, eq(ProductAdministrator.productId, Product.id))
        .where(eq(ProductAdministrator.user, wallet));

    // Return the result as json
    return ctx.json(products);
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
    const { ProductAdministrator, Campaign } = ctx.tables;

    // Perform the sql query
    const campaigns = await ctx.db
        .select({
            productId: ProductAdministrator.productId,
            isOwner: ProductAdministrator.isOwner,
            roles: ProductAdministrator.roles,
            id: Campaign.id,
            type: Campaign.type,
            name: Campaign.name,
            version: Campaign.version,
            attached: Campaign.attached,
            attachTimestamp: Campaign.attachTimestamp,
            detachTimestamp: Campaign.detachTimestamp,
        })
        .from(ProductAdministrator)
        .innerJoin(
            Campaign,
            eq(ProductAdministrator.productId, Campaign.productId)
        )
        .where(eq(ProductAdministrator.user, wallet));

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
    const { ProductAdministrator, Campaign, ReferralCampaignStats } =
        ctx.tables;

    // Perform the sql query
    const campaignsStats = await ctx.db
        .select({
            productId: ProductAdministrator.productId,
            isOwner: ProductAdministrator.isOwner,
            roles: ProductAdministrator.roles,
            id: Campaign.id,
            bank: Campaign.bankingContractId,
            totalInteractions: ReferralCampaignStats.totalInteractions,
            openInteractions: ReferralCampaignStats.openInteractions,
            readInteractions: ReferralCampaignStats.readInteractions,
            referredInteractions: ReferralCampaignStats.referredInteractions,
            createReferredLinkInteractions:
                ReferralCampaignStats.createReferredLinkInteractions,
            totalRewards: ReferralCampaignStats.totalRewards,
        })
        .from(ProductAdministrator)
        .innerJoin(
            Campaign,
            eq(ProductAdministrator.productId, Campaign.productId)
        )
        .innerJoin(
            ReferralCampaignStats,
            eq(Campaign.id, ReferralCampaignStats.campaignId)
        )
        .where(eq(ProductAdministrator.user, wallet));

    // Return the result as json
    return ctx.json(campaignsStats);
});
