/**
 * SettingsActions hook
 */

import { useMemo } from "react";
import { createSettingsActions, type SettingsActions } from "../store/actions";
import { getSettingsStore } from "../store/settingsStore";

/**
 * Get settings actions
 */
export function useSettingsActions(): SettingsActions {
	const store = getSettingsStore();

	return useMemo(() => createSettingsActions(store), [store]);
}
