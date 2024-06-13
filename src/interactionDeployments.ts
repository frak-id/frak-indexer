import { ponder } from "@/generated";

ponder.on(
    "ContentInteractionManager:InteractionContractDeployed",
    async ({ event, context }) => {
        const { ContentInteractionContract } = context.db;

        await ContentInteractionContract.create({
            id: event.args.interactionContract,
            data: {
                contentId: event.args.contentId,
                createdTimestamp: event.block.timestamp,
            },
        });
    }
);
ponder.on(
    "ContentInteractionManager:InteractionContractUpdated",
    async ({ event, context }) => {
        const { ContentInteractionContract } = context.db;

        await ContentInteractionContract.update({
            id: event.args.interactionContract,
            data: {
                contentId: event.args.contentId,
                lastUpdateTimestamp: event.block.timestamp,
            },
        });
    }
);
ponder.on(
    "ContentInteractionManager:InteractionContractDeleted",
    async ({ event, context }) => {
        const { ContentInteractionContract } = context.db;

        await ContentInteractionContract.delete({
            id: event.args.interactionContract,
        });
    }
);
