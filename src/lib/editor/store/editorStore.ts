/**
 * エディターストア
 *
 * TanStack Storeを使用したエディター状態管理の中核
 */

import { Store } from "@tanstack/store";
import type { EditorState } from "../types";
import type { EditorStore } from "./types";

/** シングルトンストアインスタンス */
let store: EditorStore | null = null;

/**
 * エディターストアを作成
 */
export function createEditorStore(initialState: EditorState): EditorStore {
	store = new Store<EditorState>(initialState);
	return store;
}

/**
 * 現在のエディターストアを取得
 * @throws ストアが初期化されていない場合
 */
export function getEditorStore(): EditorStore {
	if (!store) {
		throw new Error(
			"Editor store not initialized. Ensure EditorStoreProvider is mounted.",
		);
	}
	return store;
}

/**
 * 現在のエディターストアを安全に取得（nullを許容）
 * パネルレイアウト変更時などのタイミング問題を回避するために使用
 */
export function getEditorStoreSafe(): EditorStore | null {
	return store;
}

/**
 * ストアをリセット（Provider unmount時に使用）
 */
export function resetEditorStore(): void {
	store = null;
}

/**
 * ストアが初期化されているかチェック
 */
export function isEditorStoreInitialized(): boolean {
	return store !== null;
}
