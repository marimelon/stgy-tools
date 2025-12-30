/**
 * カスタムサーバーエントリポイント
 * Cloudflare Workers の env を保存してから TanStack Start のハンドラーを呼び出す
 */

// TanStack Start のデフォルトエントリをインポート
import tanstackEntry from "@tanstack/react-start/server-entry";
import {
	type CloudflareEnv,
	setGlobalEnv,
} from "./lib/server/cloudflareContext";

interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
}

export default {
	async fetch(
		request: Request,
		env: CloudflareEnv,
		ctx: ExecutionContext,
	): Promise<Response> {
		// env をグローバルに保存
		setGlobalEnv(env);

		console.log("[server-entry] Cloudflare env available:", !!env);
		console.log("[server-entry] ASSETS available:", !!env?.ASSETS);

		// TanStack Start のハンドラーを呼び出す
		// @ts-expect-error TanStack Start with Cloudflare Workers env and ctx
		return tanstackEntry.fetch(request, env, ctx);
	},
};
