/**
 * Global History Store unit tests
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BackgroundId } from "@/lib/stgy";
import type { HistoryEntry } from "../../types";
import {
	getHistory,
	globalHistoryStore,
	saveHistory,
} from "../globalHistoryStore";

/** テスト用の履歴エントリを作成 */
function createMockHistoryEntry(id: string): HistoryEntry {
	return {
		id,
		board: {
			version: 1,
			name: `Board ${id}`,
			backgroundId: BackgroundId.None,
			objects: [],
		},
		groups: [],
		description: `Action ${id}`,
	};
}

describe("globalHistoryStore", () => {
	beforeEach(() => {
		// ストアをリセット
		globalHistoryStore.setState(() => ({
			histories: new Map(),
		}));
	});

	afterEach(() => {
		// クリーンアップ
		globalHistoryStore.setState(() => ({
			histories: new Map(),
		}));
	});

	describe("saveHistory", () => {
		it("saves history for a board", () => {
			const boardId = "board-1";
			const history = [createMockHistoryEntry("1")];

			saveHistory(boardId, history, 0);

			const stored = getHistory(boardId);
			expect(stored).not.toBeNull();
			expect(stored?.history).toHaveLength(1);
			expect(stored?.historyIndex).toBe(0);
		});

		it("saves history for null boardId (memory-only mode)", () => {
			const history = [createMockHistoryEntry("1")];

			saveHistory(null, history, 0);

			const stored = getHistory(null);
			expect(stored).not.toBeNull();
			expect(stored?.history).toHaveLength(1);
		});

		it("saves history for multiple boards independently", () => {
			const history1 = [createMockHistoryEntry("1")];
			const history2 = [
				createMockHistoryEntry("2"),
				createMockHistoryEntry("3"),
			];

			saveHistory("board-1", history1, 0);
			saveHistory("board-2", history2, 1);

			expect(getHistory("board-1")?.history).toHaveLength(1);
			expect(getHistory("board-2")?.history).toHaveLength(2);
			expect(getHistory("board-2")?.historyIndex).toBe(1);
		});

		it("overwrites existing history for same boardId", () => {
			const history1 = [createMockHistoryEntry("1")];
			const history2 = [
				createMockHistoryEntry("2"),
				createMockHistoryEntry("3"),
			];

			saveHistory("board-1", history1, 0);
			saveHistory("board-1", history2, 1);

			const stored = getHistory("board-1");
			expect(stored?.history).toHaveLength(2);
			expect(stored?.historyIndex).toBe(1);
		});

		it("trims history when exceeding MAX_HISTORY_ENTRIES (50)", () => {
			const history = Array.from({ length: 60 }, (_, i) =>
				createMockHistoryEntry(`${i}`),
			);

			saveHistory("board-1", history, 55);

			const stored = getHistory("board-1");
			expect(stored?.history).toHaveLength(50);
			// インデックスも調整される: 55 - (60 - 50) = 45
			expect(stored?.historyIndex).toBe(45);
		});

		it("adjusts historyIndex to 0 when trimming causes negative index", () => {
			const history = Array.from({ length: 60 }, (_, i) =>
				createMockHistoryEntry(`${i}`),
			);

			// インデックス5は削除される範囲（0-9が削除）
			saveHistory("board-1", history, 5);

			const stored = getHistory("board-1");
			expect(stored?.history).toHaveLength(50);
			// 5 - 10 = -5 → max(0, -5) = 0
			expect(stored?.historyIndex).toBe(0);
		});

		it("does not trim history at exactly MAX_HISTORY_ENTRIES", () => {
			const history = Array.from({ length: 50 }, (_, i) =>
				createMockHistoryEntry(`${i}`),
			);

			saveHistory("board-1", history, 25);

			const stored = getHistory("board-1");
			expect(stored?.history).toHaveLength(50);
			expect(stored?.historyIndex).toBe(25);
		});
	});

	describe("getHistory", () => {
		it("returns null for non-existent boardId", () => {
			expect(getHistory("non-existent")).toBeNull();
		});

		it("returns null for null boardId when not saved", () => {
			expect(getHistory(null)).toBeNull();
		});

		it("returns stored history", () => {
			const history = [
				createMockHistoryEntry("1"),
				createMockHistoryEntry("2"),
			];
			saveHistory("board-1", history, 1);

			const stored = getHistory("board-1");

			expect(stored).not.toBeNull();
			expect(stored?.history).toHaveLength(2);
			expect(stored?.history[0].id).toBe("1");
			expect(stored?.history[1].id).toBe("2");
			expect(stored?.historyIndex).toBe(1);
		});
	});

	describe("multiple board management", () => {
		it("maintains separate histories for different boards", () => {
			saveHistory("board-a", [createMockHistoryEntry("a1")], 0);
			saveHistory("board-b", [createMockHistoryEntry("b1")], 0);
			saveHistory(null, [createMockHistoryEntry("null1")], 0);

			// 各ボードの履歴が独立していることを確認
			expect(getHistory("board-a")?.history[0].id).toBe("a1");
			expect(getHistory("board-b")?.history[0].id).toBe("b1");
			expect(getHistory(null)?.history[0].id).toBe("null1");

			// 一方を更新しても他方に影響しない
			saveHistory("board-a", [createMockHistoryEntry("a2")], 0);
			expect(getHistory("board-a")?.history[0].id).toBe("a2");
			expect(getHistory("board-b")?.history[0].id).toBe("b1");
		});
	});
});
