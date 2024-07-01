import { ponder } from "@/generated";

ponder.on("ContentRegistry:ContentMinted", async ({ event, context }) => {
    const { Content } = context.db;

    // Create the content
    await Content.create({
        id: event.args.contentId,
        data: {
            name: event.args.name,
            domain: event.args.domain,
            contentTypes: event.args.contentTypes,
            createTimestamp: event.block.timestamp,
        },
    });
});

ponder.on("ContentRegistry:ContentUpdated", async ({ event, context }) => {
    const { Content } = context.db;

    // Update the content
    await Content.update({
        id: event.args.contentId,
        data: {
            name: event.args.name,
            contentTypes: event.args.contentTypes,
            lastUpdateTimestamp: event.block.timestamp,
        },
    });
});
