import { ponder } from "@/generated";
import {
    and,
    asc,
    between,
    count,
    desc,
    eq,
    gte,
    inArray,
    lte,
    min,
    sql,
    sum,
} from "@ponder/core";
import { type Address, isAddress } from "viem";

/**
 * Params for the members fetching
 */
type GetMembersParams = {
    // Indicating if we only want the total count
    noData?: boolean;
    // Some filters to apply to the query
    filter?: {
        productIds?: string[];
        interactions?: {
            min?: number;
            max?: number;
        };
        rewards?: {
            min?: number;
            max?: number;
        };
        firstInteractionTimestamp?: {
            min?: number;
            max?: number;
        };
    };
    // Some sorting options to apply
    sort?: {
        by:
            | "user"
            | "totalInteractions"
            | "rewards"
            | "firstInteractionTimestamp";
        order: "asc" | "desc";
    };
    // Pagination options
    limit?: number;
    offset?: number;
};

/**
 * Get all the members for a product admin
 */
ponder.post("/members/:productAdmin", async (ctx) => {
    // Extract wallet
    const wallet = ctx.req.param("productAdmin") as Address;
    if (!isAddress(wallet)) {
        return ctx.text("Invalid productAdmin address", 400);
    }

    // Get the request params
    const { filter, sort, limit, offset, noData } =
        await ctx.req.json<GetMembersParams>();

    // Get all the product ids for this admin
    const {
        Product,
        ProductAdministrator,
        InteractionEvent,
        ProductInteractionContract,
        Reward,
    } = ctx.tables;

    // Perform the sql query
    const productIds = await ctx.db
        .select({
            id: ProductAdministrator.productId,
            name: Product.name,
        })
        .from(ProductAdministrator)
        .innerJoin(Product, eq(ProductAdministrator.productId, Product.id))
        .where(eq(ProductAdministrator.user, wallet));

    // Build our where and having clauses depending on the filters
    const whereClauses = [
        inArray(
            ProductInteractionContract.productId,
            productIds.map((p) => p.id)
        ),
    ];
    const havingClauses = [];

    if (filter?.productIds) {
        whereClauses.push(
            inArray(
                ProductInteractionContract.productId,
                filter.productIds.map((p) => BigInt(p))
            )
        );
    }
    if (filter?.interactions) {
        const { min, max } = filter.interactions;
        if (min && max) {
            havingClauses.push(between(count(InteractionEvent.id), min, max));
        } else if (min) {
            havingClauses.push(gte(count(InteractionEvent.id), min));
        } else if (max) {
            havingClauses.push(lte(count(InteractionEvent.id), max));
        }
    }
    if (filter?.rewards) {
        const { min, max } = filter.rewards;
        if (min && max) {
            havingClauses.push(between(sum(Reward.totalReceived), min, max));
        } else if (min) {
            havingClauses.push(gte(sum(Reward.totalReceived), min));
        } else if (max) {
            havingClauses.push(lte(sum(Reward.totalReceived), max));
        }
    }
    if (filter?.firstInteractionTimestamp) {
        const { min: interactionMin, max } = filter.firstInteractionTimestamp;
        if (interactionMin && max) {
            havingClauses.push(
                between(
                    min(InteractionEvent.timestamp),
                    BigInt(interactionMin),
                    BigInt(max)
                )
            );
        } else if (interactionMin) {
            havingClauses.push(
                gte(min(InteractionEvent.timestamp), BigInt(interactionMin))
            );
        } else if (max) {
            havingClauses.push(
                lte(min(InteractionEvent.timestamp), BigInt(max))
            );
        }
    }

    // Then get all the members for the given products id, we want the total interactions for each users who have interacted with the product
    // Relation is as follow: InteractionEvent (user, interactionId) -> ProductInteractionContract (productId)
    // We want to get the total interactions for each user
    const membersQuery = ctx.db
        .select({
            user: InteractionEvent.user,
            totalInteractions: count(InteractionEvent.id),
            rewards: sum(Reward.totalReceived),
            productIds: sql<
                string[]
            >`array_agg(distinct ${ProductInteractionContract.productId}::text)`,
            // First interaction event timestamp
            firstInteractionTimestamp: min(InteractionEvent.timestamp),
        })
        .from(InteractionEvent)
        .innerJoin(
            ProductInteractionContract,
            eq(InteractionEvent.interactionId, ProductInteractionContract.id)
        )
        .innerJoin(Reward, eq(Reward.user, InteractionEvent.user))
        .where(
            whereClauses.length === 1 ? whereClauses[0] : and(...whereClauses)
        )
        .having(
            havingClauses.length === 0
                ? undefined
                : havingClauses.length === 1
                  ? havingClauses[0]
                  : and(...havingClauses)
        )
        .groupBy(InteractionEvent.user);

    // Get the total results count
    const membersSubQuery = membersQuery.as("members");
    const totalResult = await ctx.db
        .select({ count: count() })
        .from(membersSubQuery);

    // If we don't want the data, we can return the total count
    if (noData) {
        return ctx.json({ totalResult: totalResult?.[0]?.count });
    }

    // Apply the limit and offset
    if (limit) {
        membersQuery.limit(limit);
    }
    if (offset) {
        membersQuery.offset(offset);
    }

    // Apply the order
    if (sort) {
        const sortFieldMap = {
            user: InteractionEvent.user,
            totalInteractions: count(InteractionEvent.id),
            rewards: sum(Reward.totalReceived),
            firstInteractionTimestamp: min(InteractionEvent.timestamp),
        };
        const orderByField = sortFieldMap[sort.by as keyof typeof sortFieldMap];
        if (!orderByField) {
            return ctx.text("Invalid sort field", 400);
        }
        membersQuery.orderBy(
            sort.order === "asc" ? asc(orderByField) : desc(orderByField)
        );
    }
    const members = await membersQuery;

    // Add product names
    const membersWithPName = members.map((member) => {
        const productNames = productIds
            .filter((p) => member.productIds.includes(p.id.toString()))
            .map((p) => p.name);
        return { ...member, productNames };
    });

    return ctx.json({
        totalResult: totalResult?.[0]?.count,
        members: membersWithPName,
    });
});
