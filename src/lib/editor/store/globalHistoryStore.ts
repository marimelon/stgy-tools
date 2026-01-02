/**
 * グローバル履歴ストア
 *
 * タブ間を移動しても履歴を保持するためのグローバルストア
 * TanStack Store を使用
 */

import { Store } from "@tanstack/store";
import type { HistoryEntry } from "../types";

/** 履歴データ */
export interface StoredHistory {
	history: HistoryEntry[];
	historyIndex: number;
}

/** グローバル履歴ストアの状態 */
export interface GlobalHistoryState {
	/** ボードIDをキーとした履歴マップ（null = memory-only mode） */
	histories: Map<string | null, StoredHistory>;
}

/** 履歴の最大件数 */
const MAX_HISTORY_ENTRIES = 50;

/** グローバル履歴ストア（シングルトン） */
export const globalHistoryStore = new Store<GlobalHistoryState>({
	histories: new Map(),
});

/**
 * 履歴を保存
 */
export function saveHistory(
	boardId: string | null,
	history: HistoryEntry[],
	historyIndex: number,
): void {
	globalHistoryStore.setState((state) => {
		const newHistories = new Map(state.histories);

		// 履歴が上限を超えている場合は古いものを削除
		const trimmedHistory =
			history.length > MAX_HISTORY_ENTRIES
				? history.slice(-MAX_HISTORY_ENTRIES)
				: history;

		// インデックスも調整
		const adjustedIndex =
			history.length > MAX_HISTORY_ENTRIES
				? Math.max(0, historyIndex - (history.length - MAX_HISTORY_ENTRIES))
				: historyIndex;

		newHistories.set(boardId, {
			history: trimmedHistory,
			historyIndex: adjustedIndex,
		});

		return { histories: newHistories };
	});
}

/**
 * 履歴を取得
 */
export function getHistory(boardId: string | null): StoredHistory | null {
	return globalHistoryStore.state.histories.get(boardId) ?? null;
}
