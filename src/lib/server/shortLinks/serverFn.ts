/**
 * 短縮リンク用サーバー関数
 *
 * createServerFn を使用してサーバーのみで実行される関数を定義
 * loaderからも安全に呼び出し可能
 */

import { createServerFn } from "@tanstack/react-start";
import {
	createShortLink,
	isShortLinksEnabled,
	resolveShortId,
	ShortLinkError,
} from "./index";
import type { CreateShortLinkResponse, ShortLinkData } from "./types";

/**
 * 短縮IDからstgyコードを解決するサーバー関数
 */
export const resolveShortIdFn = createServerFn({ method: "GET" })
	.inputValidator((data: { shortId: string }) => data)
	.handler(async ({ data }): Promise<ShortLinkData | null> => {
		return resolveShortId(data.shortId);
	});

export type CreateShortLinkResult =
	| { success: true; data: CreateShortLinkResponse }
	| { success: false; error: string; code: string };

/**
 * 短縮リンクを作成するサーバー関数
 */
export const createShortLinkFn = createServerFn({ method: "POST" })
	.inputValidator((data: { stgy: string; baseUrl: string }) => data)
	.handler(async ({ data }): Promise<CreateShortLinkResult> => {
		if (!isShortLinksEnabled()) {
			return {
				success: false,
				error: "Short links feature is disabled",
				code: "FEATURE_DISABLED",
			};
		}

		try {
			const result = await createShortLink(data.stgy, data.baseUrl);
			return { success: true, data: result };
		} catch (error) {
			if (error instanceof ShortLinkError) {
				return { success: false, error: error.message, code: error.code };
			}
			const message = error instanceof Error ? error.message : "Unknown error";
			return { success: false, error: message, code: "STORAGE_ERROR" };
		}
	});
