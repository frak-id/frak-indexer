import { ponder } from "@/generated";
import { encodePacked, keccak256 } from "viem";

ponder.on("ERC20:Transfer", async ({ event, context }) => {
    const { Account, Token, TokenBalance, TransferEvent } = context.db;

    // Create an Account for the sender, or update the balance if it already exists.
    await Account.upsert({ id: event.args.from });

    // Create an Account for the recipient, or update the balance if it already exists.
    await Account.upsert({ id: event.args.to });

    // Update or insert the token
    const tokenId = keccak256(
        encodePacked(
            ["address", "uint32"],
            [event.log.address, context.network.chainId]
        )
    );
    await Token.upsert({
        id: tokenId,
        create: {
            address: event.log.address,
            chain: context.network.chainId,
        },
        update: ({ current }) => current,
    });

    // Update or insert the users balance on this token
    await TokenBalance.upsert({
        id: keccak256(
            encodePacked(["bytes32", "address"], [tokenId, event.args.from])
        ),
        create: {
            accountId: event.args.from,
            tokenId,
            balance: 0n,
        },
        update: ({ current }) => ({
            balance: current.balance - event.args.amount,
        }),
    });
    await TokenBalance.upsert({
        id: keccak256(
            encodePacked(["bytes32", "address"], [tokenId, event.args.to])
        ),
        create: {
            accountId: event.args.to,
            tokenId,
            balance: 0n,
        },
        update: ({ current }) => ({
            balance: current.balance + event.args.amount,
        }),
    });

    // Create a TransferEvent.
    await TransferEvent.create({
        id: event.log.id,
        data: {
            // Metadata info
            tokenId: tokenId,
            // Transfer info
            fromId: event.args.from,
            toId: event.args.to,
            amount: event.args.amount,
            timestamp: Number(event.block.timestamp),
        },
    });
});
