/**
 * Tab state types
 */

/** Tab state */
export interface TabState {
	/** Open tab board IDs (order preserved) */
	openTabs: string[];

	/** Currently active tab board ID */
	activeTabId: string | null;
}

/** Persisted tab state for localStorage */
export interface PersistedTabState {
	openTabs: string[];
	activeTabId: string | null;
}

/** Maximum number of tabs */
export const MAX_TABS = 10;

/** localStorage key */
export const TABS_STORAGE_KEY = "strategy-board-editor:tabs";

/** Save debounce time in milliseconds */
export const TABS_SAVE_DEBOUNCE_MS = 500;

/**
 * ボードが「削除された」と判定するまでの連続消失回数の閾値
 * IndexedDBの非同期クエリによる一時的なデータ消失を無視するため
 */
export const MISSING_BOARD_THRESHOLD = 5;
