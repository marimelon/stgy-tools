/**
 * Short link server functions
 *
 * Defines server-only functions using createServerFn.
 * Safe to call from loaders.
 */

import { createServerFn } from "@tanstack/react-start";
import {
	createGroup,
	createShortLink,
	deleteGroup,
	getGroupHistory,
	isShortLinksEnabled,
	resolveGroupId,
	resolveShortId,
	ShortLinkError,
	updateGroup,
	verifyGroupEditKey,
} from "./index";
import type {
	BoardGroupData,
	BoardGroupVersion,
	CreateGroupResponse,
	CreateShortLinkResponse,
	ShortLinkData,
	ShortLinkErrorCode,
	UpdateGroupResponse,
} from "./types";

/** Generic error result for server functions */
type ErrorResult = { success: false; error: string; code: ShortLinkErrorCode };

const FEATURE_DISABLED_RESULT: ErrorResult = {
	success: false,
	error: "Short links feature is disabled",
	code: "FEATURE_DISABLED",
};

/** Execute a function with feature flag check and error handling */
async function withFeatureCheck<T>(
	fn: () => Promise<T>,
): Promise<{ success: true; data: T } | ErrorResult> {
	if (!isShortLinksEnabled()) {
		return FEATURE_DISABLED_RESULT;
	}

	try {
		const data = await fn();
		return { success: true, data };
	} catch (error) {
		if (error instanceof ShortLinkError) {
			return { success: false, error: error.message, code: error.code };
		}
		const message = error instanceof Error ? error.message : "Unknown error";
		return { success: false, error: message, code: "STORAGE_ERROR" };
	}
}

export const resolveShortIdFn = createServerFn({ method: "GET" })
	.inputValidator((data: { shortId: string }) => data)
	.handler(async ({ data }): Promise<ShortLinkData | null> => {
		try {
			return await resolveShortId(data.shortId);
		} catch {
			return null;
		}
	});

export type CreateShortLinkResult =
	| { success: true; data: CreateShortLinkResponse }
	| ErrorResult;

export const createShortLinkFn = createServerFn({ method: "POST" })
	.inputValidator((data: { stgy: string; baseUrl: string }) => data)
	.handler(async ({ data }): Promise<CreateShortLinkResult> => {
		return withFeatureCheck(() => createShortLink(data.stgy, data.baseUrl));
	});

// --- Board Group server functions ---

export const resolveGroupIdFn = createServerFn({ method: "GET" })
	.inputValidator((data: { groupId: string }) => data)
	.handler(async ({ data }): Promise<BoardGroupData | null> => {
		try {
			return await resolveGroupId(data.groupId);
		} catch {
			return null;
		}
	});

export type CreateGroupResult =
	| { success: true; data: CreateGroupResponse }
	| ErrorResult;

export const createGroupFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			name: string;
			description?: string;
			stgyCodes: string[];
			baseUrl: string;
			customEditKey?: string;
		}) => data,
	)
	.handler(async ({ data }): Promise<CreateGroupResult> => {
		return withFeatureCheck(() =>
			createGroup(
				data.name,
				data.stgyCodes,
				data.baseUrl,
				data.description,
				data.customEditKey,
			),
		);
	});

export type UpdateGroupResult =
	| { success: true; data: UpdateGroupResponse }
	| ErrorResult;

export const updateGroupFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			groupId: string;
			editKey: string;
			name?: string;
			description?: string;
			stgyCodes?: string[];
		}) => data,
	)
	.handler(async ({ data }): Promise<UpdateGroupResult> => {
		return withFeatureCheck(() =>
			updateGroup(data.groupId, data.editKey, {
				name: data.name,
				description: data.description,
				stgyCodes: data.stgyCodes,
			}),
		);
	});

export const getGroupHistoryFn = createServerFn({ method: "GET" })
	.inputValidator((data: { groupId: string }) => data)
	.handler(async ({ data }): Promise<BoardGroupVersion[] | null> => {
		try {
			return await getGroupHistory(data.groupId);
		} catch {
			return null;
		}
	});

export const verifyGroupEditKeyFn = createServerFn({ method: "POST" })
	.inputValidator((data: { groupId: string; editKey: string }) => data)
	.handler(async ({ data }): Promise<boolean> => {
		if (!isShortLinksEnabled()) {
			return false;
		}
		try {
			return await verifyGroupEditKey(data.groupId, data.editKey);
		} catch {
			// Return false on any error (storage failure, etc.)
			return false;
		}
	});

export type DeleteGroupResult = { success: true } | ErrorResult;

export const deleteGroupFn = createServerFn({ method: "POST" })
	.inputValidator((data: { groupId: string; editKey: string }) => data)
	.handler(async ({ data }): Promise<DeleteGroupResult> => {
		const result = await withFeatureCheck(async () => {
			await deleteGroup(data.groupId, data.editKey);
		});
		if (!result.success) return result;
		return { success: true };
	});
