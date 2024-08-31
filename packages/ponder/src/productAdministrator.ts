import { type Context, ponder } from "@/generated";
import {
    type Address,
    type Hex,
    isAddressEqual,
    keccak256,
    toHex,
    zeroAddress,
} from "viem";

/*
 * Handle transfer stuff
 */
ponder.on("ProductRegistry:Transfer", async ({ event, context }) => {
    const { ProductAdministrator } = context.db;

    // Delete the previous administrator
    if (!isAddressEqual(event.args.from, zeroAddress)) {
        await ProductAdministrator.delete({
            id: productAdministratorId(event.args.id, event.args.from),
        });
    }

    const productId = event.args.id;

    // Remove the previous administrator
    if (!isAddressEqual(event.args.from, zeroAddress)) {
        ProductAdministrator.upsert({
            id: productAdministratorId(event.args.id, event.args.from),
            create: {
                isOwner: false,
                productId,
                roles: 0n,
                user: event.args.from,
                createdTimestamp: event.block.timestamp,
            },
            update: {
                isOwner: false,
            },
        });
    }

    // Create the new administrator
    if (!isAddressEqual(event.args.to, zeroAddress)) {
        ProductAdministrator.upsert({
            id: productAdministratorId(event.args.id, event.args.to),
            create: {
                isOwner: true,
                productId,
                roles: 0n,
                user: event.args.to,
                createdTimestamp: event.block.timestamp,
            },
            update: {
                isOwner: true,
            },
        });
    }

    // Cleanup the administrators
    await administratorCleanup(context);
});

ponder.on(
    "ProductAdministratorRegistry:ProductRolesUpdated",
    async ({ event, context }) => {
        const { ProductAdministrator } = context.db;

        ProductAdministrator.upsert({
            id: productAdministratorId(event.args.product, event.args.user),
            create: {
                isOwner: false,
                productId: event.args.product,
                roles: event.args.roles,
                user: event.args.user,
                createdTimestamp: event.block.timestamp,
            },
            update: {
                roles: event.args.roles,
            },
        });

        // Cleanup the administrators
        await administratorCleanup(context);
    }
);

function productAdministratorId(productId: bigint, user: Address): Hex {
    return keccak256(`${toHex(productId)}-${user}`);
}

/**
 * Find every administrator where isOwner = false and roles = 0 and delete them
 */
async function administratorCleanup(context: Context) {
    const { ProductAdministrator } = context.db;

    // Get the administrators to delete
    const administrators = await ProductAdministrator.findMany({
        where: {
            isOwner: false,
            roles: 0n,
        },
    });

    // Delete them
    for (const admin of administrators.items) {
        await ProductAdministrator.delete({ id: admin.id });
    }
}
