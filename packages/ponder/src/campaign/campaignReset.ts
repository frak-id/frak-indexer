import { ponder } from "@/generated";
import { campaignCapResetTable } from "../../ponder.schema";

ponder.on(
    "Campaigns:DistributionCapReset",
    async ({ event, context: { db } }) => {
        const id = `${event.log.address}-${event.args.previousTimestamp}`;

        await db.insert(campaignCapResetTable).values({
            id,
            campaignId: event.log.address,
            timestamp: event.block.timestamp,
            previousTimestamp: BigInt(event.args.previousTimestamp),
            distributedAmount: event.args.distributedAmount,
        });
    }
);
