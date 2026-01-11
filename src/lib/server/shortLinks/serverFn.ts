/**
 * Short link server functions
 *
 * Defines server-only functions using createServerFn.
 * Safe to call from loaders.
 */

import { createServerFn } from "@tanstack/react-start";
import {
	createShortLink,
	isShortLinksEnabled,
	resolveShortId,
	ShortLinkError,
} from "./index";
import type { CreateShortLinkResponse, ShortLinkData } from "./types";

export const resolveShortIdFn = createServerFn({ method: "GET" })
	.inputValidator((data: { shortId: string }) => data)
	.handler(async ({ data }): Promise<ShortLinkData | null> => {
		return resolveShortId(data.shortId);
	});

export type CreateShortLinkResult =
	| { success: true; data: CreateShortLinkResponse }
	| { success: false; error: string; code: string };

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
