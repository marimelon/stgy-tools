/**
 * SettingsStore singleton instance management
 */

import { Store } from "@tanstack/store";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "../types";
import type { SettingsState, SettingsStore } from "./types";

/** Singleton instance */
let store: SettingsStore | null = null;

/**
 * Create SettingsStore
 * Overwrites existing store if present
 */
export function createSettingsStore(
	initialState: SettingsState,
): SettingsStore {
	store = new Store<SettingsState>(initialState);
	return store;
}

/**
 * Get SettingsStore
 * Throws if store is not initialized
 */
export function getSettingsStore(): SettingsStore {
	if (!store) {
		throw new Error(
			"Settings store not initialized. Ensure SettingsStoreProvider is mounted.",
		);
	}
	return store;
}

/**
 * Safely get SettingsStore (nullable)
 * Use in places where timing issues may occur
 */
export function getSettingsStoreSafe(): SettingsStore | null {
	return store;
}

/**
 * Load settings from localStorage
 */
export function loadSettingsFromStorage(): SettingsState {
	if (typeof window === "undefined") return DEFAULT_SETTINGS;

	try {
		const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...DEFAULT_SETTINGS, ...parsed };
		}
	} catch {
		// Return defaults on parse error
	}
	return DEFAULT_SETTINGS;
}

/**
 * Get debug mode state (usable outside Provider)
 * Returns from store if initialized, otherwise from localStorage
 */
export function getDebugMode(): boolean {
	if (store) {
		return store.state.debugMode;
	}
	return loadSettingsFromStorage().debugMode;
}

/**
 * Set debug mode state (usable outside Provider)
 * Updates store if initialized, otherwise updates localStorage directly
 */
export function setDebugMode(enabled: boolean): void {
	if (store) {
		store.setState((state) => ({ ...state, debugMode: enabled }));
	} else if (typeof window !== "undefined") {
		const current = loadSettingsFromStorage();
		localStorage.setItem(
			SETTINGS_STORAGE_KEY,
			JSON.stringify({ ...current, debugMode: enabled }),
		);
	}
}
