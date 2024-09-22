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
