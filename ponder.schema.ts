import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
    Account: p.createTable({
        // Id the wallet address
        id: p.hex(),
        balance: p.bigint(),

        transferFromEvents: p.many("TransferEvent.fromId"),
        transferToEvents: p.many("TransferEvent.toId"),
    }),
    TransferEvent: p.createTable(
        {
            id: p.string(),
            chain: p.int(),
            amount: p.bigint(),
            timestamp: p.int(),

            fromId: p.hex().references("Account.id"),
            toId: p.hex().references("Account.id"),

            from: p.one("fromId"),
            to: p.one("toId"),
        },
        {
            // From and to indexes
            fromIndex: p.index("fromId"),
            toIndex: p.index("toId"),
            // Chain index
            chainIndex: p.index("chain"),
        }
    ),
}));
