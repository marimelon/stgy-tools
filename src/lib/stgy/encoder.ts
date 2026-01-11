/**
 * stgy format encoder
 *
 * Encodes BoardData to [stgy:a<key_char><encoded_payload>] format string
 * (reverse of decoder.ts)
 */

import pako from "pako";
import { encodeBase64 } from "./base64";
import { encryptCipher } from "./cipher";
import { KEY_CHAR_INDEX, STGY_PREFIX, STGY_SUFFIX } from "./constants";
import { calculateCRC32 } from "./crc32";
import { serializeBoardData } from "./serializer";
import { base64CharToValue, KEY_TABLE } from "./tables";
import type { BoardData } from "./types";

/**
 * Reverse lookup table for KEY_TABLE (Base64 value -> key character)
 */
const REVERSE_KEY_TABLE: Record<number, string> = Object.fromEntries(
	Object.entries(KEY_TABLE).map(([keyChar, base64Char]) => [
		base64CharToValue(base64Char),
		keyChar,
	]),
);

/**
 * Encode BoardData to stgy string
 * @param board Board data
 * @returns String in [stgy:a...] format
 */
export function encodeStgy(board: BoardData): string {
	// 1. Serialize BoardData to binary
	const binaryData = serializeBoardData(board);

	// 2. zlib compression
	const compressedData = pako.deflate(binaryData);

	// 3. Decompressed data length (2 bytes, Little Endian)
	const decompressedLength = binaryData.length;
	const lengthBytes = new Uint8Array(2);
	lengthBytes[0] = decompressedLength & 0xff;
	lengthBytes[1] = (decompressedLength >> 8) & 0xff;

	// 4. Data for CRC32 calculation (length + compressed)
	const dataForCRC = new Uint8Array(2 + compressedData.length);
	dataForCRC.set(lengthBytes, 0);
	dataForCRC.set(compressedData, 2);

	// 5. CRC32 calculation
	const crc32 = calculateCRC32(dataForCRC);

	// 6. Build final binary: CRC32(4) + length(2) + compressed
	const finalBinary = new Uint8Array(4 + 2 + compressedData.length);
	// CRC32 (Little Endian)
	finalBinary[0] = crc32 & 0xff;
	finalBinary[1] = (crc32 >> 8) & 0xff;
	finalBinary[2] = (crc32 >> 16) & 0xff;
	finalBinary[3] = (crc32 >> 24) & 0xff;
	// length + compressed
	finalBinary.set(dataForCRC, 4);

	// 7. Base64 encode
	const base64String = encodeBase64(finalBinary);

	// 8. Determine key value (lower 6 bits of CRC32's lowest byte)
	// e.g.: CRC32 = 0x062e241d -> lowest byte = 0x1d (29) -> key = 29 & 0x3F = 29
	const key = crc32 & 0x3f;

	// 9. Get key character
	const keyChar = REVERSE_KEY_TABLE[key];
	if (keyChar === undefined) {
		throw new Error(`Invalid key value: ${key}`);
	}

	// 10. Apply substitution cipher
	const encryptedPayload = encryptCipher(base64String, key);

	// 11. Build final string
	return `${STGY_PREFIX}${keyChar}${encryptedPayload}${STGY_SUFFIX}`;
}

/**
 * Extract key value from stgy string
 * @param stgyString String in [stgy:a<key_char>...] format
 * @returns Key value (0-63)
 */
export function extractKeyFromStgy(stgyString: string): number {
	if (!stgyString.startsWith(STGY_PREFIX)) {
		throw new Error("Invalid stgy string format");
	}
	const keyChar = stgyString[KEY_CHAR_INDEX];
	const mappedChar = KEY_TABLE[keyChar];
	if (!mappedChar) {
		throw new Error(`Invalid key character: ${keyChar}`);
	}
	return base64CharToValue(mappedChar);
}
