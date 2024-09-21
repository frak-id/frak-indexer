import { ponder } from "@/generated";
import { eq } from "@ponder/core";
import { type Hex, isHex } from "viem";

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
    const { BankingContract } = ctx.tables;

    // Perform the sql query
    const administrators = await ctx.db
        .select({
            token: BankingContract.tokenId,
            totalDistributed: BankingContract.totalDistributed,
            totalClaimed: BankingContract.totalClaimed,
            isDistributing: BankingContract.isDistributing,
        })
        .from(BankingContract);

    // Return the result as json
    return ctx.json(administrators);
});
