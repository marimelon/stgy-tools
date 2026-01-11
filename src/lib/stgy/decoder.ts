/**
 * stgy format decoder
 *
 * Decodes [stgy:a<key_char><encoded_payload>] format strings
 * and returns board data binary
 */

import pako from "pako";
import { decodeBase64 } from "./base64";
import { decryptCipher } from "./cipher";
import {
	BINARY_HEADER_SIZE,
	COMPRESSED_DATA_OFFSET,
	MIN_STGY_PAYLOAD_LENGTH,
	STGY_PREFIX,
	STGY_SUFFIX,
} from "./constants";
import { calculateCRC32 } from "./crc32";
import { base64CharToValue, KEY_TABLE } from "./tables";

/**
 * Decode stgy string and return board data
 * @param stgyString String in [stgy:a...] format
 * @returns Decoded board data
 */
export function decodeStgy(stgyString: string): Uint8Array {
	// 1. Validate and remove prefix/suffix
	if (!stgyString.startsWith(STGY_PREFIX)) {
		throw new Error("Invalid stgy string: missing prefix");
	}
	if (!stgyString.endsWith(STGY_SUFFIX)) {
		throw new Error("Invalid stgy string: missing suffix");
	}

	const data = stgyString.slice(STGY_PREFIX.length, -STGY_SUFFIX.length);
	if (data.length < MIN_STGY_PAYLOAD_LENGTH) {
		throw new Error("Invalid stgy string: too short");
	}

	// 2. Get key character
	const keyChar = data[0];
	const keyMapped = KEY_TABLE[keyChar];
	if (keyMapped === undefined) {
		throw new Error(`Invalid key character: ${keyChar}`);
	}

	// 3. Calculate key value
	const key = base64CharToValue(keyMapped);

	// 4. Decrypt payload with substitution cipher
	const encodedPayload = data.slice(1);
	const base64String = decryptCipher(encodedPayload, key);

	// 5. Base64 decode
	const binary = decodeBase64(base64String);

	// 6. Parse binary structure
	if (binary.length < BINARY_HEADER_SIZE) {
		throw new Error("Invalid binary: too short");
	}

	// CRC32 (4 bytes, Little Endian) - >>> 0 converts to unsigned 32-bit integer
	const storedCRC =
		(binary[0] | (binary[1] << 8) | (binary[2] << 16) | (binary[3] << 24)) >>>
		0;

	// Decompressed data length (2 bytes, Little Endian)
	const decompressedLength = binary[4] | (binary[5] << 8);

	// Compressed data
	const compressedData = binary.slice(COMPRESSED_DATA_OFFSET);

	// 7. CRC32 verification
	const calculatedCRC = calculateCRC32(binary.slice(4));
	if (storedCRC !== calculatedCRC) {
		throw new Error(
			`CRC32 mismatch: stored=${storedCRC.toString(16)}, calculated=${calculatedCRC.toString(16)}`,
		);
	}

	// 8. zlib decompression
	const decompressed = pako.inflate(compressedData);

	// 9. Verify decompressed data length
	if (decompressed.length !== decompressedLength) {
		throw new Error(
			`Decompressed length mismatch: expected=${decompressedLength}, actual=${decompressed.length}`,
		);
	}

	return decompressed;
}

/**
 * Object containing decode result information
 */
export interface DecodeResult {
	data: Uint8Array;
	decompressedLength: number;
	compressedLength: number;
}

/**
 * Decode stgy string and return detailed information
 */
export function decodeStgyWithInfo(stgyString: string): DecodeResult {
	const data = decodeStgy(stgyString);

	// Re-fetch binary to calculate compressed length
	const stgyData = stgyString.slice(STGY_PREFIX.length, -STGY_SUFFIX.length);
	const keyChar = stgyData[0];
	const keyMapped = KEY_TABLE[keyChar];
	if (!keyMapped) {
		throw new Error(`Invalid key character: ${keyChar}`);
	}
	const key = base64CharToValue(keyMapped);
	const base64String = decryptCipher(stgyData.slice(1), key);
	const binary = decodeBase64(base64String);

	return {
		data,
		decompressedLength: data.length,
		compressedLength: binary.length - BINARY_HEADER_SIZE,
	};
}
