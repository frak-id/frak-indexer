import { ponder } from "@/generated";
import {
    type Address,
    type Hex,
    isAddressEqual,
    keccak256,
    toHex,
    zeroAddress,
} from "viem";

/*
 * todo:
 *      - Manage erc721 approval for a content
 *      - An approval is equivalent to an admin
 */
ponder.on("ContentRegistry:Transfer", async ({ event, context }) => {
    const { ContentAdministrator } = context.db;

    // Delete the previous administrator
    if (!isAddressEqual(event.args.from, zeroAddress)) {
        await ContentAdministrator.delete({
            id: contentAdministratorId(event.args.id, event.args.from),
        });
    }

    // Create the new administrator
    await ContentAdministrator.create({
        id: contentAdministratorId(event.args.id, event.args.to),
        data: {
            isOwner: true,
            contentId: event.args.id,
            user: event.args.to,
            createdTimestamp: event.block.timestamp,
        },
    });
});

ponder.on(
    "ContentInteractionManager:ContentOperatorAdded",
    async ({ event, context }) => {
        const { ContentAdministrator } = context.db;

        await ContentAdministrator.create({
            id: contentAdministratorId(
                event.args.contentId,
                event.args.operator
            ),
            data: {
                isOwner: false,
                contentId: event.args.contentId,
                user: event.args.operator,
                createdTimestamp: event.block.timestamp,
            },
        });
    }
);

ponder.on(
    "ContentInteractionManager:ContentOperatorRemoved",
    async ({ event, context }) => {
        const { ContentAdministrator } = context.db;

        await ContentAdministrator.delete({
            id: contentAdministratorId(
                event.args.contentId,
                event.args.operator
            ),
        });
    }
);

function contentAdministratorId(contentId: bigint, user: Address): Hex {
    return keccak256(`${toHex(contentId)}-${user}`);
}
