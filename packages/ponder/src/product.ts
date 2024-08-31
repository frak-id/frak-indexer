import { ponder } from "@/generated";

ponder.on("ProductRegistry:ProductMinted", async ({ event, context }) => {
    const { Product } = context.db;

    // Create the product
    await Product.create({
        id: event.args.productId,
        data: {
            name: event.args.name,
            domain: event.args.domain,
            productTypes: event.args.productTypes,
            createTimestamp: event.block.timestamp,
        },
    });
});

ponder.on("ProductRegistry:ProductUpdated", async ({ event, context }) => {
    const { Product } = context.db;

    // Update the product
    await Product.update({
        id: event.args.productId,
        data: {
            name: event.args.name,
            productTypes: event.args.productTypes,
            lastUpdateTimestamp: event.block.timestamp,
        },
    });
});
