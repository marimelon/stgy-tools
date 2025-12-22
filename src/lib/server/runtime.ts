/**
 * 実行環境の判定とユーティリティ
 */

export type RuntimeEnvironment = "cloudflare" | "node";

/**
 * 現在の実行環境を判定
 */
export function getRuntimeEnvironment(): RuntimeEnvironment {
	// Cloudflare Workers の場合は navigator.userAgent に "Cloudflare-Workers" が含まれる
	if (
		typeof navigator !== "undefined" &&
		navigator.userAgent === "Cloudflare-Workers"
	) {
		return "cloudflare";
	}

	// globalThis に caches が存在する場合は Cloudflare Workers
	if (typeof globalThis !== "undefined" && "caches" in globalThis) {
		// Cloudflare Workers の caches は ServiceWorkerGlobalScope
		const caches = (globalThis as unknown as { caches: unknown }).caches;
		if (caches && typeof caches === "object" && "default" in caches) {
			return "cloudflare";
		}
	}

	return "node";
}

/**
 * Cloudflare Workers 環境かどうか
 */
export function isCloudflareWorkers(): boolean {
	return getRuntimeEnvironment() === "cloudflare";
}

/**
 * Node.js 環境かどうか
 */
export function isNodeEnvironment(): boolean {
	return getRuntimeEnvironment() === "node";
}

