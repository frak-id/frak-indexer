import { ponder } from "@/generated";
import { increaseCampaignsStats } from "./stats";

ponder.on("ProductInteraction:WebShopOpenned", async ({ event, context }) => {
    const { InteractionEvent } = context.db;

    // Insert the press event
    await InteractionEvent.create({
        id: event.log.id,
        data: {
            interactionId: event.log.address,
            user: event.args.user,
            type: "WEBSHOP_OPENNED",
            timestamp: event.block.timestamp,
        },
    });

    // Update the current campaigns stats
    await increaseCampaignsStats({
        interactionEmitter: event.log.address,
        blockNumber: event.block.number,
        context,
        increments: {
            webshopOpenned: 1n,
        },
    });
});
