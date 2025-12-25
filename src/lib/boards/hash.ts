/**
 * Content hash utilities for board duplicate detection
 */

import { decodeStgy } from "@/lib/stgy";

/**
 * Generate SHA-256 hash from binary data
 */
export async function generateHashFromBinary(
	binary: Uint8Array,
): Promise<string> {
	const hashBuffer = await crypto.subtle.digest("SHA-256", binary);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate SHA-256 hash from stgy code (decodes first, then hashes)
 * Returns null if decoding fails
 */
export async function generateContentHash(
	stgyCode: string,
): Promise<string | null> {
	try {
		const binary = decodeStgy(stgyCode);
		return await generateHashFromBinary(binary);
	} catch {
		return null;
	}
}
