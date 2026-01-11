/**
 * Cloudflare KV storage implementation for short links
 */

import type { ShortLinkStorage } from "./storage";
import type { ShortLinkData } from "./types";

export interface KVNamespace {
	get(key: string, options?: { type?: "text" }): Promise<string | null>;
	put(key: string, value: string): Promise<void>;
	delete(key: string): Promise<void>;
}

export class KVShortLinkStorage implements ShortLinkStorage {
	private kv: KVNamespace;

	constructor(kv: KVNamespace) {
		this.kv = kv;
	}

	async get(id: string): Promise<ShortLinkData | null> {
		const data = await this.kv.get(id, { type: "text" });
		if (!data) return null;
		try {
			return JSON.parse(data) as ShortLinkData;
		} catch {
			return null;
		}
	}

	async save(id: string, data: ShortLinkData): Promise<void> {
		await this.kv.put(id, JSON.stringify(data));
	}

	async exists(id: string): Promise<boolean> {
		return (await this.kv.get(id, { type: "text" })) !== null;
	}

	isAvailable(): boolean {
		return true;
	}
}
