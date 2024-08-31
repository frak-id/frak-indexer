import { ponder } from "@/generated";
import { and, eq, not } from "@ponder/core";
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
        .where(
            and(
                // Find the product
                eq(Product.id, BigInt(id)),
                // Where owner and administrator is set
                and(
                    not(eq(ProductAdministrator.isOwner, false)),
                    not(eq(ProductAdministrator.roles, 0n))
                )
            )
        );

    // Return the result as json
    return ctx.json(administrators);
});
