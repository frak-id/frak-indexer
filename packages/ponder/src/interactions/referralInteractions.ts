import { ponder } from "@/generated";
import { increaseCampaignsInteractions } from "./stats";

ponder.on(
    "ProductInteraction:ReferralLinkCreation",
    async ({ event, context }) => {
        const { InteractionEvent } = context.db;

        // Insert the press event
        await InteractionEvent.create({
            id: event.log.id,
            data: {
                interactionId: event.log.address,
                user: event.args.user,
                type: "CREATE_REFERRAL_LINK",
                timestamp: event.block.timestamp,
                data: undefined,
            },
        });

        // Update the current campaigns stats
        await increaseCampaignsInteractions({
            interactionEmitter: event.log.address,
            blockNumber: event.block.number,
            context,
            increments: {
                createReferredLinkInteractions: 1n,
            },
        });
    }
);

ponder.on("ProductInteraction:UserReferred", async ({ event, context }) => {
    const { InteractionEvent } = context.db;

    // Insert the press event
    await InteractionEvent.create({
        id: event.log.id,
        data: {
            interactionId: event.log.address,
            user: event.args.user,
            type: "REFERRED",
            timestamp: event.block.timestamp,
            data: { referrer: event.args.referrer },
        },
    });

    // Update the current campaigns stats
    await increaseCampaignsInteractions({
        interactionEmitter: event.log.address,
        blockNumber: event.block.number,
        context,
        increments: {
            referredInteractions: 1n,
        },
    });
});
