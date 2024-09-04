import * as console from "node:console";
import { ponder } from "@/generated";
import { interactionCampaignAbi } from "../../abis/frak-campaign-abis";

ponder.on("ProductInteraction:CampaignAttached", async ({ event, context }) => {
    const { Campaign, ProductInteractionContract, PressCampaignStats } =
        context.db;

    // Find the interaction contract
    const interactionContract = await ProductInteractionContract.findUnique({
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
            productId: interactionContract.productId,
            attached: true,
            attachTimestamp: event.block.timestamp,
        },
        update: {},
    });

    // Upsert press campaign stats if it's the right type
    if (name === "frak.campaign.press") {
        await PressCampaignStats.upsert({
            id: event.args.campaign,
            create: {
                campaignId: event.args.campaign,
                totalInteractions: 0n,
                openInteractions: 0n,
                readInteractions: 0n,
                referredInteractions: 0n,
                createReferredLinkInteractions: 0n,
                totalRewards: 0n,
            },
            update: {},
        });
    }
});

ponder.on("ProductInteraction:CampaignDetached", async ({ event, context }) => {
    const { Campaign } = context.db;

    // Find the campaign to product and mark it as detached
    await Campaign.update({
        id: event.args.campaign,
        data: {
            attached: false,
            detachTimestamp: event.block.timestamp,
        },
    });
});
