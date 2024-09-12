import { type ApiContext, ponder } from "@/generated";
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
import type { SQL } from "drizzle-orm";
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

    const { whereClauses, havingClauses } = getFilterClauses({
        tables: ctx.tables,
        filter,
    });

    // Append a clause to filter only the products for this admin
    whereClauses.push(
        inArray(
            ProductInteractionContract.productId,
            productIds.map((p) => p.id)
        )
    );
    console.log("Clauses", { whereClauses, havingClauses });

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

/**
 * Get all the filter clauses
 */
function getFilterClauses({
    tables,
    filter,
}: { tables: ApiContext["tables"]; filter: GetMembersParams["filter"] }) {
    // Get all the product ids for this admin
    const { InteractionEvent, ProductInteractionContract, Reward } = tables;

    // Build our where and having clauses depending on the filters
    const whereClauses = [];
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
        const clause = buildRangeClause({
            field: count(InteractionEvent.id),
            ...filter.interactions,
        });
        if (clause) {
            havingClauses.push(clause);
        }
    }
    if (filter?.rewards) {
        const clause = buildRangeClause({
            field: sum(Reward.totalReceived),
            ...filter.rewards,
        });
        if (clause) {
            havingClauses.push(clause);
        }
    }
    if (filter?.firstInteractionTimestamp) {
        const clause = buildRangeClause({
            field: min(InteractionEvent.timestamp),
            ...filter.firstInteractionTimestamp,
        });
        if (clause) {
            havingClauses.push(clause);
        }
    }

    return { whereClauses, havingClauses };
}

function buildRangeClause({
    field,
    min,
    max,
}: {
    field: SQL<bigint | string | number | null>;
    min?: number;
    max?: number;
}) {
    if (min && max) {
        return between(field, min, max);
    }
    if (min) {
        return gte(field, min);
    }
    if (max) {
        return lte(field, max);
    }

    return undefined;
}
