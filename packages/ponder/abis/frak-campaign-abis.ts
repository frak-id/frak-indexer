//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CampaignFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const campaignFactoryAbi = [
    {
        type: "constructor",
        inputs: [
            {
                name: "_referralRegistry",
                internalType: "contract ReferralRegistry",
                type: "address",
            },
            {
                name: "_productAdministratorRegistry",
                internalType: "contract ProductAdministratorRegistry",
                type: "address",
            },
            {
                name: "_frakCampaignWallet",
                internalType: "address",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [
            {
                name: "_interaction",
                internalType: "contract ProductInteractionDiamond",
                type: "address",
            },
            { name: "_identifier", internalType: "bytes4", type: "bytes4" },
            { name: "_initData", internalType: "bytes", type: "bytes" },
        ],
        name: "createCampaign",
        outputs: [{ name: "", internalType: "address", type: "address" }],
        stateMutability: "nonpayable",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "campaign",
                internalType: "address",
                type: "address",
                indexed: false,
            },
        ],
        name: "CampaignCreated",
    },
    {
        type: "error",
        inputs: [
            { name: "identifier", internalType: "bytes4", type: "bytes4" },
        ],
        name: "UnknownCampaignType",
    },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// InteractionCampaign
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const interactionCampaignAbi = [
    {
        type: "function",
        inputs: [],
        name: "getMetadata",
        outputs: [
            { name: "_type", internalType: "string", type: "string" },
            { name: "version", internalType: "string", type: "string" },
        ],
        stateMutability: "pure",
    },
    {
        type: "function",
        inputs: [{ name: "_data", internalType: "bytes", type: "bytes" }],
        name: "handleInteraction",
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [],
        name: "isActive",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [],
        name: "isRunning",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [{ name: "_isRunning", internalType: "bool", type: "bool" }],
        name: "setRunningStatus",
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [
            {
                name: "_productType",
                internalType: "ProductTypes",
                type: "uint256",
            },
        ],
        name: "supportProductType",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    { type: "error", inputs: [], name: "InactiveCampaign" },
    { type: "error", inputs: [], name: "Reentrancy" },
    { type: "error", inputs: [], name: "Unauthorized" },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ReferralCampaign
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const referralCampaignAbi = [
    {
        type: "constructor",
        inputs: [
            {
                name: "_config",
                internalType: "struct ReferralCampaign.CampaignConfig",
                type: "tuple",
                components: [
                    { name: "token", internalType: "address", type: "address" },
                    {
                        name: "initialReward",
                        internalType: "uint256",
                        type: "uint256",
                    },
                    {
                        name: "userRewardPercent",
                        internalType: "uint256",
                        type: "uint256",
                    },
                    {
                        name: "distributionCapPeriod",
                        internalType: "uint256",
                        type: "uint256",
                    },
                    {
                        name: "distributionCap",
                        internalType: "uint256",
                        type: "uint256",
                    },
                    {
                        name: "startDate",
                        internalType: "uint48",
                        type: "uint48",
                    },
                    { name: "endDate", internalType: "uint48", type: "uint48" },
                    { name: "name", internalType: "bytes32", type: "bytes32" },
                ],
            },
            {
                name: "_referralRegistry",
                internalType: "contract ReferralRegistry",
                type: "address",
            },
            {
                name: "_productAdministratorRegistry",
                internalType: "contract ProductAdministratorRegistry",
                type: "address",
            },
            {
                name: "_frakCampaignWallet",
                internalType: "address",
                type: "address",
            },
            {
                name: "_interaction",
                internalType: "contract ProductInteractionDiamond",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [
            { name: "_user", internalType: "address", type: "address" },
            {
                name: "_initialAmount",
                internalType: "uint256",
                type: "uint256",
            },
        ],
        name: "distributeTokenToUserReferrers",
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [],
        name: "getConfig",
        outputs: [
            {
                name: "",
                internalType: "struct ReferralCampaign.CampaignConfig",
                type: "tuple",
                components: [
                    { name: "token", internalType: "address", type: "address" },
                    {
                        name: "initialReward",
                        internalType: "uint256",
                        type: "uint256",
                    },
                    {
                        name: "userRewardPercent",
                        internalType: "uint256",
                        type: "uint256",
                    },
                    {
                        name: "distributionCapPeriod",
                        internalType: "uint256",
                        type: "uint256",
                    },
                    {
                        name: "distributionCap",
                        internalType: "uint256",
                        type: "uint256",
                    },
                    {
                        name: "startDate",
                        internalType: "uint48",
                        type: "uint48",
                    },
                    { name: "endDate", internalType: "uint48", type: "uint48" },
                    { name: "name", internalType: "bytes32", type: "bytes32" },
                ],
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [],
        name: "getMetadata",
        outputs: [
            { name: "_type", internalType: "string", type: "string" },
            { name: "version", internalType: "string", type: "string" },
        ],
        stateMutability: "pure",
    },
    {
        type: "function",
        inputs: [{ name: "_user", internalType: "address", type: "address" }],
        name: "getPendingAmount",
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [],
        name: "getTotalPending",
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [{ name: "_data", internalType: "bytes", type: "bytes" }],
        name: "handleInteraction",
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [],
        name: "isActive",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [],
        name: "isRunning",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [{ name: "_user", internalType: "address", type: "address" }],
        name: "pullReward",
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [
            { name: "_startDate", internalType: "uint48", type: "uint48" },
            { name: "_endDate", internalType: "uint48", type: "uint48" },
        ],
        name: "setActivationDate",
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [{ name: "_isRunning", internalType: "bool", type: "bool" }],
        name: "setRunningStatus",
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [
            {
                name: "_productType",
                internalType: "ProductTypes",
                type: "uint256",
            },
        ],
        name: "supportProductType",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "pure",
    },
    {
        type: "function",
        inputs: [],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "previousTimestamp",
                internalType: "uint48",
                type: "uint48",
                indexed: false,
            },
            {
                name: "distributedAmount",
                internalType: "uint256",
                type: "uint256",
                indexed: false,
            },
        ],
        name: "DistributionCapReset",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "user",
                internalType: "address",
                type: "address",
                indexed: true,
            },
            {
                name: "amount",
                internalType: "uint256",
                type: "uint256",
                indexed: false,
            },
        ],
        name: "RewardAdded",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "user",
                internalType: "address",
                type: "address",
                indexed: true,
            },
            {
                name: "amount",
                internalType: "uint256",
                type: "uint256",
                indexed: false,
            },
        ],
        name: "RewardClaimed",
    },
    { type: "error", inputs: [], name: "DistributionCapReached" },
    { type: "error", inputs: [], name: "InactiveCampaign" },
    { type: "error", inputs: [], name: "InvalidConfig" },
    { type: "error", inputs: [], name: "NotEnoughToken" },
    { type: "error", inputs: [], name: "Reentrancy" },
    { type: "error", inputs: [], name: "Unauthorized" },
] as const;
