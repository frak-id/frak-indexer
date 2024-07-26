import { ponder } from "@/generated";
import { contentInteractionDiamondAbi } from "../abis/frak-interaction-abis";

ponder.on(
    "ContentInteractionManager:InteractionContractDeployed",
    async ({ event, context }) => {
        const { ContentInteractionContract } = context.db;

        // Get the referral tree of this interaction contract
        const referralTree = await context.client.readContract({
            abi: contentInteractionDiamondAbi,
            address: event.args.interactionContract,
            functionName: "getReferralTree",
        });

        // Create the interaction contract
        await ContentInteractionContract.create({
            id: event.args.interactionContract,
            data: {
                contentId: event.args.contentId,
                createdTimestamp: event.block.timestamp,
                referralTree,
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
