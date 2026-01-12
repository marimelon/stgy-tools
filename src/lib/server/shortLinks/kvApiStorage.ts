/**
 * Cloudflare KV REST API storage implementation
 *
 * Used in Node.js environments where Workers direct binding is unavailable
 */

import type { ShortLinkStorage } from "./storage";
import type { ShortLinkData } from "./types";

const KV_API_BASE = "https://api.cloudflare.com/client/v4/accounts";

export interface KVApiConfig {
	accountId: string;
	namespaceId: string;
	apiToken: string;
}

export class KVApiShortLinkStorage implements ShortLinkStorage {
	private config: KVApiConfig;

	constructor(config: KVApiConfig) {
		this.config = config;
	}

	isAvailable(): boolean {
		return Boolean(
			this.config.accountId && this.config.namespaceId && this.config.apiToken,
		);
	}

	async get(id: string): Promise<ShortLinkData | null> {
		const url = this.buildUrl(`/values/${encodeURIComponent(id)}`);

		try {
			const response = await fetch(url, {
				method: "GET",
				headers: this.buildHeaders(),
			});

			if (response.status === 404) {
				return null;
			}

			if (!response.ok) {
				console.error(`KV API GET failed: ${response.status}`);
				return null;
			}

			// KV REST API returns value directly (not wrapped in JSON)
			const text = await response.text();
			try {
				return JSON.parse(text) as ShortLinkData;
			} catch {
				console.error("Failed to parse KV value as JSON");
				return null;
			}
		} catch {
			console.error("KV API GET error");
			return null;
		}
	}

	async save(id: string, data: ShortLinkData): Promise<void> {
		const url = this.buildUrl(`/values/${encodeURIComponent(id)}`);

		const response = await fetch(url, {
			method: "PUT",
			headers: {
				...this.buildHeaders(),
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`KV API PUT failed: ${response.status}`);
		}
	}

	async delete(id: string): Promise<void> {
		const url = this.buildUrl(`/values/${encodeURIComponent(id)}`);

		const response = await fetch(url, {
			method: "DELETE",
			headers: this.buildHeaders(),
		});

		if (!response.ok && response.status !== 404) {
			throw new Error(`KV API DELETE failed: ${response.status}`);
		}
	}

	async exists(id: string): Promise<boolean> {
		return (await this.get(id)) !== null;
	}

	private buildUrl(path: string): string {
		return `${KV_API_BASE}/${this.config.accountId}/storage/kv/namespaces/${this.config.namespaceId}${path}`;
	}

	private buildHeaders(): Record<string, string> {
		return { Authorization: `Bearer ${this.config.apiToken}` };
	}
}
