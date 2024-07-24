import { ponder } from "@/generated";
import { increaseCampaignsInteractions } from "./stats";

ponder.on("ContentInteraction:ArticleRead", async ({ event, context }) => {
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
    await increaseCampaignsInteractions({
        interactionEmitter: event.log.address,
        context,
        increments: {
            readInteractions: 1n,
        },
    });
});
ponder.on("ContentInteraction:ArticleOpened", async ({ event, context }) => {
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
    await increaseCampaignsInteractions({
        interactionEmitter: event.log.address,
        context,
        increments: {
            openInteractions: 1n,
        },
    });
});
