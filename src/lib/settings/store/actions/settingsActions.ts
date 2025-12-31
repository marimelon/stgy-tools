/**
 * 設定アクション
 */

import type { AppSettings } from "../../types";
import { DEFAULT_SETTINGS } from "../../types";
import type { SettingsStore } from "../types";

/**
 * 設定アクションを作成
 */
export function createSettingsActions(store: SettingsStore) {
	/**
	 * 設定を更新
	 */
	const updateSettings = (updates: Partial<AppSettings>) => {
		store.setState((state) => ({
			...state,
			...updates,
		}));
	};

	/**
	 * デバッグモードを切り替え
	 */
	const toggleDebugMode = () => {
		store.setState((state) => ({
			...state,
			debugMode: !state.debugMode,
		}));
	};

	/**
	 * デバッグモードを設定
	 */
	const setDebugMode = (enabled: boolean) => {
		store.setState((state) => ({
			...state,
			debugMode: enabled,
		}));
	};

	/**
	 * デフォルトにリセット
	 */
	const resetSettings = () => {
		store.setState(() => DEFAULT_SETTINGS);
	};

	return {
		updateSettings,
		toggleDebugMode,
		setDebugMode,
		resetSettings,
	};
}

export type SettingsActions = ReturnType<typeof createSettingsActions>;
