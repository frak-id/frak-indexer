import { ponder } from "@/generated";

ponder.on("ContentInteraction:ArticleRead", async ({ event, context }) => {
    const { PressEvent } = context.db;

    // Insert the press event
    await PressEvent.create({
        id: event.log.id,
        data: {
            interactionId: event.log.address,
            user: event.args.user,
            type: "READ_ARTICLE",
            timestamp: event.block.timestamp,
            data: { articleId: event.args.articleId },
        },
    });
});
ponder.on("ContentInteraction:ArticleOpened", async ({ event, context }) => {
    const { PressEvent } = context.db;

    // Insert the press event
    await PressEvent.create({
        id: event.log.id,
        data: {
            interactionId: event.log.address,
            user: event.args.user,
            type: "OPEN_ARTICLE",
            timestamp: event.block.timestamp,
            data: { articleId: event.args.articleId },
        },
    });
});

ponder.on("ContentInteraction:UserReferred", async ({ event, context }) => {
    const { PressEvent } = context.db;

    // Insert the press event
    await PressEvent.create({
        id: event.log.id,
        data: {
            interactionId: event.log.address,
            user: event.args.user,
            type: "REFERRED",
            timestamp: event.block.timestamp,
            data: { referrer: event.args.referrer },
        },
    });
});
