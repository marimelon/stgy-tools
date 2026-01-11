/**
 * Short link type definitions
 */

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
	| "INVALID_STGY"
	| "RATE_LIMITED"
	| "STORAGE_ERROR"
	| "NOT_FOUND"
	| "STORAGE_UNAVAILABLE";
