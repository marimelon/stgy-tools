/**
 * Cloudflare Workers の env をグローバルに保存・取得するためのユーティリティ
 * AsyncLocalStorage を使用してリクエストごとに独立したコンテキストを保持
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type { AssetsBinding } from "./imageLoader";

export interface CloudflareEnv {
	ASSETS?: AssetsBinding;
	/**
	 * 外部画像レンダラーのURL
	 * 設定されている場合、PNG生成を外部サーバーに委譲する
	 * 例: "https://render.example.com/image"
	 */
	EXTERNAL_IMAGE_RENDERER_URL?: string;
	/**
	 * 短縮リンク機能の有効/無効
	 * "true" で有効化、それ以外または未設定で無効
	 */
	SHORT_LINKS_ENABLED?: string;
	/**
	 * 短縮リンク用 Cloudflare KV Namespace (Workers直接バインディング)
	 * wrangler.jsonc で binding: "SHORT_LINKS" として設定
	 */
	SHORT_LINKS?: unknown;
	/**
	 * Cloudflare Account ID (KV REST API用)
	 */
	CLOUDFLARE_ACCOUNT_ID?: string;
	/**
	 * Cloudflare KV Namespace ID (KV REST API用)
	 */
	CLOUDFLARE_KV_NAMESPACE_ID?: string;
	/**
	 * Cloudflare API Token (KV REST API用)
	 * Account.Workers KV Storage 権限が必要
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

// AsyncLocalStorage を使用してリクエストごとのコンテキストを保存
const cloudflareContextStorage = new AsyncLocalStorage<CloudflareContext>();

/**
 * 現在のリクエストの Cloudflare コンテキストを取得
 */
export function getCloudflareContext(): CloudflareContext | undefined {
	return cloudflareContextStorage.getStore();
}

/**
 * 現在のリクエストの env を取得
 */
export function getCloudflareEnv(): CloudflareEnv | undefined {
	return cloudflareContextStorage.getStore()?.env;
}

/**
 * Cloudflare コンテキストを設定してコールバックを実行
 */
export function runWithCloudflareContext<T>(
	context: CloudflareContext,
	callback: () => T,
): T {
	return cloudflareContextStorage.run(context, callback);
}

/**
 * グローバルな env ストレージ（AsyncLocalStorage が使えない場合のフォールバック）
 */
let globalEnv: CloudflareEnv | undefined;

export function setGlobalEnv(env: CloudflareEnv): void {
	globalEnv = env;
}

/**
 * 環境変数を取得
 *
 * 優先順位:
 * 1. setGlobalEnv で設定された値
 * 2. process.env からの読み取り (Node.js環境用)
 */
export function getGlobalEnv(): CloudflareEnv | undefined {
	if (globalEnv) {
		return globalEnv;
	}

	// Node.js環境の場合は process.env から読み取り
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
