import { ponder } from "@/generated";
import { hexToString, isHex } from "viem";
import { productRegistryAbi } from "../abis/registryAbis";

ponder.on("ProductRegistry:ProductMinted", async ({ event, context }) => {
    const { Product } = context.db;

    // Get the metadata url
    const metadataUrl = await context.client.readContract({
        abi: productRegistryAbi,
        functionName: "tokenURI",
        address: context.contracts.ProductRegistry.address,
        args: [event.args.productId],
    });

    // Create the product
    await Product.create({
        id: event.args.productId,
        data: {
            name: event.args.name,
            formattedName: isHex(event.args.name)
                ? hexToString(event.args.name)
                : undefined,
            domain: event.args.domain,
            productTypes: event.args.productTypes,
            createTimestamp: event.block.timestamp,
            metadataUrl,
        },
    });
});

ponder.on("ProductRegistry:ProductUpdated", async ({ event, context }) => {
    const { Product } = context.db;

    let metadataUrl = undefined;

    // Update the metadata url if needed
    if (event.args.customMetadataUrl.length > 0) {
        metadataUrl = event.args.customMetadataUrl;
    }

    // Update the product
    await Product.update({
        id: event.args.productId,
        data: ({ current }) => ({
            name: event.args.name,
            formattedName: isHex(event.args.name)
                ? hexToString(event.args.name)
                : undefined,
            productTypes: event.args.productTypes,
            lastUpdateTimestamp: event.block.timestamp,
            metadataUrl: metadataUrl ?? current.metadataUrl,
        }),
    });
});
