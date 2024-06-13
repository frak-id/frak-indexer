import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
    // Global account we are tracking
    Account: p.createTable({
        // Id the wallet address
        id: p.hex(),

        // The linked webauthn validators
        validators: p.many("MultiWebAuthNValidator.accountId"),
    }),
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

    // Content related stuff
    Content: p.createTable({
        id: p.bigint(),

        domain: p.string(),
        contentTypes: p.bigint(),
        name: p.string(),

        createTimestamp: p.bigint(),
        lastUpdateTimestamp: p.bigint().optional(),

        interactionContracts: p.many("ContentInteractionContract.contentId"),

        campaignsLink: p.many("CampaignToContent.contentId"),
        administrators: p.many("ContentAdministrator.contentId"),
    }),

    // Content related stuff
    ContentAdministrator: p.createTable({
        id: p.hex(),

        contentId: p.bigint().references("Content.id"),
        content: p.one("contentId"),

        isOwner: p.boolean(),
        user: p.hex(),

        createdTimestamp: p.bigint(),
    }),

    // Interaction related
    ContentInteractionContract: p.createTable({
        id: p.hex(), // address

        contentId: p.bigint().references("Content.id"),
        content: p.one("contentId"),

        createdTimestamp: p.bigint(),
        lastUpdateTimestamp: p.bigint().optional(),
        removedTimestamp: p.bigint().optional(),
    }),

    // Campaign related
    Campaign: p.createTable({
        id: p.hex(),

        name: p.string(),
        version: p.string(),

        attachments: p.many("CampaignToContent.campaignId"),
    }),
    CampaignToContent: p.createTable({
        id: p.string(), // address

        campaignId: p.hex().references("Campaign.id"),
        campaign: p.one("campaignId"),

        contentId: p.bigint().references("Content.id"),
        content: p.one("contentId"),

        attached: p.boolean(),

        attachTimestamp: p.bigint(),
        detachTimestamp: p.bigint().optional(),
    }),

    // Press events
    PressEvent: p.createTable({
        id: p.string(),

        interactionId: p.hex().references("ContentInteractionContract.id"),
        interaction: p.one("interactionId"),

        user: p.hex(),
        type: p.enum("PressEventType"),
        data: p.json(),

        timestamp: p.bigint(),
    }),

    PressEventType: p.createEnum(["OPEN_ARTICLE", "READ_ARTICLE", "REFERRED"]),
}));
