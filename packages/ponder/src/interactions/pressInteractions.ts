import { ponder } from "@/generated";
import { increaseCampaignsStats } from "./stats";

ponder.on("ProductInteraction:ArticleRead", async ({ event, context }) => {
    const { InteractionEvent } = context.db;

    // Insert the press event
    await InteractionEvent.create({
        id: event.log.id,
        data: {
            interactionId: event.log.address,
            user: event.args.user,
            type: "READ_ARTICLE",
            timestamp: event.block.timestamp,
            data: { articleId: event.args.articleId },
        },
    });

    // Update the current campaigns stats
    await increaseCampaignsStats({
        interactionEmitter: event.log.address,
        blockNumber: event.block.number,
        context,
        increments: {
            readInteractions: 1n,
        },
    });
});
ponder.on("ProductInteraction:ArticleOpened", async ({ event, context }) => {
    const { InteractionEvent } = context.db;

    // Insert the press event
    await InteractionEvent.create({
        id: event.log.id,
        data: {
            interactionId: event.log.address,
            user: event.args.user,
            type: "OPEN_ARTICLE",
            timestamp: event.block.timestamp,
            data: { articleId: event.args.articleId },
        },
    });

    // Update the current campaigns stats
    await increaseCampaignsStats({
        interactionEmitter: event.log.address,
        blockNumber: event.block.number,
        context,
        increments: {
            openInteractions: 1n,
        },
    });
});
