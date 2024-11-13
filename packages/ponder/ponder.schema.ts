import { index, onchainEnum, onchainTable } from "@ponder/core";

/* -------------------------------------------------------------------------- */
/*                            Product related stuff                           */
/* -------------------------------------------------------------------------- */

export const productTable = onchainTable("Product", (t) => ({
    id: t.bigint().primaryKey(),

    domain: t.varchar().notNull(),
    productTypes: t.bigint().notNull(),
    name: t.varchar().notNull(),

    createTimestamp: t.bigint().notNull(),
    lastUpdateTimestamp: t.bigint(),

    metadataUrl: t.varchar(),
}));

export const productAdministratorTable = onchainTable(
    "ProductAdministrator",
    (t) => ({
        id: t.hex().primaryKey(),

        productId: t
            .bigint()
            .notNull()
            .references(() => productTable.id),

        isOwner: t.boolean().notNull(),
        roles: t.bigint().notNull(),
        user: t.hex().notNull(),

        createdTimestamp: t.bigint().notNull(),
    }),
    (table) => ({
        productIdIdx: index().on(table.productId),
        userIdx: index().on(table.user),
    })
);

export const productInteractionContractTable = onchainTable(
    "ProductInteractionContract",
    (t) => ({
        id: t.hex().primaryKey(),

        productId: t
            .bigint()
            .notNull()
            .references(() => productTable.id),
        referralTree: t.hex().notNull(),

        createdTimestamp: t.bigint().notNull(),
        lastUpdateTimestamp: t.bigint(),
        removedTimestamp: t.bigint(),
    }),
    (table) => ({
        productIdIdx: index().on(table.productId),
    })
);

/* -------------------------------------------------------------------------- */
/*                          Interaction related stuff                         */
/* -------------------------------------------------------------------------- */

export const interactionEventTypeEnum = onchainEnum("InteractionEventType", [
    // Referral type
    "REFERRED",
    "CREATE_REFERRAL_LINK",
    // Press type
    "OPEN_ARTICLE",
    "READ_ARTICLE",
    // Purchase type
    "PURCHASE_STARTED",
    "PURCHASE_COMPLETED",
    // Webshop type
    "WEBSHOP_OPENNED",
]);

export const interactionEventTable = onchainTable(
    "InteractionEvent",
    (t) => ({
        id: t.varchar().primaryKey(),

        interactionId: t
            .hex()
            .notNull()
            .references(() => productInteractionContractTable.id),
        user: t.hex().notNull(),
        type: interactionEventTypeEnum().notNull(),
        data: t.json(),

        timestamp: t.bigint().notNull(),
    }),
    (table) => ({
        interactionIdx: index().on(table.interactionId),
        userIdx: index().on(table.user),
        userInteractionIdx: index().on(table.user, table.interactionId),
    })
);

/* -------------------------------------------------------------------------- */
/*                           Campaign related stuff                           */
/* -------------------------------------------------------------------------- */

export const campaignTable = onchainTable(
    "Campaign",
    (t) => ({
        id: t.hex().primaryKey(),

        type: t.varchar().notNull(),
        name: t.varchar().notNull(),
        version: t.varchar().notNull(),

        productId: t
            .bigint()
            .notNull()
            .references(() => productTable.id),
        interactionContractId: t
            .hex()
            .notNull()
            .references(() => productInteractionContractTable.id),
        attached: t.boolean().notNull(),

        attachTimestamp: t.bigint().notNull(),
        detachTimestamp: t.bigint(),

        bankingContractId: t.hex().references(() => bankingContractTable.id),
        isAuthorisedOnBanking: t.boolean().notNull(),
    }),
    (table) => ({
        productIdIdx: index().on(table.productId),
        interactionContractIdx: index().on(table.interactionContractId),
        bankingContractIdx: index().on(table.bankingContractId),
    })
);

export const referralCampaignStatsTable = onchainTable(
    "ReferralCampaignStats",
    (t) => ({
        id: t.hex().primaryKey(),

        campaignId: t
            .hex()
            .notNull()
            .references(() => campaignTable.id),

        totalInteractions: t.bigint().notNull(),

        openInteractions: t.bigint().notNull(),
        readInteractions: t.bigint().notNull(),

        referredInteractions: t.bigint().notNull(),
        createReferredLinkInteractions: t.bigint().notNull(),

        purchaseStartedInteractions: t.bigint().notNull(),
        purchaseCompletedInteractions: t.bigint().notNull(),

        webshopOpenned: t.bigint().notNull(),

        totalRewards: t.bigint().notNull(),
    }),
    (table) => ({
        campaignIdx: index().on(table.campaignId),
    })
);

export const campaignCapResetTable = onchainTable(
    "CampaignCapReset",
    (t) => ({
        id: t.varchar().primaryKey(),

        campaignId: t
            .hex()
            .notNull()
            .references(() => campaignTable.id),
        timestamp: t.bigint().notNull(),
        previousTimestamp: t.bigint().notNull(),
        distributedAmount: t.bigint().notNull(),
    }),
    (table) => ({
        campaignIdx: index().on(table.campaignId),
    })
);
/* -------------------------------------------------------------------------- */
/*                            Rewards related stuff                           */
/* -------------------------------------------------------------------------- */

export const tokenTable = onchainTable("Token", (t) => ({
    id: t.hex().primaryKey(),
    decimals: t.integer().notNull(),
    name: t.varchar().notNull(),
    symbol: t.varchar().notNull(),
}));
export const bankingContractTable = onchainTable(
    "BankingContract",
    (t) => ({
        id: t.hex().primaryKey(),
        tokenId: t
            .hex()
            .notNull()
            .references(() => tokenTable.id),
        productId: t
            .bigint()
            .notNull()
            .references(() => productTable.id),
        totalDistributed: t.bigint().notNull(),
        totalClaimed: t.bigint().notNull(),
        isDistributing: t.boolean().notNull(),
    }),
    (table) => ({
        tokenIdIdx: index().on(table.tokenId),
        productIdIdx: index().on(table.productId),
    })
);
export const rewardTable = onchainTable(
    "Reward",
    (t) => ({
        id: t.varchar().primaryKey(),
        contractId: t
            .hex()
            .notNull()
            .references(() => bankingContractTable.id),
        user: t.hex().notNull(),
        pendingAmount: t.bigint().notNull(),
        totalReceived: t.bigint().notNull(),
        totalClaimed: t.bigint().notNull(),
    }),
    (table) => ({
        userIdx: index().on(table.user),
        contractIdx: index().on(table.contractId),
        userContractIdx: index().on(table.user, table.contractId),
    })
);
export const rewardAddedEventTable = onchainTable(
    "RewardAddedEvent",
    (t) => ({
        id: t.varchar().primaryKey(),
        rewardId: t
            .varchar()
            .notNull()
            .references(() => rewardTable.id),
        emitter: t.hex().notNull(),
        amount: t.bigint().notNull(),
        txHash: t.hex().notNull(),
        timestamp: t.bigint().notNull(),
    }),
    (table) => ({
        rewardIdx: index().on(table.rewardId),
        emitterIdx: index().on(table.emitter),
    })
);
export const rewardClaimedEventTable = onchainTable(
    "RewardClaimedEvent",
    (t) => ({
        id: t.varchar().primaryKey(),
        rewardId: t
            .varchar()
            .notNull()
            .references(() => rewardTable.id),
        amount: t.bigint().notNull(),
        txHash: t.hex().notNull(),
        timestamp: t.bigint().notNull(),
    }),
    (table) => ({
        rewardIdx: index().on(table.rewardId),
    })
);
