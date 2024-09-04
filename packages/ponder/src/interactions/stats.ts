import type { Context, Schema } from "@/generated";
import type { Address } from "viem";
import { interactionCampaignAbi } from "../../abis/frak-campaign-abis";

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
    blockNumber,
}: {
    interactionEmitter: Address;
    context: Context;
    blockNumber: bigint;
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
    const { ProductInteractionContract, Campaign, PressCampaignStats } =
        context.db;

    // Find the interaction contract
    const interactionContract = await ProductInteractionContract.findUnique({
        id: interactionEmitter,
    });

    if (!interactionContract) {
        return;
    }

    // Find all the associated campaigns, of referral type, that are attached
    const campaigns = await Campaign.findMany({
        where: {
            productId: interactionContract.productId,
            name: "frak.campaign.referral",
            attached: true,
        },
    });
    if (!campaigns.items.length) {
        return;
    }

    // Ensure the given campaign was active at this block
    let isActiveDuringInteraction: boolean[] = [];
    try {
        isActiveDuringInteraction = await context.client.multicall({
            allowFailure: false,
            contracts: campaigns.items.map(
                (campaign) =>
                    ({
                        address: campaign.id,
                        abi: interactionCampaignAbi,
                        functionName: "isActive",
                    }) as const
            ),
            blockNumber: blockNumber,
        });
    } catch (error) {
        console.error("Error during campaign.isActive multicall check", error);
        return;
    }

    // Perform the increments
    // todo: Should use an `updateMany` if we are sure that campaign stats are created
    for (const [index, campaign] of campaigns.items.entries()) {
        if (!campaign.id) {
            console.error("Campaign id not found", campaign);
            continue;
        }

        // Check if the campaign was active during the interaction
        if (!isActiveDuringInteraction[index]) {
            console.log("Campaign was not active during the interaction", {
                campaign,
                interactionEmitter,
            });
            continue;
        }

        try {
            // Create the stats if not found
            await PressCampaignStats.upsert({
                id: campaign.id,
                create: {
                    campaignId: campaign.id,
                    totalInteractions: 0n,
                    openInteractions: increments.openInteractions ?? 0n,
                    readInteractions: increments.readInteractions ?? 0n,
                    referredInteractions: increments.referredInteractions ?? 0n,
                    createReferredLinkInteractions:
                        increments.createReferredLinkInteractions ?? 0n,
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
