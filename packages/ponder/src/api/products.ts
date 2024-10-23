import { ponder } from "@/generated";
import { eq, inArray } from "@ponder/core";
import { type Hex, isHex, keccak256, toHex } from "viem";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): string {
    return this.toString();
};

/**
 * Get all the product administrators
 */
ponder.get("/products/:id/administrators", async (ctx) => {
    // Extract the id
    const id = ctx.req.param("id") as Hex;
    if (!isHex(id)) {
        return ctx.text("Invalid product id", 400);
    }

    // Get the tables we will query
    const { Product, ProductAdministrator } = ctx.tables;

    // Perform the sql query
    const administrators = await ctx.db
        .select({
            wallet: ProductAdministrator.user,
            isOwner: ProductAdministrator.isOwner,
            roles: ProductAdministrator.roles,
            addedTimestamp: ProductAdministrator.createdTimestamp,
        })
        .from(ProductAdministrator)
        .innerJoin(Product, eq(ProductAdministrator.productId, Product.id))
        .where(eq(Product.id, BigInt(id)));

    // Return the result as json
    return ctx.json(administrators);
});

/**
 * Get all the product banks
 */
ponder.get("/products/:id/banks", async (ctx) => {
    // Extract the id
    const id = ctx.req.param("id") as Hex;
    if (!isHex(id)) {
        return ctx.text("Invalid product id", 400);
    }

    // Get the tables we will query
    const { BankingContract, Token } = ctx.tables;

    // Perform the sql query
    const administrators = await ctx.db
        .select({
            address: BankingContract.id,
            totalDistributed: BankingContract.totalDistributed,
            totalClaimed: BankingContract.totalClaimed,
            isDistributing: BankingContract.isDistributing,
            token: {
                address: Token.id,
                name: Token.name,
                symbol: Token.symbol,
                decimals: Token.decimals,
            },
        })
        .from(BankingContract)
        .innerJoin(Token, eq(BankingContract.tokenId, Token.id))
        .where(eq(BankingContract.productId, BigInt(id)));

    // Return the result as json
    return ctx.json(administrators);
});

/**
 * Get the overall product info
 */
ponder.get("/products/info", async ({ req, db, tables, json }) => {
    // Extract the product id
    const domain = req.query("domain");
    let productId = req.query("id") as Hex | undefined;

    // If no id provided, recompute it from the domain
    if (!productId && domain) {
        productId = keccak256(toHex(domain));
    }

    if (!productId || !isHex(productId)) {
        return json({ msg: "Invalid product id", productId, domain });
    }

    // Get the product from the db
    const products = await db
        .select()
        .from(tables.Product)
        .where(eq(tables.Product.id, BigInt(productId)));
    const product = products?.[0];

    // If not found, early exit
    if (!product) {
        return json({ msg: "Product not found", productId, domain });
    }

    // Get all the admninistrators
    const administrators = await db
        .select()
        .from(tables.ProductAdministrator)
        .where(eq(tables.ProductAdministrator.productId, BigInt(productId)));

    // Get all the banks
    const banks = await db
        .select()
        .from(tables.BankingContract)
        .where(eq(tables.BankingContract.productId, BigInt(productId)));

    // Get the interaction contracts
    const interactionContracts = await db
        .select()
        .from(tables.ProductInteractionContract)
        .where(
            eq(tables.ProductInteractionContract.productId, BigInt(productId))
        );

    // Get the campaigns
    const campaigns = await db
        .select()
        .from(tables.Campaign)
        .where(eq(tables.Campaign.productId, BigInt(productId)));

    // Get the campaigns tats
    const campaignStats = campaigns.length
        ? await db
              .select()
              .from(tables.ReferralCampaignStats)
              .where(
                  inArray(
                      tables.ReferralCampaignStats.campaignId,
                      campaigns.map((c) => c.id)
                  )
              )
        : [];

    // Return all the data related to the product
    return json({
        product,
        banks,
        interactionContracts,
        administrators,
        campaigns,
        campaignStats,
    });
});
