/**
 * セッション永続化の型定義
 */

import type { ObjectGroup, GridSettings } from "@/lib/editor/types";

/** 永続化スキーマバージョン */
export const PERSISTENCE_VERSION = 1;

/** localStorageキー */
export const STORAGE_KEY = "strategy-board-editor-session";

/**
 * 保存されるセッションデータ
 */
export interface SessionData {
	/** スキーマバージョン */
	version: number;
	/** stgy形式でエンコードされたボードデータ */
	stgyCode: string;
	/** エンコード時のキー (0-63) */
	encodeKey: number;
	/** グループ情報 */
	groups: ObjectGroup[];
	/** グリッド設定 */
	gridSettings: GridSettings;
	/** 保存日時 (ISO 8601) */
	savedAt: string;
}

/** デフォルトのグリッド設定 */
export const DEFAULT_GRID_SETTINGS: GridSettings = {
	enabled: false,
	size: 16,
	showGrid: false,
};
