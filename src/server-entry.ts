/**
 * カスタムサーバーエントリポイント
 * Cloudflare Workers の env を保存してから TanStack Start のハンドラーを呼び出す
 * JSON形式のアクセスログを出力
 */

// TanStack Start のデフォルトエントリをインポート
// @ts-expect-error TanStack Start のエントリポイント
import tanstackEntry from "@tanstack/react-start/server-entry";
import { createLogContext, logResponse } from "./lib/server/accessLog";
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
		// アクセスログ用のコンテキストを作成
		const logContext = createLogContext(request);

		// env をグローバルに保存
		setGlobalEnv(env);

		try {
			// TanStack Start のハンドラーを呼び出す
			const response = await tanstackEntry.fetch(request, env, ctx);

			// アクセスログを出力
			logResponse(logContext, response);

			return response;
		} catch (error) {
			// エラー時のログ出力
			const errorResponse = new Response("Internal Server Error", {
				status: 500,
			});
			logResponse(logContext, errorResponse);
			throw error;
		}
	},
};
