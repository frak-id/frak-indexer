import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
    /* -------------------------------------------------------------------------- */
    /*                            Product related stuff                           */
    /* -------------------------------------------------------------------------- */

    Product: p.createTable({
        id: p.bigint(),

        domain: p.string(),
        productTypes: p.bigint(),
        name: p.string(),

        createTimestamp: p.bigint(),
        lastUpdateTimestamp: p.bigint().optional(),

        interactionContracts: p.many("ProductInteractionContract.productId"),

        campaigns: p.many("Campaign.productId"),
        administrators: p.many("ProductAdministrator.productId"),
    }),

    // Product related stuff
    ProductAdministrator: p.createTable({
        id: p.hex(),

        productId: p.bigint().references("Product.id"),
        product: p.one("productId"),

        isOwner: p.boolean(),
        roles: p.bigint(),
        user: p.hex(),

        createdTimestamp: p.bigint(),
    }),

    /* -------------------------------------------------------------------------- */
    /*                          Interaction related stuff                         */
    /* -------------------------------------------------------------------------- */

    ProductInteractionContract: p.createTable({
        id: p.hex(), // address

        productId: p.bigint().references("Product.id"),
        product: p.one("productId"),

        referralTree: p.hex(),

        createdTimestamp: p.bigint(),
        lastUpdateTimestamp: p.bigint().optional(),
        removedTimestamp: p.bigint().optional(),
    }),

    InteractionEvent: p.createTable(
        {
            id: p.string(),

            interactionId: p.hex().references("ProductInteractionContract.id"),
            interaction: p.one("interactionId"),

            user: p.hex(),
            type: p.enum("InteractionEventType"),
            data: p.json().optional(),

            timestamp: p.bigint(),
        },
        {
            interactionIndex: p.index("interactionId"),
            userIndex: p.index("user"),

            userInteractionIndex: p.index(["user", "interactionId"]),
        }
    ),

    InteractionEventType: p.createEnum([
        // Referral type
        "REFERRED",
        "CREATE_REFERRAL_LINK",
        // Press type
        "OPEN_ARTICLE",
        "READ_ARTICLE",
    ]),

    /* -------------------------------------------------------------------------- */
    /*                           Campaign related stuff                           */
    /* -------------------------------------------------------------------------- */

    Campaign: p.createTable(
        {
            id: p.hex(),

            name: p.string(),
            version: p.string(),

            productId: p.bigint().references("Product.id"),
            product: p.one("productId"),

            attached: p.boolean(),

            attachTimestamp: p.bigint(),
            detachTimestamp: p.bigint().optional(),

            capResets: p.many("CampaignCapReset.campaignId"),
            stats: p.many("PressCampaignStats.campaignId"),
        },
        {
            productIndex: p.index("productId"),
        }
    ),
    PressCampaignStats: p.createTable(
        {
            id: p.hex(),

            campaignId: p.hex().references("Campaign.id"),
            campaign: p.one("campaignId"),

            totalInteractions: p.bigint(),
            openInteractions: p.bigint(),
            readInteractions: p.bigint(),
            referredInteractions: p.bigint(),
            createReferredLinkInteractions: p.bigint(),

            totalRewards: p.bigint(),
        },
        {
            campaignIndex: p.index("campaignId"),
        }
    ),
    CampaignCapReset: p.createTable(
        {
            id: p.string(), // campaign address + timestamp

            campaignId: p.hex().references("Campaign.id"),
            campaign: p.one("campaignId"),

            timestamp: p.bigint(),
            previousTimestamp: p.bigint(),
            distributedAmount: p.bigint(),
        },
        {
            campaignIndex: p.index("campaignId"),
        }
    ),

    /* -------------------------------------------------------------------------- */
    /*                            Rewards related stuff                           */
    /* -------------------------------------------------------------------------- */
    Token: p.createTable({
        // Address of the token contract
        id: p.hex(),

        // Token information
        decimals: p.int(),
        name: p.string(),
        symbol: p.string(),
    }),
    RewardingContract: p.createTable(
        {
            // Address of the rewarding contract
            id: p.hex(),

            // Address of the token that will be distributed
            tokenId: p.hex().references("Token.id"),
            token: p.one("tokenId"),

            // The total amount distributed and claimed
            totalDistributed: p.bigint(),
            totalClaimed: p.bigint(),

            // All the rewards
            rewards: p.many("Reward.contractId"),
        },
        {
            tokenIndex: p.index("tokenId"),
        }
    ),
    Reward: p.createTable(
        {
            id: p.string(), // reward contract + user

            contractId: p.hex().references("RewardingContract.id"),
            contract: p.one("contractId"),

            user: p.hex(),

            pendingAmount: p.bigint(),
            totalReceived: p.bigint(),
            totalClaimed: p.bigint(),

            rewardAddedEvents: p.many("RewardAddedEvent.rewardId"),
            rewardClaimedEvents: p.many("RewardClaimedEvent.rewardId"),
        },
        {
            userIndex: p.index("user"),
            contractIndex: p.index("contractId"),

            userContractIndex: p.index(["user", "contractId"]),
        }
    ),
    RewardAddedEvent: p.createTable(
        {
            id: p.string(),

            rewardId: p.string().references("Reward.id"),
            reward: p.one("rewardId"),

            amount: p.bigint(),

            txHash: p.hex(),
            timestamp: p.bigint(),
        },
        {
            rewardIndex: p.index("rewardId"),
        }
    ),
    RewardClaimedEvent: p.createTable(
        {
            id: p.string(),

            rewardId: p.string().references("Reward.id"),
            reward: p.one("rewardId"),

            amount: p.bigint(),

            txHash: p.hex(),
            timestamp: p.bigint(),
        },
        {
            rewardIndex: p.index("rewardId"),
        }
    ),
}));
