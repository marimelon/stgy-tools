/**
 * URL-safe Base64 encode/decode utilities
 * No padding
 */

/**
 * Base64 encode (output as URL-safe Base64)
 * Converts + to -, / to _ and removes padding
 * @param data Byte array
 * @returns URL-safe Base64 string
 */
export function encodeBase64(data: Uint8Array): string {
	// Convert binary to string
	let binaryString = "";
	for (let i = 0; i < data.length; i++) {
		binaryString += String.fromCharCode(data[i]);
	}
	// Standard Base64 encode
	const standardBase64 = btoa(binaryString);
	// Convert to URL-safe Base64 and remove padding
	return standardBase64
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
}

/**
 * Base64 decode (supports URL-safe Base64)
 * Converts - to +, _ to / and restores padding
 * @param base64 URL-safe Base64 string
 * @returns Byte array
 */
export function decodeBase64(base64: string): Uint8Array {
	// Convert URL-safe Base64 to standard Base64
	const standardBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
	// Restore padding
	const padded =
		standardBase64 + "=".repeat((4 - (standardBase64.length % 4)) % 4);
	// Base64 decode
	const binaryString = atob(padded);
	// Convert to byte array
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}
