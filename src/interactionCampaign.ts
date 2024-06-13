import * as console from "node:console";
import { ponder } from "@/generated";
import { interactionCampaignAbi } from "../abis/frak-campaign-abis";

ponder.on("ContentInteraction:CampaignAttached", async ({ event, context }) => {
    const { Campaign, CampaignToContent, ContentInteractionContract } =
        context.db;

    // Find the interaction contract
    const interactionContract = await ContentInteractionContract.findUnique({
        id: event.log.address,
    });
    if (!interactionContract) {
        console.error(`Interaction contract not found: ${event.log.address}`);
        return;
    }

    // Try to find the campaign
    const campaign = await Campaign.findUnique({ id: event.args.campaign });
    if (!campaign) {
        // If not found, get the metadata and create it
        const [name, version] = await context.client.readContract({
            abi: interactionCampaignAbi,
            address: event.args.campaign,
            functionName: "getMetadata",
        });
        await Campaign.create({
            id: event.args.campaign,
            data: {
                name,
                version,
            },
        });
    }

    // Insert the content to campaign link
    await CampaignToContent.create({
        id: `${event.args.campaign}-${event.log.address}`,
        data: {
            campaignId: event.args.campaign,
            contentId: interactionContract.contentId,
            attached: true,
            attachTimestamp: event.block.timestamp,
        },
    });
});

ponder.on("ContentInteraction:CampaignDetached", async ({ event, context }) => {
    const { CampaignToContent } = context.db;

    // Find the campaign to content and mark it as detached
    await CampaignToContent.update({
        id: `${event.args.campaign}-${event.log.address}`,
        data: {
            attached: false,
            detachTimestamp: event.block.timestamp,
        },
    });
});
