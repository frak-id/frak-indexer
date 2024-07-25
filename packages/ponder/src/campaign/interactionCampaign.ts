import * as console from "node:console";
import { ponder } from "@/generated";
import { interactionCampaignAbi } from "../../abis/frak-campaign-abis";

ponder.on("ContentInteraction:CampaignAttached", async ({ event, context }) => {
    const { Campaign, ContentInteractionContract } = context.db;

    // Find the interaction contract
    const interactionContract = await ContentInteractionContract.findUnique({
        id: event.log.address,
    });
    if (!interactionContract) {
        console.error(`Interaction contract not found: ${event.log.address}`);
        return;
    }

    // Get the metadata and create it
    const [name, version] = await context.client.readContract({
        abi: interactionCampaignAbi,
        address: event.args.campaign,
        functionName: "getMetadata",
    });
    await Campaign.upsert({
        id: event.args.campaign,
        create: {
            name,
            version,
            contentId: interactionContract.contentId,
            attached: true,
            attachTimestamp: event.block.timestamp,
        },
        update: {},
    });
});

ponder.on("ContentInteraction:CampaignDetached", async ({ event, context }) => {
    const { Campaign } = context.db;

    // Find the campaign to content and mark it as detached
    await Campaign.update({
        id: event.args.campaign,
        data: {
            attached: false,
            detachTimestamp: event.block.timestamp,
        },
    });
});
