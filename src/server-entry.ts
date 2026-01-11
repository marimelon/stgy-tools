/**
 * Custom server entry point.
 * Stores Cloudflare Workers env before invoking TanStack Start handler.
 */

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
		setGlobalEnv(env);

		console.log("[server-entry] Cloudflare env available:", !!env);
		console.log("[server-entry] ASSETS available:", !!env?.ASSETS);

		// @ts-expect-error TanStack Start with Cloudflare Workers env and ctx
		return tanstackEntry.fetch(request, env, ctx);
	},
};
