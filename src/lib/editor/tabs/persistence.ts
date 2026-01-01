/**
 * Tab state persistence to localStorage
 */

import {
	type PersistedTabState,
	TABS_SAVE_DEBOUNCE_MS,
	TABS_STORAGE_KEY,
	type TabState,
} from "./types";

/**
 * Load tab state from localStorage
 */
export function loadTabState(): PersistedTabState | null {
	try {
		const saved = localStorage.getItem(TABS_STORAGE_KEY);
		if (!saved) return null;

		const parsed = JSON.parse(saved) as unknown;

		// Validate structure
		if (
			typeof parsed !== "object" ||
			parsed === null ||
			!Array.isArray((parsed as PersistedTabState).openTabs)
		) {
			return null;
		}

		const state = parsed as PersistedTabState;

		// Validate array contents
		if (!state.openTabs.every((id) => typeof id === "string")) {
			return null;
		}

		// Validate activeTabId
		if (state.activeTabId !== null && typeof state.activeTabId !== "string") {
			return null;
		}

		return state;
	} catch {
		return null;
	}
}

/**
 * Save tab state to localStorage (debounced internally)
 */
let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function saveTabState(state: TabState): void {
	if (saveTimeoutId) {
		clearTimeout(saveTimeoutId);
	}

	saveTimeoutId = setTimeout(() => {
		try {
			const toSave: PersistedTabState = {
				openTabs: state.openTabs,
				activeTabId: state.activeTabId,
			};
			localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(toSave));
		} catch (error) {
			console.warn("Failed to save tab state:", error);
		}
		saveTimeoutId = null;
	}, TABS_SAVE_DEBOUNCE_MS);
}

/**
 * Save tab state immediately (without debounce)
 */
export function saveTabStateImmediate(state: TabState): void {
	if (saveTimeoutId) {
		clearTimeout(saveTimeoutId);
		saveTimeoutId = null;
	}

	try {
		const toSave: PersistedTabState = {
			openTabs: state.openTabs,
			activeTabId: state.activeTabId,
		};
		localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(toSave));
	} catch (error) {
		console.warn("Failed to save tab state:", error);
	}
}

/**
 * Clear tab state from localStorage
 */
export function clearTabState(): void {
	try {
		localStorage.removeItem(TABS_STORAGE_KEY);
	} catch {
		// Ignore errors
	}
}
