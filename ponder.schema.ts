import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
    // Global account we are tracking
    Account: p.createTable({
        // Id the wallet address
        id: p.hex(),

        // The linked token Balance
        balances: p.many("TokenBalance.accountId"),

        // The linked transfer events
        transferFromEvents: p.many("TransferEvent.fromId"),
        transferToEvents: p.many("TransferEvent.toId"),

        // The linked webauthn validators
        validators: p.many("MultiWebAuthNValidator.accountId"),
    }),
    // Token we are tracking
    Token: p.createTable(
        {
            // Id the token address + chain id
            id: p.hex(),
            address: p.hex(),
            chain: p.int(),
        },
        {
            // Indexes
            chainIndex: p.index("chain"),
            // Address index
            addressIndex: p.index("address"),
        }
    ),
    // Token balance for each users
    TokenBalance: p.createTable(
        {
            // Id the token address + user address + chain id
            id: p.hex(),

            balance: p.bigint(),

            // The account this balance is linked to
            accountId: p.hex().references("Account.id"),
            account: p.one("accountId"),

            // The token this balance is linked to
            tokenId: p.hex().references("Token.id"),
            token: p.one("tokenId"),
        },
        {
            accountIndex: p.index("accountId"),
            tokenIndex: p.index("tokenId"),
        }
    ),
    // Validator we are tracking
    MultiWebAuthNValidator: p.createTable({
        // Id is a concatenation of chain + account address
        id: p.hex(),

        // The chain this validator is linked to
        chain: p.int(),

        // The account this validator is linked to
        accountId: p.hex().references("Account.id"),
        account: p.one("accountId"),

        // The primary passkey
        primaryPasskeyId: p.hex().references("Passkey.id"),
        primaryPasskey: p.one("primaryPasskeyId"),
    }),
    // The passkey we are tracking
    Passkey: p.createTable({
        // Authenticator id hash
        id: p.hex(),
        pubKeyX: p.bigint(),
        pubKeyY: p.bigint(),

        // Change events
        changeLogEvents: p.many("PasskeyChangeLogEvent.passkeyId"),
    }),

    // Erc20 Transfer events
    TransferEvent: p.createTable(
        {
            id: p.string(),
            amount: p.bigint(),

            tokenId: p.hex().references("Token.id"),
            token: p.one("tokenId"),

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
            // Search indexes
            tokenIndex: p.index("tokenId"),
        }
    ),
    // WebAuthN Validator related events
    PrimaryPasskeyChangedEvent: p.createTable({
        id: p.string(),

        validatorId: p.hex().references("MultiWebAuthNValidator.id"),
        validator: p.one("validatorId"),

        timestamp: p.int(),
        chain: p.int(),
    }),
    PasskeyChangeLogEvent: p.createTable({
        id: p.string(),

        passkeyId: p.hex().references("Passkey.id"),
        passkey: p.one("passkeyId"),
        isAdded: p.boolean(),

        timestamp: p.int(),
        chain: p.int(),
    }),
}));
