import { ponder } from "@/generated";
import { count, countDistinct, eq, gte } from "@ponder/core";

/**
 * Get the overall system stats
 */
ponder.get("/stats/overall", async (ctx) => {
    // Get all the product ids for this admin
    const { InteractionEvent, ProductInteractionContract, Product } =
        ctx.tables;

    // Get the total nbr of user who performed an interaction
    const totalInteractions = await ctx.db
        .select({
            count: countDistinct(InteractionEvent.user),
        })
        .from(InteractionEvent);
    const totalPerType = await ctx.db
        .select({
            name: InteractionEvent.type,
            count: countDistinct(InteractionEvent.user),
        })
        .from(InteractionEvent)
        .groupBy(InteractionEvent.type);
    const totalPerProduct = await ctx.db
        .select({
            name: Product.name,
            count: countDistinct(InteractionEvent.user),
        })
        .from(InteractionEvent)
        .innerJoin(
            ProductInteractionContract,
            eq(InteractionEvent.interactionId, ProductInteractionContract.id)
        )
        .innerJoin(
            Product,
            eq(ProductInteractionContract.productId, Product.id)
        )
        .groupBy(Product.id);

    // Get the min time for the WAU and DAU
    const wauMinTime = BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000n;
    const dauMinTime = BigInt(Date.now() - 30 * 60 * 60 * 1000) / 1000n;

    // Get the WAU and DAU
    const wauInteractions = await ctx.db
        .select({
            count: countDistinct(InteractionEvent.user),
        })
        .from(InteractionEvent)
        .where(gte(InteractionEvent.timestamp, wauMinTime));
    const dauInteractions = await ctx.db
        .select({
            count: countDistinct(InteractionEvent.user),
        })
        .from(InteractionEvent)
        .where(gte(InteractionEvent.timestamp, dauMinTime));

    // Total number of product registered
    const totalProducts = await ctx.db.select({ count: count() }).from(Product);

    return ctx.json({
        interactions: {
            total: totalInteractions[0]?.count,
            wau: wauInteractions[0]?.count,
            dau: dauInteractions[0]?.count,
            totalPerType,
            totalPerProduct,
        },
        products: totalProducts[0]?.count,
    });
});
