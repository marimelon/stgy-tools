/**
 * Short link functionality
 *
 * Storage abstraction allows support for backends other than KV
 */

import { getGlobalEnv } from "../cloudflareContext";
import {
	generateEditKey,
	generateGroupId,
	generateShortId,
	hashEditKey,
	isValidCustomEditKey,
	isValidEditKey,
	isValidGroupId,
	isValidShortId,
	isValidStgyCode,
	verifyEditKey,
} from "./idGenerator";
import { KVApiShortLinkStorage } from "./kvApiStorage";
import { type KVNamespace, KVShortLinkStorage } from "./kvStorage";
import { NullShortLinkStorage, type ShortLinkStorage } from "./storage";
import {
	type BoardGroupData,
	type BoardGroupVersion,
	type CreateGroupResponse,
	type CreateShortLinkResponse,
	type ShortLinkData,
	type ShortLinkErrorCode,
	safeParseBoardGroupData,
	safeParseBoardGroupHistory,
	type UpdateGroupResponse,
} from "./types";

export type { ShortLinkStorage } from "./storage";
export type {
	BoardGroupData,
	BoardGroupVersion,
	CreateGroupResponse,
	CreateShortLinkResponse,
	ShortLinkData,
	ShortLinkErrorCode,
	UpdateGroupResponse,
} from "./types";

const MAX_RETRY_ATTEMPTS = 10;

let cachedStorage: ShortLinkStorage | null = null;
let cachedStorageKey: string | null = null;

/**
 * Only enabled when SHORT_LINKS_ENABLED env var is "true"
 */
export function isShortLinksEnabled(): boolean {
	const env = getGlobalEnv();
	return env?.SHORT_LINKS_ENABLED === "true";
}

function getStorageCacheKey(): string {
	const env = getGlobalEnv();
	return JSON.stringify({
		enabled: env?.SHORT_LINKS_ENABLED,
		kvBinding: Boolean(env?.SHORT_LINKS),
		accountId: env?.CLOUDFLARE_ACCOUNT_ID,
		namespaceId: env?.CLOUDFLARE_KV_NAMESPACE_ID,
		apiToken: env?.CLOUDFLARE_API_TOKEN ? "***" : undefined,
	});
}

/**
 * Get storage based on current environment (singleton)
 *
 * Priority:
 * 1. Workers direct binding (SHORT_LINKS)
 * 2. KV REST API (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_KV_NAMESPACE_ID, CLOUDFLARE_API_TOKEN)
 * 3. Null storage (storage unavailable)
 */
export function getShortLinkStorage(): ShortLinkStorage {
	const cacheKey = getStorageCacheKey();
	if (cachedStorage && cachedStorageKey === cacheKey) {
		return cachedStorage;
	}

	const env = getGlobalEnv();
	let storage: ShortLinkStorage;

	if (!isShortLinksEnabled()) {
		storage = new NullShortLinkStorage();
	} else if (env?.SHORT_LINKS) {
		storage = new KVShortLinkStorage(env.SHORT_LINKS as KVNamespace);
	} else if (
		env?.CLOUDFLARE_ACCOUNT_ID &&
		env.CLOUDFLARE_KV_NAMESPACE_ID &&
		env.CLOUDFLARE_API_TOKEN
	) {
		storage = new KVApiShortLinkStorage({
			accountId: env.CLOUDFLARE_ACCOUNT_ID,
			namespaceId: env.CLOUDFLARE_KV_NAMESPACE_ID,
			apiToken: env.CLOUDFLARE_API_TOKEN,
		});
	} else {
		storage = new NullShortLinkStorage();
	}

	cachedStorage = storage;
	cachedStorageKey = cacheKey;
	return storage;
}

export async function resolveShortId(
	shortId: string,
): Promise<ShortLinkData | null> {
	if (!isValidShortId(shortId)) {
		return null;
	}

	const storage = getShortLinkStorage();
	if (!storage.isAvailable()) {
		return null;
	}

	return storage.get(shortId);
}

export async function createShortLink(
	stgy: string,
	baseUrl: string,
): Promise<CreateShortLinkResponse> {
	const storage = getShortLinkStorage();

	if (!storage.isAvailable()) {
		const viewerUrl = `${baseUrl}/?stgy=${encodeURIComponent(stgy)}`;
		return { id: "", url: viewerUrl, viewerUrl, fallback: true };
	}

	if (!isValidStgyCode(stgy)) {
		throw new ShortLinkError("Invalid stgy code format", "INVALID_STGY");
	}

	let id: string | null = null;
	for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
		const candidateId = await generateShortId(stgy, attempt);
		const existing = await storage.get(candidateId);

		if (!existing) {
			await storage.save(candidateId, {
				stgy,
				createdAt: new Date().toISOString(),
			});
			id = candidateId;
			break;
		}

		if (existing.stgy === stgy) {
			id = candidateId;
			break;
		}
		// Hash collision, retry
	}

	if (!id) {
		throw new ShortLinkError(
			"Failed to generate unique ID after max retries",
			"STORAGE_ERROR",
		);
	}

	const viewerUrl = `${baseUrl}/?stgy=${encodeURIComponent(stgy)}`;
	return {
		id,
		url: `${baseUrl}/?s=${id}`,
		viewerUrl,
	};
}

export class ShortLinkError extends Error {
	code: ShortLinkErrorCode;

	constructor(message: string, code: ShortLinkErrorCode) {
		super(message);
		this.name = "ShortLinkError";
		this.code = code;
	}
}

// --- Board Group functions ---

const GROUP_KEY_PREFIX = "g:";
const GROUP_HISTORY_SUFFIX = ":history";
const MAX_GROUP_BOARDS = 30;
const MAX_GROUP_HISTORY = 10;
const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;

/**
 * Sanitize user input text by removing control characters (except newline and tab)
 */
function sanitizeText(text: string): string {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally matching control characters to remove them
	return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

export async function resolveGroupId(
	groupId: string,
): Promise<BoardGroupData | null> {
	if (!isValidGroupId(groupId)) {
		return null;
	}

	const storage = getShortLinkStorage();
	if (!storage.isAvailable()) {
		return null;
	}

	const data = await storage.get(`${GROUP_KEY_PREFIX}${groupId}`);
	if (!data) return null;

	// Parse and validate BoardGroupData (stored as JSON string in stgy field)
	return safeParseBoardGroupData(data.stgy);
}

export async function createGroup(
	name: string,
	stgyCodes: string[],
	baseUrl: string,
	description?: string,
	customEditKey?: string,
): Promise<CreateGroupResponse> {
	const storage = getShortLinkStorage();

	// Build fallback URL with individual stgy params
	const viewerUrl = `${baseUrl}/?${stgyCodes.map((code) => `stgy=${encodeURIComponent(code)}`).join("&")}`;

	if (!storage.isAvailable()) {
		return { id: "", url: viewerUrl, viewerUrl, fallback: true };
	}

	// Validation and sanitization
	const sanitizedName = sanitizeText(name.trim()).slice(0, MAX_NAME_LENGTH);
	if (!sanitizedName) {
		throw new ShortLinkError("Group name is required", "INVALID_NAME");
	}

	const sanitizedDescription = description
		? sanitizeText(description.trim()).slice(0, MAX_DESCRIPTION_LENGTH) ||
			undefined
		: undefined;

	if (stgyCodes.length === 0) {
		throw new ShortLinkError("At least one board is required", "INVALID_STGY");
	}

	if (stgyCodes.length > MAX_GROUP_BOARDS) {
		throw new ShortLinkError(
			`Maximum ${MAX_GROUP_BOARDS} boards allowed`,
			"INVALID_STGY",
		);
	}

	// Validate all stgy codes
	for (const stgy of stgyCodes) {
		if (!isValidStgyCode(stgy)) {
			throw new ShortLinkError("Invalid stgy code format", "INVALID_STGY");
		}
	}

	// Validate custom edit key if provided
	if (customEditKey !== undefined && !isValidCustomEditKey(customEditKey)) {
		throw new ShortLinkError(
			"Edit key must be 4-64 characters",
			"INVALID_EDIT_KEY",
		);
	}

	// Use custom edit key or generate one
	const editKey = customEditKey ?? (await generateEditKey());
	const editKeyHash = await hashEditKey(editKey);

	// Generate unique random group ID (retry on collision)
	let id: string | null = null;

	for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
		const candidateId = await generateGroupId();
		const existing = await storage.get(`${GROUP_KEY_PREFIX}${candidateId}`);

		if (!existing) {
			const now = new Date().toISOString();
			const groupData: BoardGroupData = {
				name: sanitizedName,
				description: sanitizedDescription,
				stgyCodes,
				createdAt: now,
				editKeyHash,
				version: 1,
			};

			// Store as JSON string in stgy field (reusing ShortLinkData structure)
			await storage.save(`${GROUP_KEY_PREFIX}${candidateId}`, {
				stgy: JSON.stringify(groupData),
				createdAt: groupData.createdAt,
			});
			id = candidateId;
			break;
		}
		// ID collision - retry with new random ID
	}

	if (!id) {
		throw new ShortLinkError(
			"Failed to generate unique ID after max retries",
			"STORAGE_ERROR",
		);
	}

	return {
		id,
		url: `${baseUrl}/?g=${id}`,
		viewerUrl,
		editKey,
	};
}

export async function updateGroup(
	groupId: string,
	editKey: string,
	updates: {
		name?: string;
		description?: string;
		stgyCodes?: string[];
	},
): Promise<UpdateGroupResponse> {
	if (!isValidGroupId(groupId)) {
		throw new ShortLinkError("Invalid group ID", "NOT_FOUND");
	}

	if (!isValidEditKey(editKey) && !isValidCustomEditKey(editKey)) {
		throw new ShortLinkError("Invalid edit key format", "INVALID_EDIT_KEY");
	}

	const storage = getShortLinkStorage();
	if (!storage.isAvailable()) {
		throw new ShortLinkError("Storage unavailable", "STORAGE_UNAVAILABLE");
	}

	// Get existing group data
	const existing = await storage.get(`${GROUP_KEY_PREFIX}${groupId}`);
	if (!existing) {
		throw new ShortLinkError("Group not found", "NOT_FOUND");
	}

	const groupData = safeParseBoardGroupData(existing.stgy);
	if (!groupData) {
		throw new ShortLinkError("Corrupted group data", "STORAGE_ERROR");
	}

	// Verify edit key
	if (!groupData.editKeyHash) {
		throw new ShortLinkError("Group is not editable", "INVALID_EDIT_KEY");
	}

	const isValid = await verifyEditKey(editKey, groupData.editKeyHash);
	if (!isValid) {
		throw new ShortLinkError("Invalid edit key", "INVALID_EDIT_KEY");
	}

	// Sanitize updates
	const sanitizedName = updates.name
		? sanitizeText(updates.name.trim()).slice(0, MAX_NAME_LENGTH)
		: undefined;
	const sanitizedDescription =
		updates.description !== undefined
			? sanitizeText(updates.description.trim()).slice(
					0,
					MAX_DESCRIPTION_LENGTH,
				) || undefined
			: undefined;

	// Check if there are actual changes
	const hasNameChange =
		sanitizedName !== undefined && sanitizedName !== groupData.name;
	const hasDescriptionChange =
		updates.description !== undefined &&
		sanitizedDescription !== groupData.description;
	const hasStgyCodesChange =
		updates.stgyCodes !== undefined &&
		(updates.stgyCodes.length !== groupData.stgyCodes.length ||
			!updates.stgyCodes.every((code, i) => code === groupData.stgyCodes[i]));

	// If no actual changes, just return current version (key verification only)
	if (!hasNameChange && !hasDescriptionChange && !hasStgyCodesChange) {
		return {
			version: groupData.version,
			updatedAt: groupData.updatedAt || groupData.createdAt,
		};
	}

	// Validate updates
	if (sanitizedName !== undefined && !sanitizedName) {
		throw new ShortLinkError("Group name is required", "INVALID_NAME");
	}

	if (updates.stgyCodes !== undefined) {
		if (updates.stgyCodes.length === 0) {
			throw new ShortLinkError(
				"At least one board is required",
				"INVALID_STGY",
			);
		}
		if (updates.stgyCodes.length > MAX_GROUP_BOARDS) {
			throw new ShortLinkError(
				`Maximum ${MAX_GROUP_BOARDS} boards allowed`,
				"INVALID_STGY",
			);
		}
		for (const stgy of updates.stgyCodes) {
			if (!isValidStgyCode(stgy)) {
				throw new ShortLinkError("Invalid stgy code format", "INVALID_STGY");
			}
		}
	}

	// Save current version to history before updating
	const historyKey = `${GROUP_KEY_PREFIX}${groupId}${GROUP_HISTORY_SUFFIX}`;
	let history: BoardGroupVersion[] = [];

	const historyData = await storage.get(historyKey);
	if (historyData) {
		const parsed = safeParseBoardGroupHistory(historyData.stgy);
		if (parsed) {
			history = parsed;
		}
		// If parsing fails, start fresh with empty history
	}

	// Add current version to history
	const currentVersion: BoardGroupVersion = {
		version: groupData.version,
		name: groupData.name,
		description: groupData.description,
		stgyCodes: groupData.stgyCodes,
		updatedAt: groupData.updatedAt || groupData.createdAt,
	};
	history.push(currentVersion);

	// Trim history to max size (keep most recent)
	if (history.length > MAX_GROUP_HISTORY) {
		history = history.slice(-MAX_GROUP_HISTORY);
	}

	// Save history
	await storage.save(historyKey, {
		stgy: JSON.stringify(history),
		createdAt: new Date().toISOString(),
	});

	// Update group data
	const now = new Date().toISOString();
	const updatedData: BoardGroupData = {
		...groupData,
		name: sanitizedName ?? groupData.name,
		description:
			updates.description !== undefined
				? sanitizedDescription
				: groupData.description,
		stgyCodes: updates.stgyCodes ?? groupData.stgyCodes,
		version: groupData.version + 1,
		updatedAt: now,
	};

	await storage.save(`${GROUP_KEY_PREFIX}${groupId}`, {
		stgy: JSON.stringify(updatedData),
		createdAt: groupData.createdAt,
	});

	return {
		version: updatedData.version,
		updatedAt: now,
	};
}

/**
 * Verify edit key without making any changes
 * Returns true if the key is valid, false otherwise
 */
export async function verifyGroupEditKey(
	groupId: string,
	editKey: string,
): Promise<boolean> {
	if (!isValidGroupId(groupId)) {
		return false;
	}

	if (!isValidEditKey(editKey) && !isValidCustomEditKey(editKey)) {
		return false;
	}

	const storage = getShortLinkStorage();
	if (!storage.isAvailable()) {
		return false;
	}

	const existing = await storage.get(`${GROUP_KEY_PREFIX}${groupId}`);
	if (!existing) {
		return false;
	}

	const groupData = safeParseBoardGroupData(existing.stgy);
	if (!groupData) {
		return false;
	}

	if (!groupData.editKeyHash) {
		return false;
	}

	return await verifyEditKey(editKey, groupData.editKeyHash);
}

export async function getGroupHistory(
	groupId: string,
): Promise<BoardGroupVersion[] | null> {
	if (!isValidGroupId(groupId)) {
		return null;
	}

	const storage = getShortLinkStorage();
	if (!storage.isAvailable()) {
		return null;
	}

	const historyKey = `${GROUP_KEY_PREFIX}${groupId}${GROUP_HISTORY_SUFFIX}`;
	const historyData = await storage.get(historyKey);

	if (!historyData) {
		return [];
	}

	return safeParseBoardGroupHistory(historyData.stgy) ?? [];
}

/**
 * Delete a group and its history
 * Requires valid edit key for authorization
 */
export async function deleteGroup(
	groupId: string,
	editKey: string,
): Promise<void> {
	if (!isValidGroupId(groupId)) {
		throw new ShortLinkError("Invalid group ID", "NOT_FOUND");
	}

	if (!isValidEditKey(editKey) && !isValidCustomEditKey(editKey)) {
		throw new ShortLinkError("Invalid edit key format", "INVALID_EDIT_KEY");
	}

	const storage = getShortLinkStorage();
	if (!storage.isAvailable()) {
		throw new ShortLinkError("Storage unavailable", "STORAGE_UNAVAILABLE");
	}

	const existing = await storage.get(`${GROUP_KEY_PREFIX}${groupId}`);
	if (!existing) {
		throw new ShortLinkError("Group not found", "NOT_FOUND");
	}

	const groupData = safeParseBoardGroupData(existing.stgy);
	if (!groupData) {
		throw new ShortLinkError("Invalid group data", "STORAGE_ERROR");
	}

	// Verify edit key
	if (!groupData.editKeyHash) {
		throw new ShortLinkError("Group is not editable", "INVALID_EDIT_KEY");
	}

	const isValid = await verifyEditKey(editKey, groupData.editKeyHash);
	if (!isValid) {
		throw new ShortLinkError("Invalid edit key", "INVALID_EDIT_KEY");
	}

	// Delete group data and history
	await storage.delete(`${GROUP_KEY_PREFIX}${groupId}`);
	await storage.delete(`${GROUP_KEY_PREFIX}${groupId}${GROUP_HISTORY_SUFFIX}`);
}
