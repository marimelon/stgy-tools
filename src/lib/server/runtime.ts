/**
 * Runtime environment detection utilities
 */

export type RuntimeEnvironment = "cloudflare" | "node";

export function getRuntimeEnvironment(): RuntimeEnvironment {
	// navigator.userAgent contains "Cloudflare-Workers" in Workers environment
	if (
		typeof navigator !== "undefined" &&
		navigator.userAgent === "Cloudflare-Workers"
	) {
		return "cloudflare";
	}

	// globalThis.caches with "default" property indicates Cloudflare Workers
	if (typeof globalThis !== "undefined" && "caches" in globalThis) {
		const caches = (globalThis as unknown as { caches: unknown }).caches;
		if (caches && typeof caches === "object" && "default" in caches) {
			return "cloudflare";
		}
	}

	return "node";
}

export function isCloudflareWorkers(): boolean {
	return getRuntimeEnvironment() === "cloudflare";
}

export function isNodeEnvironment(): boolean {
	return getRuntimeEnvironment() === "node";
}
