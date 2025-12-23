/**
 * Cloudflare Workers の env をグローバルに保存・取得するためのユーティリティ
 * AsyncLocalStorage を使用してリクエストごとに独立したコンテキストを保持
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type { AssetsBinding } from "./imageLoader";

export interface CloudflareEnv {
	ASSETS?: AssetsBinding;
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

export function getGlobalEnv(): CloudflareEnv | undefined {
	return globalEnv;
}
