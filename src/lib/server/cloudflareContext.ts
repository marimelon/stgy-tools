/**
 * Utility for storing/retrieving Cloudflare Workers env globally
 * Uses AsyncLocalStorage to maintain independent context per request
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type { AssetsBinding } from "./imageLoader";

export interface CloudflareEnv {
	ASSETS?: AssetsBinding;
	/**
	 * External image renderer URL
	 * When set, delegates PNG generation to external server
	 * e.g., "https://render.example.com/image"
	 */
	EXTERNAL_IMAGE_RENDERER_URL?: string;
	/**
	 * Enable/disable short links feature
	 * "true" to enable, anything else or unset to disable
	 */
	SHORT_LINKS_ENABLED?: string;
	/**
	 * Short links Cloudflare KV Namespace (Workers direct binding)
	 * Set as binding: "SHORT_LINKS" in wrangler.jsonc
	 */
	SHORT_LINKS?: unknown;
	/**
	 * Cloudflare Account ID (for KV REST API)
	 */
	CLOUDFLARE_ACCOUNT_ID?: string;
	/**
	 * Cloudflare KV Namespace ID (for KV REST API)
	 */
	CLOUDFLARE_KV_NAMESPACE_ID?: string;
	/**
	 * Cloudflare API Token (for KV REST API)
	 * Requires Account.Workers KV Storage permission
	 */
	CLOUDFLARE_API_TOKEN?: string;
	[key: string]: unknown;
}

interface CloudflareContext {
	env: CloudflareEnv;
	ctx: ExecutionContext;
}

interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
}

const cloudflareContextStorage = new AsyncLocalStorage<CloudflareContext>();

export function getCloudflareContext(): CloudflareContext | undefined {
	return cloudflareContextStorage.getStore();
}

export function getCloudflareEnv(): CloudflareEnv | undefined {
	return cloudflareContextStorage.getStore()?.env;
}

export function runWithCloudflareContext<T>(
	context: CloudflareContext,
	callback: () => T,
): T {
	return cloudflareContextStorage.run(context, callback);
}

// Fallback when AsyncLocalStorage is not available
let globalEnv: CloudflareEnv | undefined;

export function setGlobalEnv(env: CloudflareEnv): void {
	globalEnv = env;
}

/**
 * Priority:
 * 1. Value set by setGlobalEnv
 * 2. Read from process.env (for Node.js environment)
 */
export function getGlobalEnv(): CloudflareEnv | undefined {
	if (globalEnv) {
		return globalEnv;
	}

	// Read from process.env in Node.js environment
	if (process?.env) {
		return {
			EXTERNAL_IMAGE_RENDERER_URL: process.env.EXTERNAL_IMAGE_RENDERER_URL,
			SHORT_LINKS_ENABLED: process.env.SHORT_LINKS_ENABLED,
			CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
			CLOUDFLARE_KV_NAMESPACE_ID: process.env.CLOUDFLARE_KV_NAMESPACE_ID,
			CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
		};
	}

	return undefined;
}
