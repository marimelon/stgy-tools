/**
 * Substitution Cipher
 */

import { ALPHABET_TABLE, base64CharToValue, valueToBase64Char } from "./tables";

/**
 * Reverse lookup table for ALPHABET_TABLE (standard Base64 char -> custom char)
 */
const REVERSE_ALPHABET_TABLE: Record<string, string> = Object.fromEntries(
	Object.entries(ALPHABET_TABLE).map(([k, v]) => [v, k]),
);

/**
 * Encode with substitution cipher
 * @param base64String Standard Base64 string
 * @param key Key value (0-63)
 * @returns Encoded string
 */
export function encryptCipher(base64String: string, key: number): string {
	let result = "";
	for (let i = 0; i < base64String.length; i++) {
		const inputChar = base64String[i];
		// Get Base64 value
		const val = base64CharToValue(inputChar);
		// Encode: (val + i + key) & 0x3F
		const encodedVal = (val + i + key) & 0x3f;
		// Convert to Base64 char
		const standardChar = valueToBase64Char(encodedVal);
		// Convert to custom char using REVERSE_ALPHABET_TABLE
		const outputChar = REVERSE_ALPHABET_TABLE[standardChar];
		if (outputChar === undefined) {
			throw new Error(`Failed to encode character: ${standardChar}`);
		}
		result += outputChar;
	}
	return result;
}

/**
 * Decode substitution cipher
 * @param encoded Encoded string
 * @param key Key value (0-63)
 * @returns Standard Base64 string
 */
export function decryptCipher(encoded: string, key: number): string {
	let result = "";
	for (let i = 0; i < encoded.length; i++) {
		const inputChar = encoded[i];
		// Convert using ALPHABET_TABLE
		const standardChar = ALPHABET_TABLE[inputChar];
		if (standardChar === undefined) {
			throw new Error(`Unknown character in payload: ${inputChar}`);
		}
		// Get Base64 value
		const val = base64CharToValue(standardChar);
		// Decode: (val - i - key) & 0x3F
		const decodedVal = (val - i - key) & 0x3f;
		// Convert back to Base64 char
		result += valueToBase64Char(decodedVal);
	}
	return result;
}
