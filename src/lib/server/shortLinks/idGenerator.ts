/**
 * Short ID generation logic
 *
 * - Short links: Hash-based ID from stgy code (deterministic)
 * - Groups: Random ID for each creation (non-deterministic)
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

/**
 * Generate random group ID
 *
 * Each call generates a unique random ID (not content-based).
 * This ensures that groups with the same name/codes are stored separately.
 */
export async function generateGroupId(): Promise<string> {
	const bytes = await getRandomBytes(ID_LENGTH);
	return bytesToBase62(bytes, ID_LENGTH);
}

export function isValidGroupId(id: string): boolean {
	return isValidShortId(id);
}

const EDIT_KEY_LENGTH = 16;

/**
 * Fallback for environments without Web Crypto API (getRandomValues)
 */
async function getRandomBytes(length: number): Promise<Uint8Array> {
	if (crypto?.getRandomValues) {
		const bytes = new Uint8Array(length);
		crypto.getRandomValues(bytes);
		return bytes;
	}

	// Fallback to Node.js crypto module
	const nodeCrypto = await getNodeCrypto();
	if (nodeCrypto) {
		return new Uint8Array(nodeCrypto.randomBytes(length));
	}

	throw new Error("No crypto implementation available for random bytes");
}

/**
 * Generate a random edit key (16 characters, alphanumeric)
 */
export async function generateEditKey(): Promise<string> {
	const bytes = await getRandomBytes(EDIT_KEY_LENGTH);
	return bytesToBase62(bytes, EDIT_KEY_LENGTH);
}

/**
 * Hash edit key for storage (SHA-256, hex encoded)
 */
export async function hashEditKey(editKey: string): Promise<string> {
	const hash = await sha256(editKey);
	return Array.from(hash)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Timing-safe string comparison using crypto.timingSafeEqual when available
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
	if (a.length !== b.length) {
		return false;
	}

	const encoder = new TextEncoder();
	const bufA = encoder.encode(a);
	const bufB = encoder.encode(b);

	// Use Node.js crypto.timingSafeEqual if available
	const nodeCrypto = await getNodeCrypto();
	if (nodeCrypto?.timingSafeEqual) {
		return nodeCrypto.timingSafeEqual(Buffer.from(bufA), Buffer.from(bufB));
	}

	// Fallback: Hash both values and compare hashes
	// This provides timing-safety because we compare fixed-length hashes
	// and the comparison time doesn't depend on the input values
	const hashA = await sha256(a);
	const hashB = await sha256(b);

	let result = 0;
	for (let i = 0; i < hashA.length; i++) {
		result |= hashA[i] ^ hashB[i];
	}
	return result === 0;
}

/**
 * Verify edit key against stored hash (timing-safe comparison)
 */
export async function verifyEditKey(
	editKey: string,
	storedHash: string,
): Promise<boolean> {
	const inputHash = await hashEditKey(editKey);
	return timingSafeEqual(inputHash, storedHash);
}

export function isValidEditKey(editKey: string): boolean {
	if (editKey.length !== EDIT_KEY_LENGTH) return false;
	return /^[0-9A-Za-z]+$/.test(editKey);
}

const MIN_CUSTOM_EDIT_KEY_LENGTH = 4;
const MAX_CUSTOM_EDIT_KEY_LENGTH = 64;

/**
 * Validate custom edit key (user-provided)
 * More flexible than auto-generated keys: 8-64 chars, printable ASCII
 */
export function isValidCustomEditKey(editKey: string): boolean {
	if (
		editKey.length < MIN_CUSTOM_EDIT_KEY_LENGTH ||
		editKey.length > MAX_CUSTOM_EDIT_KEY_LENGTH
	) {
		return false;
	}
	// Allow printable ASCII characters (space to tilde, 0x20-0x7E)
	return /^[\x20-\x7E]+$/.test(editKey);
}
