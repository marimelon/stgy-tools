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

/** ボードの型（テスト用簡易版） */
interface TestBoard {
	id: string;
}

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

describe("deleted board tab sync logic (confirmed boards)", () => {
	let store: TabStore;
	let confirmedBoards: Set<string>;

	beforeEach(() => {
		store = createTabStore();
		confirmedBoards = new Set();
	});

	/**
	 * EditorWithTabsの削除されたボードのタブ同期ロジックをシミュレート
	 * (src/routes/editor.tsx の useEffect をテスト)
	 * confirmed boardsアプローチ：一度確認されたボードのみ削除検出の対象
	 */
	function simulateDeletedBoardSync(params: {
		boards: TestBoard[];
		openTabs: string[];
	}): { removedTabs: string[] } {
		const { boards, openTabs } = params;

		// ストアの状態を設定
		store.setState((s) => ({ ...s, openTabs }));

		const currentBoardIds = new Set(boards.map((b) => b.id));
		const removedTabs: string[] = [];

		// 現在存在するボードを「確認済み」に追加
		for (const boardId of currentBoardIds) {
			confirmedBoards.add(boardId);
		}

		// 確認済みだったが消えたボード = 削除された
		for (const tabId of store.state.openTabs) {
			if (confirmedBoards.has(tabId) && !currentBoardIds.has(tabId)) {
				const replacementId = boards.length > 0 ? boards[0].id : undefined;
				actions.removeDeletedBoardTab(store, tabId, replacementId);
				confirmedBoards.delete(tabId);
				removedTabs.push(tabId);
			}
		}

		return { removedTabs };
	}

	describe("未確認ボードのタブ", () => {
		it("まだboardsに現れていないボードのタブは削除されない", () => {
			// Viewerからのインポート時のシナリオ：
			// タブは設定されているが、useLiveQueryのboardsにはまだ反映されていない
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3"],
				activeTabId: "board-1",
			}));

			// boardsにはboard-1のみ存在（board-2, board-3はまだ反映されていない）
			const result = simulateDeletedBoardSync({
				boards: [{ id: "board-1" }],
				openTabs: store.state.openTabs,
			});

			// board-2, board-3は未確認なので削除されない
			expect(result.removedTabs).toEqual([]);
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);
		});

		it("ボードがboardsに現れた後、confirmedに追加される", () => {
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3"],
				activeTabId: "board-1",
			}));

			// 最初はboard-1のみ
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }],
				openTabs: store.state.openTabs,
			});
			expect(confirmedBoards.has("board-1")).toBe(true);
			expect(confirmedBoards.has("board-2")).toBe(false);

			// 次にboard-2, board-3も現れる
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }, { id: "board-3" }],
				openTabs: store.state.openTabs,
			});
			expect(confirmedBoards.has("board-2")).toBe(true);
			expect(confirmedBoards.has("board-3")).toBe(true);
		});
	});

	describe("確認済みボードの削除検出", () => {
		it("確認済みボードが消えるとタブが削除される", () => {
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3"],
				activeTabId: "board-2",
			}));

			// 最初にすべてのボードを確認
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }, { id: "board-3" }],
				openTabs: store.state.openTabs,
			});

			// board-2が削除される
			const result = simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-3" }],
				openTabs: store.state.openTabs,
			});

			// board-2のタブが閉じられる
			expect(result.removedTabs).toEqual(["board-2"]);
			expect(store.state.openTabs).not.toContain("board-2");
		});

		it("複数のボードが同時に削除された場合、すべてのタブが閉じられる", () => {
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3", "board-4"],
				activeTabId: "board-1",
			}));

			// 最初にすべてのボードを確認
			simulateDeletedBoardSync({
				boards: [
					{ id: "board-1" },
					{ id: "board-2" },
					{ id: "board-3" },
					{ id: "board-4" },
				],
				openTabs: store.state.openTabs,
			});

			// board-2とboard-3が削除される（フォルダ削除をシミュレート）
			const result = simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-4" }],
				openTabs: store.state.openTabs,
			});

			expect(result.removedTabs).toEqual(["board-2", "board-3"]);
			expect(store.state.openTabs).toEqual(["board-1", "board-4"]);
		});
	});

	describe("Viewerからのマルチインポートシナリオ", () => {
		it("インポート完了後にボードが正常に確認される", () => {
			// Step 1: タブが先に設定される（boardsは空）
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3"],
				activeTabId: "board-1",
			}));

			// Step 2: boardsが空の状態で同期（タブは削除されない）
			let result = simulateDeletedBoardSync({
				boards: [],
				openTabs: store.state.openTabs,
			});
			expect(result.removedTabs).toEqual([]);
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);

			// Step 3: boardsが更新される（すべてのボードが確認される）
			result = simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }, { id: "board-3" }],
				openTabs: store.state.openTabs,
			});
			expect(result.removedTabs).toEqual([]);
			expect(confirmedBoards.size).toBe(3);

			// Step 4: 後でboard-2を削除すると、タブも閉じられる
			result = simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-3" }],
				openTabs: store.state.openTabs,
			});
			expect(result.removedTabs).toEqual(["board-2"]);
		});
	});
});

// 旧実装のテスト - 現在は使用されていないが参考用に残す
describe.skip("deleted board tab sync logic (legacy prevBoardIds)", () => {
	let store: TabStore;
	let prevBoardIds: Set<string>;

	beforeEach(() => {
		store = createTabStore();
		prevBoardIds = new Set();
	});

	/**
	 * 旧実装のテスト（prevBoardIdsベース）
	 * 参考用に残す
	 */
	function simulateDeletedBoardSync(params: {
		boards: TestBoard[];
		openTabs: string[];
	}) {
		const { boards, openTabs } = params;

		// ストアの状態を設定
		store.setState((s) => ({ ...s, openTabs }));

		const currentBoardIds = new Set(boards.map((b) => b.id));

		// 前回存在していて、今回存在しないボードが「削除された」ボード
		const deletedBoardIds = [...prevBoardIds].filter(
			(id) => !currentBoardIds.has(id),
		);

		// 削除されたボードのタブを閉じる
		for (const deletedId of deletedBoardIds) {
			if (store.state.openTabs.includes(deletedId)) {
				const replacementId = boards.length > 0 ? boards[0].id : undefined;
				actions.removeDeletedBoardTab(store, deletedId, replacementId);
			}
		}

		// 現在のボードIDを保存
		prevBoardIds = currentBoardIds;
	}

	describe("ボード削除時", () => {
		it("削除されたボードのタブが閉じられる", () => {
			// 初期状態: 3つのボードとタブ
			prevBoardIds = new Set(["board-1", "board-2", "board-3"]);
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3"],
				activeTabId: "board-2",
			}));

			// board-2を削除
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-3" }],
				openTabs: ["board-1", "board-2", "board-3"],
			});

			expect(store.state.openTabs).toEqual(["board-1", "board-3"]);
			expect(store.state.openTabs).not.toContain("board-2");
		});

		it("複数のボードが同時に削除された場合、すべてのタブが閉じられる", () => {
			// 初期状態: 4つのボードとタブ
			prevBoardIds = new Set(["board-1", "board-2", "board-3", "board-4"]);
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3", "board-4"],
				activeTabId: "board-1",
			}));

			// board-2とboard-3を削除（フォルダ削除をシミュレート）
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-4" }],
				openTabs: ["board-1", "board-2", "board-3", "board-4"],
			});

			expect(store.state.openTabs).toEqual(["board-1", "board-4"]);
			expect(store.state.openTabs).not.toContain("board-2");
			expect(store.state.openTabs).not.toContain("board-3");
		});

		it("タブに開かれていないボードが削除されても影響しない", () => {
			// board-3はボードとして存在するがタブには開かれていない
			prevBoardIds = new Set(["board-1", "board-2", "board-3"]);
			store.setState(() => ({
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
			}));

			// board-3を削除
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }],
				openTabs: ["board-1", "board-2"],
			});

			// タブは変わらない
			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
		});
	});

	describe("ボード追加時", () => {
		it("新しいボードが追加されても既存のタブは影響を受けない", () => {
			// 初期状態: 2つのボードとタブ
			prevBoardIds = new Set(["board-1", "board-2"]);
			store.setState(() => ({
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
			}));

			// 新しいボードを追加
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }, { id: "board-new" }],
				openTabs: ["board-1", "board-2"],
			});

			// 既存のタブは変わらない（新しいボードはまだタブに追加されていない）
			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
		});

		it("新しいボードがタブに追加された後も既存のタブは維持される", () => {
			// 初期状態
			prevBoardIds = new Set(["board-1", "board-2"]);
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-new"],
				activeTabId: "board-new",
			}));

			// ボードリストが更新される（board-newが追加された後）
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }, { id: "board-new" }],
				openTabs: ["board-1", "board-2", "board-new"],
			});

			// すべてのタブが維持される
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-new"]);
		});
	});

	describe("初回レンダリング時", () => {
		it("prevBoardIdsが空の場合、タブは削除されない", () => {
			// 初回レンダリング時はprevBoardIdsが空
			prevBoardIds = new Set();
			store.setState(() => ({
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
			}));

			// ボードリストが初めてロードされる
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }],
				openTabs: ["board-1", "board-2"],
			});

			// タブは変わらない
			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
		});
	});
});

describe("initialBoardIds ordering", () => {
	describe("createTabStore with initial state", () => {
		it("initialStateで指定した順序でタブが初期化される", () => {
			const store = createTabStore({
				openTabs: ["board-a", "board-b", "board-c"],
				activeTabId: "board-a",
			});

			expect(store.state.openTabs).toEqual(["board-a", "board-b", "board-c"]);
			expect(store.state.activeTabId).toBe("board-a");
		});

		it("空のinitialStateでは空のタブで初期化される", () => {
			const store = createTabStore();

			expect(store.state.openTabs).toEqual([]);
			expect(store.state.activeTabId).toBeNull();
		});
	});

	describe("replaceAllTabs", () => {
		it("指定した順序でタブが置き換えられる", () => {
			const store = createTabStore({
				openTabs: ["old-1", "old-2"],
				activeTabId: "old-1",
			});

			actions.replaceAllTabs(store, ["new-a", "new-b", "new-c"]);

			expect(store.state.openTabs).toEqual(["new-a", "new-b", "new-c"]);
			expect(store.state.activeTabId).toBe("new-a");
		});

		it("replaceAllTabs後も順序が維持される", () => {
			const store = createTabStore();

			// Viewerからの複数インポートをシミュレート
			// 順序: board-5, board-6, board-4
			actions.replaceAllTabs(store, ["board-5", "board-6", "board-4"]);

			// 順序が維持されていることを確認
			expect(store.state.openTabs).toEqual(["board-5", "board-6", "board-4"]);
			expect(store.state.activeTabId).toBe("board-5");
		});

		it("多数のボードでも順序が維持される", () => {
			const store = createTabStore();

			// 10個のボードを特定の順序で追加
			const boardIds = [
				"id-7",
				"id-3",
				"id-9",
				"id-1",
				"id-5",
				"id-2",
				"id-8",
				"id-4",
				"id-6",
				"id-10",
			];
			actions.replaceAllTabs(store, boardIds);

			// 順序が完全に維持されていることを確認
			expect(store.state.openTabs).toEqual(boardIds);
		});
	});

	describe("multi-import from Viewer simulation", () => {
		it("Viewerからの複数インポート時に順序が保持される", () => {
			// シナリオ: Viewerで3つのボードを選択してEditorに送る
			// Viewerでの表示順: ⑤, 全体, ⑥ (左から右)
			const importOrder = ["board-5", "board-zentai", "board-6"];

			// TabStoreProviderがinitialBoardIdsを受け取った時の動作をシミュレート
			const store = createTabStore({
				openTabs: importOrder,
				activeTabId: importOrder[0],
			});

			// タブの順序が維持されていることを確認
			expect(store.state.openTabs).toEqual([
				"board-5",
				"board-zentai",
				"board-6",
			]);
			// 最初のタブがアクティブ
			expect(store.state.activeTabId).toBe("board-5");
		});
	});
});
