import * as console from "node:console";
import { ponder } from "@/generated";
import {
    interactionCampaignAbi,
    referralCampaignAbi,
} from "../../abis/campaignAbis";
import { emptyCampaignStats } from "../interactions/stats";

/**
 * On new campaign creation
 */
ponder.on("CampaignsFactory:CampaignCreated", async ({ event, context }) => {
    const { Campaign, ReferralCampaignStats } = context.db;

    // Get the metadata and config of the campaign
    const [metadataResult, linkResult, configResult] =
        await context.client.multicall({
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
        });

    if (
        metadataResult.status !== "success" ||
        linkResult.status !== "success"
    ) {
        console.error(
            `Failed to get metadata/linkResult for campaign ${event.args.campaign}`
        );
        return;
    }
    const [name, version] = metadataResult.result;
    const [productId, interactionContract] = linkResult.result;

    // Create the campaign
    await Campaign.create({
        id: event.args.campaign,
        data: {
            name,
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
        },
    });

    // Upsert press campaign stats if it's the right type
    if (name === "frak.campaign.press") {
        await ReferralCampaignStats.upsert({
            id: event.args.campaign,
            create: {
                campaignId: event.args.campaign,
                ...emptyCampaignStats,
            },
            update: {},
        });
    }
});
