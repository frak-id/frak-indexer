import { ponder } from "@/generated";

ponder.on("Campaigns:DistributionCapReset", async ({ event, context }) => {
    const { CampaignCapReset } = context.db;

    const id = `${event.log.address}-${event.args.previousTimestamp}`;

    // Create the new administrator
    await CampaignCapReset.create({
        id,
        data: {
            campaignId: event.log.address,
            timestamp: event.block.timestamp,
            previousTimestamp: BigInt(event.args.previousTimestamp),
            distributedAmount: event.args.distributedAmount,
        },
    });
});
