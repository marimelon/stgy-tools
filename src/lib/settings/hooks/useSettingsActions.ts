/**
 * SettingsActions フック
 */

import { useMemo } from "react";
import { createSettingsActions, type SettingsActions } from "../store/actions";
import { getSettingsStore } from "../store/settingsStore";

/**
 * 設定アクションを取得
 */
export function useSettingsActions(): SettingsActions {
	const store = getSettingsStore();

	return useMemo(() => createSettingsActions(store), [store]);
}
