import { type Hex, hexToString, isHex } from "viem";

/**
 * Convert a bytes string to a string
 */
export function bytesToString(bytes: Hex) {
    if (!isHex(bytes)) {
        return bytes;
    }
    return hexToString(bytes)
        .replace(/[^\x20-\x7F]/g, "")
        .trim();
}
