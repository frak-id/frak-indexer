import { ponder } from "@/generated";
import { eq } from "@ponder/core";
import { type Hex, isHex } from "viem";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): string {
    return this.toString();
};

/**
 * Get all the content administrators
 */
ponder.get("/contents/:id/administrators", async (ctx) => {
    // Extract the id
    const id = ctx.req.param("id") as Hex;
    if (!isHex(id)) {
        return ctx.text("Invalid content id", 400);
    }

    // Get the tables we will query
    const { Content, ContentAdministrator } = ctx.tables;

    // Perform the sql query
    const administrators = await ctx.db
        .select({
            wallet: ContentAdministrator.user,
            isContentOwner: ContentAdministrator.isOwner,
            addedTimestamp: ContentAdministrator.createdTimestamp,
        })
        .from(ContentAdministrator)
        .innerJoin(Content, eq(ContentAdministrator.contentId, Content.id))
        .where(eq(Content.id, BigInt(id)));

    // Return the result as json
    return ctx.json(administrators);
});
