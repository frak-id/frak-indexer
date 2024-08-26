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
                internalType: "contract ContentInteractionDiamond",
                type: "address",
            },
            { name: "_owner", internalType: "address", type: "address" },
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
        name: "cancelOwnershipHandover",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [
            { name: "pendingOwner", internalType: "address", type: "address" },
        ],
        name: "completeOwnershipHandover",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [],
        name: "disallowMe",
        outputs: [],
        stateMutability: "nonpayable",
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
        inputs: [
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "grantRoles",
        outputs: [],
        stateMutability: "payable",
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
        inputs: [
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "hasAllRoles",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "hasAnyRole",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
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
        inputs: [],
        name: "owner",
        outputs: [{ name: "result", internalType: "address", type: "address" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "pendingOwner", internalType: "address", type: "address" },
        ],
        name: "ownershipHandoverExpiresAt",
        outputs: [{ name: "result", internalType: "uint256", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [{ name: "roles", internalType: "uint256", type: "uint256" }],
        name: "renounceRoles",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [],
        name: "requestOwnershipHandover",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "revokeRoles",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [{ name: "user", internalType: "address", type: "address" }],
        name: "rolesOf",
        outputs: [{ name: "roles", internalType: "uint256", type: "uint256" }],
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
                name: "_contentType",
                internalType: "ContentTypes",
                type: "uint256",
            },
        ],
        name: "supportContentType",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "newOwner", internalType: "address", type: "address" },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "pendingOwner",
                internalType: "address",
                type: "address",
                indexed: true,
            },
        ],
        name: "OwnershipHandoverCanceled",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "pendingOwner",
                internalType: "address",
                type: "address",
                indexed: true,
            },
        ],
        name: "OwnershipHandoverRequested",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "oldOwner",
                internalType: "address",
                type: "address",
                indexed: true,
            },
            {
                name: "newOwner",
                internalType: "address",
                type: "address",
                indexed: true,
            },
        ],
        name: "OwnershipTransferred",
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
                name: "roles",
                internalType: "uint256",
                type: "uint256",
                indexed: true,
            },
        ],
        name: "RolesUpdated",
    },
    { type: "error", inputs: [], name: "AlreadyInitialized" },
    { type: "error", inputs: [], name: "NewOwnerIsZeroAddress" },
    { type: "error", inputs: [], name: "NoHandoverRequest" },
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
            { name: "_owner", internalType: "address", type: "address" },
            {
                name: "_frakCampaignWallet",
                internalType: "address",
                type: "address",
            },
            {
                name: "_interaction",
                internalType: "contract ContentInteractionDiamond",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [],
        name: "cancelOwnershipHandover",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [
            { name: "pendingOwner", internalType: "address", type: "address" },
        ],
        name: "completeOwnershipHandover",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [],
        name: "disallowMe",
        outputs: [],
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
        inputs: [
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "grantRoles",
        outputs: [],
        stateMutability: "payable",
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
        inputs: [
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "hasAllRoles",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "hasAnyRole",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
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
        inputs: [],
        name: "owner",
        outputs: [{ name: "result", internalType: "address", type: "address" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "pendingOwner", internalType: "address", type: "address" },
        ],
        name: "ownershipHandoverExpiresAt",
        outputs: [{ name: "result", internalType: "uint256", type: "uint256" }],
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
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [{ name: "roles", internalType: "uint256", type: "uint256" }],
        name: "renounceRoles",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [],
        name: "requestOwnershipHandover",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "revokeRoles",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [{ name: "user", internalType: "address", type: "address" }],
        name: "rolesOf",
        outputs: [{ name: "roles", internalType: "uint256", type: "uint256" }],
        stateMutability: "view",
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
                name: "_contentType",
                internalType: "ContentTypes",
                type: "uint256",
            },
        ],
        name: "supportContentType",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "pure",
    },
    {
        type: "function",
        inputs: [
            { name: "newOwner", internalType: "address", type: "address" },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "payable",
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
                name: "pendingOwner",
                internalType: "address",
                type: "address",
                indexed: true,
            },
        ],
        name: "OwnershipHandoverCanceled",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "pendingOwner",
                internalType: "address",
                type: "address",
                indexed: true,
            },
        ],
        name: "OwnershipHandoverRequested",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "oldOwner",
                internalType: "address",
                type: "address",
                indexed: true,
            },
            {
                name: "newOwner",
                internalType: "address",
                type: "address",
                indexed: true,
            },
        ],
        name: "OwnershipTransferred",
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
                name: "roles",
                internalType: "uint256",
                type: "uint256",
                indexed: true,
            },
        ],
        name: "RolesUpdated",
    },
    { type: "error", inputs: [], name: "AlreadyInitialized" },
    { type: "error", inputs: [], name: "DistributionCapReached" },
    { type: "error", inputs: [], name: "InactiveCampaign" },
    { type: "error", inputs: [], name: "InvalidConfig" },
    { type: "error", inputs: [], name: "NewOwnerIsZeroAddress" },
    { type: "error", inputs: [], name: "NoHandoverRequest" },
    { type: "error", inputs: [], name: "NotEnoughToken" },
    { type: "error", inputs: [], name: "Reentrancy" },
    { type: "error", inputs: [], name: "Unauthorized" },
] as const;
