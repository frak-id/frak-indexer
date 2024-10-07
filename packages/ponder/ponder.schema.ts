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

        metadataUrl: p.string().optional(),

        interactionContracts: p.many("ProductInteractionContract.productId"),

        campaigns: p.many("Campaign.productId"),
        administrators: p.many("ProductAdministrator.productId"),
        banks: p.many("BankingContract.productId"),
    }),

    // Product related stuff
    ProductAdministrator: p.createTable(
        {
            id: p.hex(),

            productId: p.bigint().references("Product.id"),
            product: p.one("productId"),

            isOwner: p.boolean(),
            roles: p.bigint(),
            user: p.hex(),

            createdTimestamp: p.bigint(),
        },
        {
            productIndex: p.index("productId"),
            userIndex: p.index("user"),
        }
    ),

    /* -------------------------------------------------------------------------- */
    /*                          Interaction related stuff                         */
    /* -------------------------------------------------------------------------- */

    ProductInteractionContract: p.createTable(
        {
            id: p.hex(), // address

            productId: p.bigint().references("Product.id"),
            product: p.one("productId"),

            referralTree: p.hex(),

            createdTimestamp: p.bigint(),
            lastUpdateTimestamp: p.bigint().optional(),
            removedTimestamp: p.bigint().optional(),
        },
        {
            productIndex: p.index("productId"),
        }
    ),

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
        // Purchase type
        "PURCHASE_STARTED",
        "PURCHASE_COMPLETED",
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

            interactionContractId: p
                .hex()
                .references("ProductInteractionContract.id"),
            interactionContract: p.one("interactionContractId"),

            attached: p.boolean(),

            attachTimestamp: p.bigint(),
            detachTimestamp: p.bigint().optional(),

            bankingContractId: p
                .hex()
                .references("BankingContract.id")
                .optional(),
            bankingContract: p.one("bankingContractId"),
            isAuthorisedOnBanking: p.boolean(),

            capResets: p.many("CampaignCapReset.campaignId"),
            stats: p.many("ReferralCampaignStats.campaignId"),
        },
        {
            productIndex: p.index("productId"),
            interactionContractIndex: p.index("interactionContractId"),
            bankingContractIndex: p.index("bankingContractId"),
        }
    ),
    ReferralCampaignStats: p.createTable(
        {
            id: p.hex(),

            campaignId: p.hex().references("Campaign.id"),
            campaign: p.one("campaignId"),

            totalInteractions: p.bigint(),

            // Press related interactions
            openInteractions: p.bigint(),
            readInteractions: p.bigint(),

            // Referral related interactions
            referredInteractions: p.bigint(),
            createReferredLinkInteractions: p.bigint(),

            // purchase related interactions
            purchaseStartedInteractions: p.bigint(),
            purchaseCompletedInteractions: p.bigint(),

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
    BankingContract: p.createTable(
        {
            // Address of the rewarding contract
            id: p.hex(),

            // Address of the token that will be distributed
            tokenId: p.hex().references("Token.id"),
            token: p.one("tokenId"),

            // Address of the product linked to this contract
            productId: p.bigint().references("Product.id"),
            product: p.one("productId"),

            // The total amount distributed and claimed
            totalDistributed: p.bigint(),
            totalClaimed: p.bigint(),

            // Is the bank still distributing?
            isDistributing: p.boolean(),

            // All the rewards
            rewards: p.many("Reward.contractId"),

            // All the attached cmapaigns
            campaigns: p.many("Campaign.bankingContractId"),
        },
        {
            tokenIndex: p.index("tokenId"),
            productIndex: p.index("productId"),
        }
    ),
    Reward: p.createTable(
        {
            id: p.string(), // reward contract + user

            contractId: p.hex().references("BankingContract.id"),
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

            // Emitter of the reward (campaign sending it)
            emitter: p.hex(),

            amount: p.bigint(),

            txHash: p.hex(),
            timestamp: p.bigint(),
        },
        {
            rewardIndex: p.index("rewardId"),
            emitterIndex: p.index("emitter"),
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
