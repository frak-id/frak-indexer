import { ponder } from "@/generated";
import { encodePacked, keccak256 } from "viem";

ponder.on(
    "WebAuthNValidator:PrimaryPassKeyChanged",
    async ({ event, context }) => {
        const { Account, MultiWebAuthNValidator, PrimaryPasskeyChangedEvent } =
            context.db;

        // Upsert the account if needed
        await Account.upsert({
            id: event.args.smartAccount,
        });

        // Find the validator, and set the primary passkey
        const validatorId = keccak256(
            encodePacked(
                ["address", "uint32"],
                [event.args.smartAccount, context.network.chainId]
            )
        );
        await MultiWebAuthNValidator.upsert({
            id: validatorId,
            create: {
                accountId: event.args.smartAccount,
                chain: context.network.chainId,
                primaryPasskeyId: event.args.authenticatorIdHash,
            },
            update: {
                primaryPasskeyId: event.args.authenticatorIdHash,
            },
        });

        // Push the primary passkey changed event
        await PrimaryPasskeyChangedEvent.create({
            id: event.log.id,
            data: {
                // Metadata info
                chain: context.network.chainId,
                timestamp: Number(event.block.timestamp),
                // Change information
                validatorId: event.args.authenticatorIdHash,
            },
        });
    }
);

ponder.on(
    "WebAuthNValidator:WebAuthnPublicKeyAdded",
    async ({ event, context }) => {
        const { Passkey, PasskeyChangeLogEvent } = context.db;

        // Create the passkey
        await Passkey.upsert({
            id: event.args.authenticatorIdHash,
            create: {
                pubKeyX: event.args.x,
                pubKeyY: event.args.y,
            },
            update: ({ current }) => current,
        });

        // Push the passkey modification event
        await PasskeyChangeLogEvent.create({
            id: event.log.id,
            data: {
                // Metadata info
                chain: context.network.chainId,
                timestamp: Number(event.block.timestamp),

                passkeyId: event.args.authenticatorIdHash,
                isAdded: true,
            },
        });
    }
);

ponder.on(
    "WebAuthNValidator:WebAuthnPublicKeyRemoved",
    async ({ event, context }) => {
        const { PasskeyChangeLogEvent } = context.db;

        // Push the passkey modification event
        await PasskeyChangeLogEvent.create({
            id: event.log.id,
            data: {
                // Metadata info
                chain: context.network.chainId,
                timestamp: Number(event.block.timestamp),

                passkeyId: event.args.authenticatorIdHash,
                isAdded: true,
            },
        });
    }
);
