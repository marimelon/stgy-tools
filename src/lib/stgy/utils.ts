/**
 * STGY format utility functions
 */

import { BYTE_ALIGNMENT_2, BYTE_ALIGNMENT_4 } from "./constants";

/**
 * Return length padded to 4-byte boundary
 */
export function padTo4Bytes(length: number): number {
	return Math.ceil(length / BYTE_ALIGNMENT_4) * BYTE_ALIGNMENT_4;
}

/**
 * Return length padded to 2-byte boundary
 */
export function padTo2Bytes(length: number): number {
	return Math.ceil(length / BYTE_ALIGNMENT_2) * BYTE_ALIGNMENT_2;
}

/**
 * Return number of padding bytes for 4-byte boundary
 */
export function getPadding4(length: number): number {
	const remainder = length % BYTE_ALIGNMENT_4;
	return remainder === 0 ? 0 : BYTE_ALIGNMENT_4 - remainder;
}

/**
 * Return number of padding bytes for 2-byte boundary
 */
export function getPadding2(length: number): number {
	return length % BYTE_ALIGNMENT_2;
}

/**
 * Return byte length of UTF-8 string
 */
export function getUtf8ByteLength(str: string): number {
	return new TextEncoder().encode(str).length;
}

/**
 * Truncate string to fit within specified UTF-8 byte limit
 * Processes character by character to avoid breaking multibyte characters
 */
export function truncateToUtf8Bytes(str: string, maxBytes: number): string {
	const encoder = new TextEncoder();
	const totalBytes = encoder.encode(str).length;
	if (totalBytes <= maxBytes) {
		return str;
	}

	// Truncate character by character (to avoid breaking multibyte characters)
	let result = "";
	let currentBytes = 0;
	for (const char of str) {
		const charBytes = encoder.encode(char).length;
		if (currentBytes + charBytes > maxBytes) {
			break;
		}
		result += char;
		currentBytes += charBytes;
	}
	return result;
}
