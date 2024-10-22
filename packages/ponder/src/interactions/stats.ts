import type { Context, Schema } from "@/generated";
import type { Address } from "viem";
import { interactionCampaignAbi } from "../../abis/campaignAbis";

/**
 * Default campaign stats
 */
export const emptyCampaignStats = {
    totalInteractions: 0n,
    openInteractions: 0n,
    readInteractions: 0n,
    referredInteractions: 0n,
    createReferredLinkInteractions: 0n,
    purchaseStartedInteractions: 0n,
    purchaseCompletedInteractions: 0n,
    webshopOpenned: 0n,
    totalRewards: 0n,
};

export type StatsIncrementsParams = Partial<
    Omit<Schema["ReferralCampaignStats"], "id" | "campaignId">
>;

/**
 * Get the rewarding contract for the given event emitter
 * @param interactionContract
 * @param context
 * @param increments fields to increments
 */
export async function increaseCampaignsStats({
    interactionEmitter,
    productId,
    context,
    increments,
    blockNumber,
}: {
    interactionEmitter?: Address;
    productId?: bigint;
    context: Context;
    blockNumber: bigint;
    increments: StatsIncrementsParams;
}) {
    const { ProductInteractionContract, Campaign, ReferralCampaignStats } =
        context.db;

    // Find the interaction contract
    let interactionContract: Schema["ProductInteractionContract"] | null = null;
    if (interactionEmitter) {
        interactionContract = await ProductInteractionContract.findUnique({
            id: interactionEmitter,
        });
    } else if (productId) {
        const interactions = await ProductInteractionContract.findMany({
            where: { productId },
        });
        interactionContract = interactions?.items?.[0] ?? null;
    }

    if (!interactionContract) {
        console.log("Interaction contract not found for stats update", {
            interactionEmitter,
            productId,
        });
        return;
    }

    if (!interactionContract) {
        console.log("Interaction contract not found for stats update", {
            interactionEmitter,
        });
        return;
    }

    // Find all the associated campaigns, of referral type, that are attached
    const campaigns = await Campaign.findMany({
        where: {
            productId: interactionContract.productId,
            type: "frak.campaign.referral",
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
            await ReferralCampaignStats.upsert({
                id: campaign.id,
                create: {
                    ...emptyCampaignStats,
                    ...increments,
                    campaignId: campaign.id,
                },
                // Update the given field by incrementing them
                update: ({ current }) => updateStats(current, increments),
            });
        } catch (error) {
            console.error("Error while incrementing campaign stats", error, {
                campaign,
                increments,
            });
        }
    }
}

// Define a function to handle the update logic
function updateStats(
    current: Schema["ReferralCampaignStats"],
    increments: StatsIncrementsParams
) {
    const updatedStats = {
        ...current,
        totalInteractions: current.totalInteractions + 1n,
    };

    for (const key of Object.keys(increments)) {
        const tKey = key as keyof StatsIncrementsParams;
        updatedStats[tKey] = (current[tKey] ?? 0n) + (increments[tKey] ?? 0n);
    }

    return updatedStats;
}
