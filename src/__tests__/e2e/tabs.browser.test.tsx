/**
 * タブ順序のブラウザテスト
 *
 * Vitest Browser Mode を使用したタブ機能の統合テスト
 *
 * テスト対象：
 * - initialBoardIdsによるタブ順序の初期化
 * - タブの表示順序が指定順序と一致すること
 */

import "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { BoardTabs } from "@/components/editor/BoardTabs";
import { DEFAULT_GRID_SETTINGS, type StoredBoard } from "@/lib/boards/schema";
import { TabStoreProvider } from "@/lib/editor/tabs/TabStoreProvider";
import { DEFAULT_OVERLAY_SETTINGS } from "@/lib/editor/types";

/**
 * 条件が満たされるまで待機するヘルパー関数
 */
async function waitFor(
	fn: () => void | Promise<void>,
	{ timeout = 1000, interval = 50 } = {},
): Promise<void> {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		try {
			await fn();
			return;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, interval));
		}
	}
	// 最後にもう一度実行してエラーを投げる
	await fn();
}

/** テスト用ボードを作成 */
function createTestBoard(id: string, name: string): StoredBoard {
	return {
		id,
		name,
		folderId: null,
		stgyCode: "",
		groups: [],
		gridSettings: {
			...DEFAULT_GRID_SETTINGS,
			overlaySettings: DEFAULT_OVERLAY_SETTINGS,
		},
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
}

describe("Tab ordering", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe("initialBoardIds", () => {
		it("initialBoardIdsの順序でタブが表示される", async () => {
			// 3つのボードを作成（IDの順序とは異なる順序で表示する）
			const boards: StoredBoard[] = [
				createTestBoard("board-a", "ボードA"),
				createTestBoard("board-b", "ボードB"),
				createTestBoard("board-c", "ボードC"),
			];

			// 表示順序: C, A, B（IDのアルファベット順ではない）
			const initialBoardIds = ["board-c", "board-a", "board-b"];

			const onSelectBoard = vi.fn();
			const onAddClick = vi.fn();
			const onDuplicateBoard = vi.fn();

			const screen = await render(
				<TabStoreProvider initialBoardIds={initialBoardIds}>
					<BoardTabs
						boards={boards}
						unsavedBoardIds={new Set()}
						onSelectBoard={onSelectBoard}
						onAddClick={onAddClick}
						onDuplicateBoard={onDuplicateBoard}
					/>
				</TabStoreProvider>,
			);

			// タブが表示されるのを待つ
			await waitFor(() => {
				const tabs = screen.container.querySelectorAll("[data-tab-id]");
				expect(tabs.length).toBe(3);
			});

			// タブの順序を確認
			const tabElements = screen.container.querySelectorAll("[data-tab-id]");
			const tabIds = Array.from(tabElements).map((el) =>
				el.getAttribute("data-tab-id"),
			);
			expect(tabIds).toEqual(["board-c", "board-a", "board-b"]);
		});

		it("多数のボードでも順序が維持される", async () => {
			// 5つのボードを作成
			const boards: StoredBoard[] = [
				createTestBoard("id-1", "ボード1"),
				createTestBoard("id-2", "ボード2"),
				createTestBoard("id-3", "ボード3"),
				createTestBoard("id-4", "ボード4"),
				createTestBoard("id-5", "ボード5"),
			];

			// 特定の順序で表示: 3, 1, 5, 2, 4
			const initialBoardIds = ["id-3", "id-1", "id-5", "id-2", "id-4"];

			const screen = await render(
				<TabStoreProvider initialBoardIds={initialBoardIds}>
					<BoardTabs
						boards={boards}
						unsavedBoardIds={new Set()}
						onSelectBoard={vi.fn()}
						onAddClick={vi.fn()}
						onDuplicateBoard={vi.fn()}
					/>
				</TabStoreProvider>,
			);

			await waitFor(() => {
				const tabs = screen.container.querySelectorAll("[data-tab-id]");
				expect(tabs.length).toBe(5);
			});

			const tabElements = screen.container.querySelectorAll("[data-tab-id]");
			const tabIds = Array.from(tabElements).map((el) =>
				el.getAttribute("data-tab-id"),
			);

			expect(tabIds).toEqual(["id-3", "id-1", "id-5", "id-2", "id-4"]);
		});

		it("最初のタブがアクティブになる", async () => {
			const boards: StoredBoard[] = [
				createTestBoard("board-x", "ボードX"),
				createTestBoard("board-y", "ボードY"),
				createTestBoard("board-z", "ボードZ"),
			];

			// Y, Z, X の順序で表示
			const initialBoardIds = ["board-y", "board-z", "board-x"];

			const screen = await render(
				<TabStoreProvider initialBoardIds={initialBoardIds}>
					<BoardTabs
						boards={boards}
						unsavedBoardIds={new Set()}
						onSelectBoard={vi.fn()}
						onAddClick={vi.fn()}
						onDuplicateBoard={vi.fn()}
					/>
				</TabStoreProvider>,
			);

			await waitFor(() => {
				const tabs = screen.container.querySelectorAll("[data-tab-id]");
				expect(tabs.length).toBe(3);
			});

			// 最初のタブのIDがboard-yであることを確認
			const tabElements = screen.container.querySelectorAll("[data-tab-id]");
			const firstTab = tabElements[0];
			expect(firstTab?.getAttribute("data-tab-id")).toBe("board-y");
		});
	});

	describe("タブクリック", () => {
		it("タブをクリックするとonSelectBoardが呼ばれる", async () => {
			const boards: StoredBoard[] = [
				createTestBoard("board-1", "ボード1"),
				createTestBoard("board-2", "ボード2"),
			];

			const initialBoardIds = ["board-1", "board-2"];
			const onSelectBoard = vi.fn();

			const screen = await render(
				<TabStoreProvider initialBoardIds={initialBoardIds}>
					<BoardTabs
						boards={boards}
						unsavedBoardIds={new Set()}
						onSelectBoard={onSelectBoard}
						onAddClick={vi.fn()}
						onDuplicateBoard={vi.fn()}
					/>
				</TabStoreProvider>,
			);

			await waitFor(() => {
				const tabs = screen.container.querySelectorAll("[data-tab-id]");
				expect(tabs.length).toBe(2);
			});

			// 2番目のタブ内のボタンをクリック
			const tabElements = screen.container.querySelectorAll("[data-tab-id]");
			const secondTab = tabElements[1];
			expect(secondTab).toBeTruthy();

			// タブ内のボタン要素を取得
			const tabButton = secondTab?.querySelector("button");
			expect(tabButton).toBeTruthy();

			await userEvent.click(tabButton!);

			// onSelectBoardが呼ばれたことを確認
			expect(onSelectBoard).toHaveBeenCalledWith("board-2");
		});
	});

	describe("Viewerからのマルチインポートシミュレーション", () => {
		it("Viewer表示順序と同じ順序でタブが表示される", async () => {
			// シナリオ: Viewerで3つのボードを選択してEditorに送る
			const boards: StoredBoard[] = [
				createTestBoard("board-1", "board1"),
				createTestBoard("board-2", "board2"),
				createTestBoard("board-3", "board3"),
			];

			// Viewerでの表示順序: board1, board2, board3
			const viewerDisplayOrder = ["board-1", "board-2", "board-3"];

			const screen = await render(
				<TabStoreProvider initialBoardIds={viewerDisplayOrder}>
					<BoardTabs
						boards={boards}
						unsavedBoardIds={new Set()}
						onSelectBoard={vi.fn()}
						onAddClick={vi.fn()}
						onDuplicateBoard={vi.fn()}
					/>
				</TabStoreProvider>,
			);

			await waitFor(() => {
				const tabs = screen.container.querySelectorAll("[data-tab-id]");
				expect(tabs.length).toBe(3);
			});

			const tabElements = screen.container.querySelectorAll("[data-tab-id]");
			const tabIds = Array.from(tabElements).map((el) =>
				el.getAttribute("data-tab-id"),
			);

			// Viewerと同じ順序で表示されることを確認
			expect(tabIds).toEqual(["board-1", "board-2", "board-3"]);

			// タブ名も確認
			const tabNames = Array.from(tabElements).map(
				(el) => el.textContent?.trim().replace(/×$/, "").trim(), // 閉じるボタンのテキストを除去
			);
			expect(tabNames[0]).toContain("board1");
			expect(tabNames[1]).toContain("board2");
			expect(tabNames[2]).toContain("board3");
		});
	});
});
