import { ponder } from "@/generated";
import { increaseCampaignsInteractions } from "./stats";

ponder.on("ProductInteraction:PurchaseStarted", async ({ event, context }) => {
    const { InteractionEvent } = context.db;

    // Insert the press event
    await InteractionEvent.create({
        id: event.log.id,
        data: {
            interactionId: event.log.address,
            user: event.args.user,
            type: "PURCHASE_STARTED",
            timestamp: event.block.timestamp,
            data: { purchaseId: event.args.purchaseId },
        },
    });

    // Update the current campaigns stats
    await increaseCampaignsInteractions({
        interactionEmitter: event.log.address,
        blockNumber: event.block.number,
        context,
        increments: {
            purchaseStartedInteractions: 1n,
        },
    });
});
ponder.on(
    "ProductInteraction:PurchaseCompleted",
    async ({ event, context }) => {
        const { InteractionEvent } = context.db;

        // Insert the press event
        await InteractionEvent.create({
            id: event.log.id,
            data: {
                interactionId: event.log.address,
                user: event.args.user,
                type: "PURCHASE_COMPLETED",
                timestamp: event.block.timestamp,
                data: { purchaseId: event.args.purchaseId },
            },
        });

        // Update the current campaigns stats
        await increaseCampaignsInteractions({
            interactionEmitter: event.log.address,
            blockNumber: event.block.number,
            context,
            increments: {
                purchaseCompletedInteractions: 1n,
            },
        });
    }
);
