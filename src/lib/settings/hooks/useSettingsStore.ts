/**
 * SettingsStore hooks
 */

import { useStore } from "@tanstack/react-store";
import { getSettingsStore } from "../store/settingsStore";
import type { SettingsState } from "../store/types";
import type { AppSettings } from "../types";

/**
 * Subscribe to a portion of the store using a selector
 */
export function useSettingsSelector<T>(
	selector: (state: SettingsState) => T,
): T {
	const store = getSettingsStore();
	return useStore(store, selector);
}

/**
 * Pre-defined selectors
 */
export const selectors = {
	/** All settings */
	settings: (s: SettingsState): AppSettings => s,

	/** Debug mode */
	debugMode: (s: SettingsState): boolean => s.debugMode,
} as const;

/** Get all settings */
export function useAppSettings(): AppSettings {
	return useSettingsSelector(selectors.settings);
}

/** Get debug mode */
export function useDebugMode(): boolean {
	return useSettingsSelector(selectors.debugMode);
}
