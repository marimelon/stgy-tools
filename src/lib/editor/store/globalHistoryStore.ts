/**
 * Global history store
 *
 * Preserves history across tab switches using TanStack Store
 */

import { Store } from "@tanstack/store";
import type { HistoryEntry } from "../types";

export interface StoredHistory {
	history: HistoryEntry[];
	historyIndex: number;
}

export interface GlobalHistoryState {
	/** History map keyed by board ID (null = memory-only mode) */
	histories: Map<string | null, StoredHistory>;
}

const MAX_HISTORY_ENTRIES = 50;

export const globalHistoryStore = new Store<GlobalHistoryState>({
	histories: new Map(),
});

export function saveHistory(
	boardId: string | null,
	history: HistoryEntry[],
	historyIndex: number,
): void {
	globalHistoryStore.setState((state) => {
		const newHistories = new Map(state.histories);

		// Trim old entries if exceeding limit
		const trimmedHistory =
			history.length > MAX_HISTORY_ENTRIES
				? history.slice(-MAX_HISTORY_ENTRIES)
				: history;

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

export function getHistory(boardId: string | null): StoredHistory | null {
	return globalHistoryStore.state.histories.get(boardId) ?? null;
}
