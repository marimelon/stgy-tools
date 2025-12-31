/**
 * PanelStore シングルトンインスタンス管理
 */

import { Store } from "@tanstack/store";
import type { PanelState, PanelStore } from "./types";

/** シングルトンインスタンス */
let store: PanelStore | null = null;

/**
 * PanelStoreを作成
 * 既存のストアがある場合は上書き
 */
export function createPanelStore(initialState: PanelState): PanelStore {
	store = new Store<PanelState>(initialState);
	return store;
}

/**
 * PanelStoreを取得
 * ストアが未初期化の場合はエラー
 */
export function getPanelStore(): PanelStore {
	if (!store) {
		throw new Error(
			"Panel store not initialized. Ensure PanelStoreProvider is mounted.",
		);
	}
	return store;
}

/**
 * PanelStoreを安全に取得（null許容）
 * タイミング問題が発生する可能性がある場所で使用
 */
export function getPanelStoreSafe(): PanelStore | null {
	return store;
}
