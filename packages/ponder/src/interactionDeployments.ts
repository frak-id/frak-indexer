import { ponder } from "@/generated";
import { productInteractionDiamondAbi } from "../abis/frak-interaction-abis";

ponder.on(
    "ProductInteractionManager:InteractionContractDeployed",
    async ({ event, context }) => {
        const { ProductInteractionContract } = context.db;

        // Get the referral tree of this interaction contract
        const referralTree = await context.client.readContract({
            abi: productInteractionDiamondAbi,
            address: event.args.interactionContract,
            functionName: "getReferralTree",
        });

        // Create the interaction contract
        await ProductInteractionContract.create({
            id: event.args.interactionContract,
            data: {
                productId: event.args.productId,
                createdTimestamp: event.block.timestamp,
                referralTree,
            },
        });
    }
);
ponder.on(
    "ProductInteractionManager:InteractionContractUpdated",
    async ({ event, context }) => {
        const { ProductInteractionContract } = context.db;

        await ProductInteractionContract.update({
            id: event.args.interactionContract,
            data: {
                productId: event.args.productId,
                lastUpdateTimestamp: event.block.timestamp,
            },
        });
    }
);
ponder.on(
    "ProductInteractionManager:InteractionContractDeleted",
    async ({ event, context }) => {
        const { ProductInteractionContract } = context.db;

        await ProductInteractionContract.delete({
            id: event.args.interactionContract,
        });
    }
);
