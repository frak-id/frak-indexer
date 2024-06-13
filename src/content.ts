import { ponder } from "@/generated";
import {isAddressEqual, toHex, zeroAddress} from "viem";

ponder.on("ContentRegistry:ContentMinted", async ({ event, context }) => {
    const { Content } = context.db;

    // Create the content
    await Content.create({
        id: event.args.contentId,
        data: {
            name: event.args.name,
            domain: event.args.domain,
            contentTypes: event.args.contentTypes,
            createTimestamp: event.block.timestamp,
        },
    });
});

ponder.on("ContentRegistry:ContentUpdated", async ({ event, context }) => {
    const { Content } = context.db;

    // Update the content
    await Content.update({
        id: event.args.contentId,
        data: {
            name: event.args.name,
            contentTypes: event.args.contentTypes,
            lastUpdateTimestamp: event.block.timestamp,
        },
    });
});

ponder.on("ContentRegistry:Transfer", async ({ event, context }) => {
    const { ContentAdministrator } = context.db;

    // Delete the previous administrator
    if (!isAddressEqual(event.args.from, zeroAddress)) {
        await ContentAdministrator.delete({
            id: `${toHex(event.args.id)}-${event.args.from}`,
        });
    }

    // Create the new administrator
    await ContentAdministrator.create({
        id: `${toHex(event.args.id)}-${event.args.to}`,
        data: {
            isOwner: true,
            contentId: event.args.id,
            user: event.args.to,
            createdTimestamp: event.block.timestamp,
        },
    });
});

// todo: manage approval
