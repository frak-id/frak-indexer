import { ponder } from "@/generated";
import { productInteractionDiamondAbi } from "../abis/interactionAbis";
import { productInteractionContractTable } from "../ponder.schema";

ponder.on(
    "ProductInteractionManager:InteractionContractDeployed",
    async ({ event, context: { client, db } }) => {
        // Get the referral tree of this interaction contract
        const referralTree = await client.readContract({
            abi: productInteractionDiamondAbi,
            address: event.args.interactionContract,
            functionName: "getReferralTree",
            blockNumber: event.block.number,
        });

        // Create the interaction contract
        await db.insert(productInteractionContractTable).values({
            id: event.args.interactionContract,
            productId: event.args.productId,
            createdTimestamp: event.block.timestamp,
            referralTree,
        });
    }
);
ponder.on(
    "ProductInteractionManager:InteractionContractUpdated",
    async ({ event, context: { db } }) => {
        await db
            .update(productInteractionContractTable, {
                id: event.args.interactionContract,
            })
            .set({
                productId: event.args.productId,
                lastUpdateTimestamp: event.block.timestamp,
            });
    }
);
ponder.on(
    "ProductInteractionManager:InteractionContractDeleted",
    async ({ event, context: { db } }) => {
        await db.delete(productInteractionContractTable, {
            id: event.args.interactionContract,
        });
    }
);
