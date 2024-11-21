import * as console from "node:console";
import { ponder } from "@/generated";
import {
    interactionCampaignAbi,
    referralCampaignAbi,
} from "../../abis/campaignAbis";
import { campaignTable, referralCampaignStatsTable } from "../../ponder.schema";
import { emptyCampaignStats } from "../interactions/stats";
import { bytesToString } from "../utils/format";

/**
 * On new campaign creation
 */
ponder.on(
    "CampaignsFactory:CampaignCreated",
    async ({ event, context: { client, db } }) => {
        // Get the metadata and config of the campaign
        const [metadataResult, linkResult, configResult] =
            await client.multicall({
                contracts: [
                    {
                        abi: interactionCampaignAbi,
                        address: event.args.campaign,
                        functionName: "getMetadata",
                    } as const,
                    {
                        abi: interactionCampaignAbi,
                        address: event.args.campaign,
                        functionName: "getLink",
                    } as const,
                    {
                        abi: referralCampaignAbi,
                        address: event.args.campaign,
                        functionName: "getConfig",
                    } as const,
                ],
                allowFailure: true,
                blockNumber: event.block.number,
            });

        if (
            metadataResult.status !== "success" ||
            linkResult.status !== "success"
        ) {
            console.error(
                `Failed to get metadata/linkResult for campaign ${event.args.campaign}`,
                { event }
            );
            return;
        }
        const [type, version, name] = metadataResult.result;
        const [productId, interactionContract] = linkResult.result;
        const formattedName = bytesToString(name);

        // Create the campaign
        await db.insert(campaignTable).values({
            id: event.args.campaign,
            type,
            name: formattedName,
            version,
            productId,
            interactionContractId: interactionContract,
            attached: false,
            attachTimestamp: 0n,
            bankingContractId:
                configResult.status === "success"
                    ? configResult.result[2]
                    : undefined,
            isAuthorisedOnBanking: false,
        });

        // Upsert press campaign stats if it's the right type
        if (type === "frak.campaign.referral") {
            await db
                .insert(referralCampaignStatsTable)
                .values({
                    campaignId: event.args.campaign,
                    ...emptyCampaignStats,
                })
                .onConflictDoNothing();
        }
    }
);
