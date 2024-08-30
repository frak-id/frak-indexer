//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ProductAdministratorRegistry
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const productAdministratorRegistryAbi = [
    {
        type: "constructor",
        inputs: [
            {
                name: "_productRegistry",
                internalType: "contract ProductRegistry",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [
            { name: "productId", internalType: "uint256", type: "uint256" },
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "grantRoles",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [
            { name: "productId", internalType: "uint256", type: "uint256" },
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
            { name: "productId", internalType: "uint256", type: "uint256" },
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "hasAllRolesOrAdmin",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "productId", internalType: "uint256", type: "uint256" },
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "hasAnyRole",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "_productId", internalType: "uint256", type: "uint256" },
            { name: "_caller", internalType: "address", type: "address" },
        ],
        name: "isAuthorizedAdmin",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "productId", internalType: "uint256", type: "uint256" },
        ],
        name: "renounceAllRoles",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [
            { name: "productId", internalType: "uint256", type: "uint256" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "renounceRoles",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [
            { name: "productId", internalType: "uint256", type: "uint256" },
            { name: "user", internalType: "address", type: "address" },
        ],
        name: "revokeAllRoles",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [
            { name: "productId", internalType: "uint256", type: "uint256" },
            { name: "user", internalType: "address", type: "address" },
            { name: "roles", internalType: "uint256", type: "uint256" },
        ],
        name: "revokeRoles",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [
            { name: "productId", internalType: "uint256", type: "uint256" },
            { name: "user", internalType: "address", type: "address" },
        ],
        name: "rolesOf",
        outputs: [{ name: "roles", internalType: "uint256", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "product",
                internalType: "uint256",
                type: "uint256",
                indexed: true,
            },
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
                indexed: false,
            },
        ],
        name: "ProductRolesUpdated",
    },
    { type: "error", inputs: [], name: "Unauthorized" },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ProductRegistry
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const productRegistryAbi = [
    {
        type: "constructor",
        inputs: [{ name: "_owner", internalType: "address", type: "address" }],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [
            { name: "account", internalType: "address", type: "address" },
            { name: "id", internalType: "uint256", type: "uint256" },
        ],
        name: "approve",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [{ name: "owner", internalType: "address", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "result", internalType: "uint256", type: "uint256" }],
        stateMutability: "view",
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
        inputs: [{ name: "id", internalType: "uint256", type: "uint256" }],
        name: "getApproved",
        outputs: [{ name: "result", internalType: "address", type: "address" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "_productId", internalType: "uint256", type: "uint256" },
        ],
        name: "getMetadata",
        outputs: [
            {
                name: "",
                internalType: "struct Metadata",
                type: "tuple",
                components: [
                    {
                        name: "productTypes",
                        internalType: "ProductTypes",
                        type: "uint256",
                    },
                    { name: "name", internalType: "string", type: "string" },
                    { name: "domain", internalType: "string", type: "string" },
                ],
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "_productId", internalType: "uint256", type: "uint256" },
        ],
        name: "getProductTypes",
        outputs: [{ name: "", internalType: "ProductTypes", type: "uint256" }],
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
        inputs: [
            { name: "owner", internalType: "address", type: "address" },
            { name: "operator", internalType: "address", type: "address" },
        ],
        name: "isApprovedForAll",
        outputs: [{ name: "result", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "_productId", internalType: "uint256", type: "uint256" },
            { name: "_caller", internalType: "address", type: "address" },
        ],
        name: "isAuthorized",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "_productId", internalType: "uint256", type: "uint256" },
        ],
        name: "isExistingProduct",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            {
                name: "_productTypes",
                internalType: "ProductTypes",
                type: "uint256",
            },
            { name: "_name", internalType: "string", type: "string" },
            { name: "_domain", internalType: "string", type: "string" },
            { name: "_owner", internalType: "address", type: "address" },
        ],
        name: "mint",
        outputs: [{ name: "id", internalType: "uint256", type: "uint256" }],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [],
        name: "name",
        outputs: [{ name: "", internalType: "string", type: "string" }],
        stateMutability: "pure",
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
        inputs: [{ name: "id", internalType: "uint256", type: "uint256" }],
        name: "ownerOf",
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
        inputs: [
            { name: "from", internalType: "address", type: "address" },
            { name: "to", internalType: "address", type: "address" },
            { name: "id", internalType: "uint256", type: "uint256" },
        ],
        name: "safeTransferFrom",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [
            { name: "from", internalType: "address", type: "address" },
            { name: "to", internalType: "address", type: "address" },
            { name: "id", internalType: "uint256", type: "uint256" },
            { name: "data", internalType: "bytes", type: "bytes" },
        ],
        name: "safeTransferFrom",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [
            { name: "operator", internalType: "address", type: "address" },
            { name: "isApproved", internalType: "bool", type: "bool" },
        ],
        name: "setApprovalForAll",
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [
            { name: "interfaceId", internalType: "bytes4", type: "bytes4" },
        ],
        name: "supportsInterface",
        outputs: [{ name: "result", internalType: "bool", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [],
        name: "symbol",
        outputs: [{ name: "", internalType: "string", type: "string" }],
        stateMutability: "pure",
    },
    {
        type: "function",
        inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
        name: "tokenURI",
        outputs: [{ name: "", internalType: "string", type: "string" }],
        stateMutability: "pure",
    },
    {
        type: "function",
        inputs: [
            { name: "from", internalType: "address", type: "address" },
            { name: "to", internalType: "address", type: "address" },
            { name: "id", internalType: "uint256", type: "uint256" },
        ],
        name: "transferFrom",
        outputs: [],
        stateMutability: "payable",
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
        inputs: [
            { name: "_productId", internalType: "uint256", type: "uint256" },
            {
                name: "_productTypes",
                internalType: "ProductTypes",
                type: "uint256",
            },
            { name: "_name", internalType: "string", type: "string" },
        ],
        name: "updateMetadata",
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "owner",
                internalType: "address",
                type: "address",
                indexed: true,
            },
            {
                name: "account",
                internalType: "address",
                type: "address",
                indexed: true,
            },
            {
                name: "id",
                internalType: "uint256",
                type: "uint256",
                indexed: true,
            },
        ],
        name: "Approval",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "owner",
                internalType: "address",
                type: "address",
                indexed: true,
            },
            {
                name: "operator",
                internalType: "address",
                type: "address",
                indexed: true,
            },
            {
                name: "isApproved",
                internalType: "bool",
                type: "bool",
                indexed: false,
            },
        ],
        name: "ApprovalForAll",
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
                name: "productId",
                internalType: "uint256",
                type: "uint256",
                indexed: true,
            },
            {
                name: "domain",
                internalType: "string",
                type: "string",
                indexed: false,
            },
            {
                name: "productTypes",
                internalType: "ProductTypes",
                type: "uint256",
                indexed: false,
            },
            {
                name: "name",
                internalType: "string",
                type: "string",
                indexed: false,
            },
        ],
        name: "ProductMinted",
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "productId",
                internalType: "uint256",
                type: "uint256",
                indexed: true,
            },
            {
                name: "productTypes",
                internalType: "ProductTypes",
                type: "uint256",
                indexed: false,
            },
            {
                name: "name",
                internalType: "string",
                type: "string",
                indexed: false,
            },
        ],
        name: "ProductUpdated",
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
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "from",
                internalType: "address",
                type: "address",
                indexed: true,
            },
            {
                name: "to",
                internalType: "address",
                type: "address",
                indexed: true,
            },
            {
                name: "id",
                internalType: "uint256",
                type: "uint256",
                indexed: true,
            },
        ],
        name: "Transfer",
    },
    { type: "error", inputs: [], name: "AccountBalanceOverflow" },
    { type: "error", inputs: [], name: "AlreadyExistingProduct" },
    { type: "error", inputs: [], name: "AlreadyInitialized" },
    { type: "error", inputs: [], name: "BalanceQueryForZeroAddress" },
    { type: "error", inputs: [], name: "InvalidNameOrDomain" },
    { type: "error", inputs: [], name: "InvalidOwner" },
    { type: "error", inputs: [], name: "NewOwnerIsZeroAddress" },
    { type: "error", inputs: [], name: "NoHandoverRequest" },
    { type: "error", inputs: [], name: "NotOwnerNorApproved" },
    { type: "error", inputs: [], name: "TokenAlreadyExists" },
    { type: "error", inputs: [], name: "TokenDoesNotExist" },
    { type: "error", inputs: [], name: "TransferFromIncorrectOwner" },
    {
        type: "error",
        inputs: [],
        name: "TransferToNonERC721ReceiverImplementer",
    },
    { type: "error", inputs: [], name: "TransferToZeroAddress" },
    { type: "error", inputs: [], name: "Unauthorized" },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ReferralRegistry
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const referralRegistryAbi = [
    {
        type: "constructor",
        inputs: [{ name: "_owner", internalType: "address", type: "address" }],
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
        inputs: [
            { name: "_selector", internalType: "bytes32", type: "bytes32" },
            { name: "_referee", internalType: "address", type: "address" },
        ],
        name: "getAllReferrers",
        outputs: [
            {
                name: "referrerChains",
                internalType: "address[]",
                type: "address[]",
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "_selector", internalType: "bytes32", type: "bytes32" },
            { name: "_referee", internalType: "address", type: "address" },
            { name: "_maxLength", internalType: "uint256", type: "uint256" },
        ],
        name: "getCappedReferrers",
        outputs: [
            {
                name: "referrerChains",
                internalType: "address[]",
                type: "address[]",
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "_selector", internalType: "bytes32", type: "bytes32" },
            { name: "_referee", internalType: "address", type: "address" },
        ],
        name: "getReferrer",
        outputs: [
            { name: "referrer", internalType: "address", type: "address" },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "_selector", internalType: "bytes32", type: "bytes32" },
            { name: "_owner", internalType: "address", type: "address" },
        ],
        name: "grantAccessToTree",
        outputs: [],
        stateMutability: "nonpayable",
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
        inputs: [
            { name: "_selector", internalType: "bytes32", type: "bytes32" },
            { name: "_owner", internalType: "address", type: "address" },
        ],
        name: "isAllowedOnTree",
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
        inputs: [
            { name: "_selector", internalType: "bytes32", type: "bytes32" },
            { name: "_user", internalType: "address", type: "address" },
            { name: "_referrer", internalType: "address", type: "address" },
        ],
        name: "saveReferrer",
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [
            { name: "_selector", internalType: "bytes32", type: "bytes32" },
            { name: "_newOwner", internalType: "address", type: "address" },
        ],
        name: "transferAccessToTree",
        outputs: [],
        stateMutability: "nonpayable",
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
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "tree",
                internalType: "bytes32",
                type: "bytes32",
                indexed: true,
            },
            {
                name: "referer",
                internalType: "address",
                type: "address",
                indexed: true,
            },
            {
                name: "referee",
                internalType: "address",
                type: "address",
                indexed: true,
            },
        ],
        name: "UserReferred",
    },
    {
        type: "error",
        inputs: [
            { name: "tree", internalType: "bytes32", type: "bytes32" },
            {
                name: "currentReferrer",
                internalType: "address",
                type: "address",
            },
        ],
        name: "AlreadyHaveReferer",
    },
    {
        type: "error",
        inputs: [{ name: "tree", internalType: "bytes32", type: "bytes32" }],
        name: "AlreadyInRefererChain",
    },
    { type: "error", inputs: [], name: "AlreadyInitialized" },
    { type: "error", inputs: [], name: "InvalidReferrer" },
    { type: "error", inputs: [], name: "InvalidTreeOwner" },
    { type: "error", inputs: [], name: "NewOwnerIsZeroAddress" },
    { type: "error", inputs: [], name: "NoHandoverRequest" },
    { type: "error", inputs: [], name: "NotAllowedOnTheGivenTree" },
    { type: "error", inputs: [], name: "Unauthorized" },
] as const;
