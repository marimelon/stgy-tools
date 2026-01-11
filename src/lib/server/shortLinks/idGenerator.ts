/**
 * Short ID generation logic
 *
 * Generates hash-based ID from stgy code.
 * Same stgy code returns same ID (deterministic).
 * On collision, increment attempt and regenerate.
 */

const ID_LENGTH = 7;

const BASE62_CHARS =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Fallback for environments without Web Crypto API
 */
async function getNodeCrypto(): Promise<typeof import("node:crypto") | null> {
	try {
		return await import("node:crypto");
	} catch {
		return null;
	}
}

/**
 * SHA-256 hash using Web Crypto API (supports both Workers and Node.js)
 */
async function sha256(input: string): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);

	if (crypto?.subtle) {
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		return new Uint8Array(hashBuffer);
	}

	// Fallback to Node.js crypto module
	const nodeCrypto = await getNodeCrypto();
	if (nodeCrypto) {
		const hash = nodeCrypto.createHash("sha256");
		hash.update(Buffer.from(data));
		return new Uint8Array(hash.digest());
	}

	throw new Error("No crypto implementation available");
}

function bytesToBase62(bytes: Uint8Array, length: number): string {
	let result = "";
	for (let i = 0; i < length; i++) {
		const byte = bytes[i % bytes.length];
		result += BASE62_CHARS[byte % 62];
	}
	return result;
}

/**
 * Generate short ID from stgy code
 *
 * Same stgy code and attempt always returns the same ID (deterministic)
 */
export async function generateShortId(
	stgy: string,
	attempt: number = 0,
): Promise<string> {
	// Add salt when attempt > 0
	const input = attempt === 0 ? stgy : `${stgy}::${attempt}`;
	const hash = await sha256(input);
	return bytesToBase62(hash, ID_LENGTH);
}

export function isValidShortId(id: string): boolean {
	if (id.length !== ID_LENGTH) return false;
	return /^[0-9A-Za-z]+$/.test(id);
}

export function isValidStgyCode(stgy: string): boolean {
	// Must start with [stgy: and end with ]
	if (!stgy.startsWith("[stgy:") || !stgy.endsWith("]")) {
		return false;
	}
	if (stgy.length < 10) {
		return false;
	}
	return true;
}
