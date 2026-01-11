/**
 * Settings actions
 */

import type { AppSettings } from "../../types";
import { DEFAULT_SETTINGS } from "../../types";
import type { SettingsStore } from "../types";

/**
 * Create settings actions
 */
export function createSettingsActions(store: SettingsStore) {
	/**
	 * Update settings
	 */
	const updateSettings = (updates: Partial<AppSettings>) => {
		store.setState((state) => ({
			...state,
			...updates,
		}));
	};

	/**
	 * Set debug mode
	 */
	const setDebugMode = (enabled: boolean) => {
		store.setState((state) => ({
			...state,
			debugMode: enabled,
		}));
	};

	/**
	 * Reset to defaults
	 */
	const resetSettings = () => {
		store.setState(() => DEFAULT_SETTINGS);
	};

	return {
		updateSettings,
		setDebugMode,
		resetSettings,
	};
}

export type SettingsActions = ReturnType<typeof createSettingsActions>;
