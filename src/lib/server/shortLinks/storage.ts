/**
 * Abstract interface for short link storage
 *
 * Abstracted to support various backends (KV, Firestore, R2, etc.)
 */

import type { ShortLinkData } from "./types";

/**
 * Implementation examples:
 * - KVShortLinkStorage: Cloudflare KV
 * - FirestoreShortLinkStorage: Google Firestore
 * - MemoryShortLinkStorage: In-memory (for testing)
 */
export interface ShortLinkStorage {
	get(id: string): Promise<ShortLinkData | null>;
	save(id: string, data: ShortLinkData): Promise<void>;
	delete(id: string): Promise<void>;
	exists(id: string): Promise<boolean>;
	isAvailable(): boolean;
}

/**
 * Fallback when storage is unavailable - returns null and does nothing
 */
export class NullShortLinkStorage implements ShortLinkStorage {
	async get(_id: string): Promise<ShortLinkData | null> {
		return null;
	}

	async save(_id: string, _data: ShortLinkData): Promise<void> {
		// No-op
	}

	async delete(_id: string): Promise<void> {
		// No-op
	}

	async exists(_id: string): Promise<boolean> {
		return false;
	}

	isAvailable(): boolean {
		return false;
	}
}
