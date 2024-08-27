import { type ApiContext, ponder } from "@/generated";
import { eq, inArray } from "@ponder/core";
import { type Address, isAddress } from "viem";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): string {
    return this.toString();
};

/**
 * Get a tokens information by its address
 */
ponder.get("/tokens/:address", async (ctx) => {
    // Extract token address
    const address = ctx.req.param("address") as Address;
    if (!isAddress(address)) {
        return ctx.text("Invalid token address address", 400);
    }

    // Get the tables we will query
    const { Token } = ctx.tables;

    // Perform the sql query
    const rewards = await ctx.db
        .select({
            address: Token.id,
            name: Token.name,
            symbol: Token.symbol,
            decimals: Token.decimals,
        })
        .from(Token)
        .where(eq(Token.id, address));

    // Return the result as json
    return ctx.json(rewards);
});

/**
 * Get all the tokens information
 */
export async function getTokens({
    addresses,
    ctx,
}: { addresses: readonly Address[]; ctx: ApiContext }) {
    // Convert the addresses to a set
    const addressSet = new Set(addresses);

    // Find all the tokens
    const { Token } = ctx.tables;
    return await ctx.db
        .select({
            address: Token.id,
            name: Token.name,
            symbol: Token.symbol,
            decimals: Token.decimals,
        })
        .from(Token)
        .where(inArray(Token.id, [...addressSet]));
}
