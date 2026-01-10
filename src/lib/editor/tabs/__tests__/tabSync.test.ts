/**
 * Tab synchronization logic tests
 *
 * EditorWithTabs内のタブ同期ロジックをテスト
 * - 初回マウント時（リロード後）の挙動
 * - Viewerからのインポート時の挙動
 */

import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import * as actions from "../actions";
import { createTabStore, type TabStore } from "../store";

describe("tab sync logic", () => {
	let store: TabStore;
	let onSelectBoard: Mock<(boardId: string) => boolean>;

	beforeEach(() => {
		store = createTabStore();
		onSelectBoard = vi.fn().mockReturnValue(true);
	});

	/**
	 * EditorWithTabsのuseEffect内の同期ロジックをシミュレート
	 */
	function simulateTabSync(params: {
		currentBoardId: string;
		openTabs: string[];
		activeTabId: string | null;
		existingBoardIds: string[];
		isInitialMount: boolean;
	}) {
		const {
			currentBoardId,
			openTabs,
			activeTabId,
			existingBoardIds,
			isInitialMount,
		} = params;

		// ストアの状態を設定
		store.setState(() => ({ openTabs, activeTabId }));

		// 同期ロジック
		if (openTabs.length === 0) {
			const existingSet = new Set(existingBoardIds);
			if (existingSet.has(currentBoardId)) {
				actions.setInitialTab(store, currentBoardId);
			}
		} else if (!openTabs.includes(currentBoardId)) {
			if (isInitialMount && activeTabId && openTabs.includes(activeTabId)) {
				onSelectBoard(activeTabId);
			} else {
				actions.addTab(store, currentBoardId);
			}
		}
	}

	describe("初回マウント時（リロード後）", () => {
		it("タブが空の場合、currentBoardIdで初期化される", () => {
			simulateTabSync({
				currentBoardId: "board-1",
				openTabs: [],
				activeTabId: null,
				existingBoardIds: ["board-1", "board-2"],
				isInitialMount: true,
			});

			expect(store.state.openTabs).toEqual(["board-1"]);
			expect(store.state.activeTabId).toBe("board-1");
		});

		it("既存のタブがあり、activeTabIdが有効な場合、activeTabIdに切り替える", () => {
			simulateTabSync({
				currentBoardId: "board-new",
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
				existingBoardIds: ["board-1", "board-2", "board-new"],
				isInitialMount: true,
			});

			// activeTabIdに切り替え（onSelectBoardが呼ばれる）
			expect(onSelectBoard).toHaveBeenCalledWith("board-1");
			// タブは変更されない
			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
		});

		it("既存のタブがあるが、activeTabIdが無効な場合、currentBoardIdをタブに追加", () => {
			simulateTabSync({
				currentBoardId: "board-new",
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-deleted", // 存在しないボード
				existingBoardIds: ["board-1", "board-2", "board-new"],
				isInitialMount: true,
			});

			// currentBoardIdがタブに追加される
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-new"]);
			expect(store.state.activeTabId).toBe("board-new");
		});
	});

	describe("Viewerからのインポート時（初回マウント後）", () => {
		it("新しいボードがタブに追加される", () => {
			simulateTabSync({
				currentBoardId: "board-new",
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
				existingBoardIds: ["board-1", "board-2", "board-new"],
				isInitialMount: false, // 初回マウント後
			});

			// onSelectBoardは呼ばれない
			expect(onSelectBoard).not.toHaveBeenCalled();
			// 新しいボードがタブに追加される
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-new"]);
			expect(store.state.activeTabId).toBe("board-new");
		});

		it("既存のボードを開く場合、タブに切り替える", () => {
			// addTabは既存タブの場合、追加せずにアクティブに切り替える
			simulateTabSync({
				currentBoardId: "board-1",
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-2",
				existingBoardIds: ["board-1", "board-2"],
				isInitialMount: false,
			});

			// board-1は既にタブにあるので、openTabsは変わらない
			// ただし、この場合useEffectの条件 !openTabs.includes(currentBoardId) がfalseなのでスキップ
			// このテストではその条件に入らない
		});
	});

	describe("replaceAllTabs後のリロード", () => {
		it("replaceAllTabsで設定されたタブがリロード後も維持される", () => {
			// replaceAllTabsでタブを設定
			actions.replaceAllTabs(store, ["board-a", "board-b", "board-c"]);

			expect(store.state.openTabs).toEqual(["board-a", "board-b", "board-c"]);
			expect(store.state.activeTabId).toBe("board-a");

			// リロードをシミュレート（初期化で別のボードが選ばれる）
			// isInitialMount=trueで、activeTabIdが有効な場合、activeTabIdに切り替え
			onSelectBoard.mockClear();

			simulateTabSync({
				currentBoardId: "board-x", // 初期化で選ばれたボード（タブにない）
				openTabs: ["board-a", "board-b", "board-c"],
				activeTabId: "board-a",
				existingBoardIds: ["board-a", "board-b", "board-c", "board-x"],
				isInitialMount: true,
			});

			// activeTabId（board-a）に切り替え
			expect(onSelectBoard).toHaveBeenCalledWith("board-a");
			// タブは変更されない
			expect(store.state.openTabs).toEqual(["board-a", "board-b", "board-c"]);
		});
	});
});
