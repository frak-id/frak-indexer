import type { Context, Schema } from "@/generated";
import type { Address } from "viem";

/**
 * Get the rewarding contract for the given event emitter
 * @param interactionContract
 * @param context
 * @param increments fields to increments
 */
export async function increaseCampaignsInteractions({
    interactionEmitter,
    context,
    increments,
}: {
    interactionEmitter: Address;
    context: Context;
    increments: Partial<
        Pick<
            Schema["PressCampaignStats"],
            | "openInteractions"
            | "readInteractions"
            | "referredInteractions"
            | "createReferredLinkInteractions"
        >
    >;
}) {
    const { ContentInteractionContract, Campaign, PressCampaignStats } =
        context.db;

    // Find the interaction contract
    const interactionContract = await ContentInteractionContract.findUnique({
        id: interactionEmitter,
    });

    if (!interactionContract) {
        return;
    }

    // Find all the associated campaigns, of referral type, that are attached
    const campaigns = await Campaign.findMany({
        where: {
            contentId: interactionContract.contentId,
            name: "frak.campaign.referral",
            attached: true,
        },
    });
    if (!campaigns.items.length) {
        return;
    }

    // Perform the increments
    // todo: Should use an `updateMany` if we are sure that campaign stats are created
    for (const campaign of campaigns.items) {
        if (!campaign.id) {
            console.error("Campaign id not found", campaign);
            continue;
        }
        try {
            // Create the stats if not found
            await PressCampaignStats.upsert({
                id: campaign.id,
                create: {
                    campaignId: campaign.id,
                    totalInteractions: 0n,
                    openInteractions: 0n,
                    readInteractions: 0n,
                    referredInteractions: 0n,
                    createReferredLinkInteractions: 0n,
                    totalRewards: 0n,
                },
                // Update the given field by incrementing them
                update: ({ current }) => {
                    return {
                        ...current,
                        totalInteractions: current.totalInteractions + 1n,
                        openInteractions:
                            current.openInteractions +
                            (increments.openInteractions ?? 0n),
                        readInteractions:
                            current.readInteractions +
                            (increments.readInteractions ?? 0n),
                        referredInteractions:
                            current.referredInteractions +
                            (increments.referredInteractions ?? 0n),
                        createReferredLinkInteractions:
                            current.createReferredLinkInteractions +
                            (increments.createReferredLinkInteractions ?? 0n),
                    };
                },
            });
        } catch (error) {
            console.error("Error while incrementing campaign stats", error, {
                campaign,
                increments,
            });
        }
    }
}
