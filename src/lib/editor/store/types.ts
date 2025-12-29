/**
 * TanStack Store用の型定義
 */

import type { Store } from "@tanstack/store";
import type { EditorState } from "../types";

/** エディターストアの型 */
export type EditorStore = Store<EditorState>;

/** ストア初期化オプション */
export interface EditorStoreOptions {
	/** 初期状態を生成するための設定 */
	initialState: EditorState;
}
