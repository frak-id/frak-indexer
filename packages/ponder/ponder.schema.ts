import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
    // Content related stuff
    Content: p.createTable({
        id: p.bigint(),

        domain: p.string(),
        contentTypes: p.bigint(),
        name: p.string(),

        createTimestamp: p.bigint(),
        lastUpdateTimestamp: p.bigint().optional(),

        interactionContracts: p.many("ContentInteractionContract.contentId"),

        campaigns: p.many("Campaign.contentId"),
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
    Campaign: p.createTable(
        {
            id: p.hex(),

            name: p.string(),
            version: p.string(),

            contentId: p.bigint().references("Content.id"),
            content: p.one("contentId"),

            attached: p.boolean(),

            attachTimestamp: p.bigint(),
            detachTimestamp: p.bigint().optional(),

            capResets: p.many("CampaignCapReset.campaignId"),
            stats: p.many("PressCampaignStats.campaignId"),
        },
        {
            contentIndex: p.index("contentId"),
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

    // Interaction events
    InteractionEvent: p.createTable(
        {
            id: p.string(),

            interactionId: p.hex().references("ContentInteractionContract.id"),
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

    // Rewards related stuff
    RewardingContract: p.createTable(
        {
            // Address of the rewarding contract
            id: p.hex(),

            // Address of the token that will be distributed
            token: p.hex(),

            // The total amount distributed and claimed
            totalDistributed: p.bigint(),
            totalClaimed: p.bigint(),

            // All the rewards
            rewards: p.many("Reward.contractId"),
        },
        {
            tokenIndex: p.index("token"),
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
