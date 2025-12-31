/**
 * SettingsStore シングルトンインスタンス管理
 */

import { Store } from "@tanstack/store";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "../types";
import type { SettingsState, SettingsStore } from "./types";

/** シングルトンインスタンス */
let store: SettingsStore | null = null;

/**
 * SettingsStoreを作成
 * 既存のストアがある場合は上書き
 */
export function createSettingsStore(
	initialState: SettingsState,
): SettingsStore {
	store = new Store<SettingsState>(initialState);
	return store;
}

/**
 * SettingsStoreを取得
 * ストアが未初期化の場合はエラー
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
 * SettingsStoreを安全に取得（null許容）
 * タイミング問題が発生する可能性がある場所で使用
 */
export function getSettingsStoreSafe(): SettingsStore | null {
	return store;
}

// ============================================
// Provider外でも使用可能なヘルパー関数
// ============================================

/**
 * localStorageから設定を読み込む
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
		// パースエラーの場合はデフォルトを返す
	}
	return DEFAULT_SETTINGS;
}

/**
 * デバッグモードの状態を取得（Provider外でも使用可能）
 * ストアが初期化されている場合はストアから、そうでない場合はlocalStorageから取得
 */
export function getDebugMode(): boolean {
	if (store) {
		return store.state.debugMode;
	}
	return loadSettingsFromStorage().debugMode;
}

/**
 * デバッグモードの状態を設定（Provider外でも使用可能）
 * ストアが初期化されている場合はストアを更新、そうでない場合はlocalStorageを直接更新
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
