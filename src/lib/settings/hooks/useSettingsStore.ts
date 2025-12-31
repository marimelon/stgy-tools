/**
 * SettingsStore フック
 */

import { useStore } from "@tanstack/react-store";
import { getSettingsStore } from "../store/settingsStore";
import type { SettingsState } from "../store/types";
import type { AppSettings } from "../types";

/**
 * セレクタを使用してストアの一部を購読
 */
export function useSettingsSelector<T>(
	selector: (state: SettingsState) => T,
): T {
	const store = getSettingsStore();
	return useStore(store, selector);
}

/**
 * 事前定義セレクタ
 */
export const selectors = {
	/** 全設定 */
	settings: (s: SettingsState): AppSettings => s,

	/** デバッグモード */
	debugMode: (s: SettingsState): boolean => s.debugMode,
} as const;

// ============================================
// 便利フック
// ============================================

/** 全設定を取得 */
export function useAppSettings(): AppSettings {
	return useSettingsSelector(selectors.settings);
}

/** デバッグモードを取得 */
export function useDebugMode(): boolean {
	return useSettingsSelector(selectors.debugMode);
}
