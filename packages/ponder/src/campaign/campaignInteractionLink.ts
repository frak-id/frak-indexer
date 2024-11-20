import * as console from "node:console";
import { ponder } from "@/generated";
import { interactionCampaignAbi } from "../../abis/campaignAbis";
import {
    campaignTable,
    productInteractionContractTable,
    referralCampaignStatsTable,
} from "../../ponder.schema";
import { emptyCampaignStats } from "../interactions/stats";
import { bytesToString } from "../utils/format";

ponder.on(
    "ProductInteraction:CampaignAttached",
    async ({ event, context: { db, client } }) => {
        // Find the interaction contract
        const interactionContract = await db.find(
            productInteractionContractTable,
            {
                id: event.log.address,
            }
        );
        if (!interactionContract) {
            console.error(
                `Interaction contract not found: ${event.log.address}`
            );
            return;
        }

        // Get the metadata and create it
        const [type, version, name] = await client.readContract({
            abi: interactionCampaignAbi,
            address: event.args.campaign,
            functionName: "getMetadata",
            blockNumber: event.block.number,
        });
        const currentCampaign = db.find(campaignTable, {
            id: event.args.campaign,
        });
        if (!currentCampaign) {
            console.error(`Campaign not found: ${event.args.campaign}`);
            return;
        }
        // Update the campaign
        await db
            .update(campaignTable, {
                id: event.args.campaign,
            })
            .set({
                name: bytesToString(name),
                version,
                attached: true,
                attachTimestamp: event.block.timestamp,
            });

        // Upsert press campaign stats if it's the right type
        if (type === "frak.campaign.press") {
            await db
                .insert(referralCampaignStatsTable)
                .values({
                    id: event.args.campaign,
                    campaignId: event.args.campaign,
                    ...emptyCampaignStats,
                })
                .onConflictDoNothing();
        }
    }
);

ponder.on(
    "ProductInteraction:CampaignDetached",
    async ({ event, context: { db } }) => {
        // Find the campaign to product and mark it as detached
        await db
            .update(campaignTable, {
                id: event.args.campaign,
            })
            .set({
                attached: false,
                detachTimestamp: event.block.timestamp,
            });
    }
);
