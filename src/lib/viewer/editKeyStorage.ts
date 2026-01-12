/**
 * Edit key storage for localStorage persistence
 *
 * Stores edit keys per groupId so users don't have to re-enter them on page reload.
 */

const EDIT_KEYS_STORAGE_KEY = "strategy-board-edit-keys";

interface StoredEditKeys {
	[groupId: string]: string;
}

function getStoredEditKeys(): StoredEditKeys {
	if (typeof window === "undefined") return {};

	try {
		const stored = localStorage.getItem(EDIT_KEYS_STORAGE_KEY);
		if (!stored) return {};
		return JSON.parse(stored) as StoredEditKeys;
	} catch {
		return {};
	}
}

function setStoredEditKeys(keys: StoredEditKeys): void {
	if (typeof window === "undefined") return;

	try {
		if (Object.keys(keys).length === 0) {
			localStorage.removeItem(EDIT_KEYS_STORAGE_KEY);
		} else {
			localStorage.setItem(EDIT_KEYS_STORAGE_KEY, JSON.stringify(keys));
		}
	} catch {
		// Ignore storage errors
	}
}

/**
 * Get stored edit key for a group
 */
export function getStoredEditKey(groupId: string): string | null {
	const keys = getStoredEditKeys();
	return keys[groupId] ?? null;
}

/**
 * Save edit key for a group
 */
export function saveEditKey(groupId: string, editKey: string): void {
	const keys = getStoredEditKeys();
	keys[groupId] = editKey;
	setStoredEditKeys(keys);
}

/**
 * Remove edit key for a group
 */
export function removeEditKey(groupId: string): void {
	const keys = getStoredEditKeys();
	delete keys[groupId];
	setStoredEditKeys(keys);
}

/**
 * Clear all stored edit keys
 */
export function clearAllEditKeys(): void {
	setStoredEditKeys({});
}
