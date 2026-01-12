/**
 * Short link type definitions
 */

import { z } from "zod";

export interface ShortLinkData {
	stgy: string;
	/** Creation timestamp (ISO 8601) */
	createdAt: string;
	/** Access count (optional, not supported by all storage backends) */
	accessCount?: number;
}

export interface CreateShortLinkRequest {
	stgy: string;
}

export interface CreateShortLinkResponse {
	id: string;
	/** Full short URL */
	url: string;
	/** Viewer URL (for fallback) */
	viewerUrl: string;
	/** Whether in fallback mode */
	fallback?: boolean;
}

export interface ShortLinkErrorResponse {
	error: string;
	code: ShortLinkErrorCode;
}

export type ShortLinkErrorCode =
	| "FEATURE_DISABLED"
	| "INVALID_STGY"
	| "INVALID_NAME"
	| "INVALID_EDIT_KEY"
	| "RATE_LIMITED"
	| "STORAGE_ERROR"
	| "NOT_FOUND"
	| "STORAGE_UNAVAILABLE";

/**
 * Board group data stored in KV
 */
export interface BoardGroupData {
	/** Group display name */
	name: string;
	/** Optional description */
	description?: string;
	/** Array of stgy codes */
	stgyCodes: string[];
	/** Creation timestamp (ISO 8601) */
	createdAt: string;
	/** Access count (optional) */
	accessCount?: number;
	/** SHA-256 hash of edit key (for authentication) */
	editKeyHash?: string;
	/** Current version number (starts at 1) */
	version: number;
	/** Last update timestamp (ISO 8601) */
	updatedAt?: string;
}

/**
 * A snapshot of group data at a specific version (for history)
 */
export interface BoardGroupVersion {
	/** Version number */
	version: number;
	/** Group name at this version */
	name: string;
	/** Description at this version */
	description?: string;
	/** Stgy codes at this version */
	stgyCodes: string[];
	/** Timestamp when this version was created */
	updatedAt: string;
}

export interface CreateGroupRequest {
	name: string;
	description?: string;
	stgyCodes: string[];
}

export interface CreateGroupResponse {
	id: string;
	/** Full group URL */
	url: string;
	/** Viewer URL (for fallback, with individual stgy params) */
	viewerUrl: string;
	/** Whether in fallback mode */
	fallback?: boolean;
	/** Edit key (plaintext, only returned on creation) */
	editKey?: string;
}

export interface UpdateGroupRequest {
	groupId: string;
	editKey: string;
	name?: string;
	description?: string;
	stgyCodes?: string[];
}

export interface UpdateGroupResponse {
	version: number;
	updatedAt: string;
}

// --- Zod Schemas for runtime validation ---

/**
 * Schema for BoardGroupData stored in KV
 */
export const BoardGroupDataSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	stgyCodes: z.array(z.string()),
	createdAt: z.string(),
	accessCount: z.number().optional(),
	editKeyHash: z.string().optional(),
	version: z.number(),
	updatedAt: z.string().optional(),
});

/**
 * Schema for BoardGroupVersion (history entry)
 */
export const BoardGroupVersionSchema = z.object({
	version: z.number(),
	name: z.string(),
	description: z.string().optional(),
	stgyCodes: z.array(z.string()),
	updatedAt: z.string(),
});

/**
 * Schema for history array
 */
export const BoardGroupHistorySchema = z.array(BoardGroupVersionSchema);

/**
 * Parse and validate BoardGroupData from JSON string
 * @throws Error if validation fails
 */
export function parseBoardGroupData(json: string): BoardGroupData {
	const parsed = JSON.parse(json);
	return BoardGroupDataSchema.parse(parsed);
}

/**
 * Parse and validate BoardGroupVersion array from JSON string
 * @throws Error if validation fails
 */
export function parseBoardGroupHistory(json: string): BoardGroupVersion[] {
	const parsed = JSON.parse(json);
	return BoardGroupHistorySchema.parse(parsed);
}

/**
 * Safely parse BoardGroupData, returning null on failure
 */
export function safeParseBoardGroupData(json: string): BoardGroupData | null {
	try {
		const parsed = JSON.parse(json);
		const result = BoardGroupDataSchema.safeParse(parsed);
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

/**
 * Safely parse BoardGroupVersion array, returning null on failure
 */
export function safeParseBoardGroupHistory(
	json: string,
): BoardGroupVersion[] | null {
	try {
		const parsed = JSON.parse(json);
		const result = BoardGroupHistorySchema.safeParse(parsed);
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}
