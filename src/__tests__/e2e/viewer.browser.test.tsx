/**
 * Viewer E2Eテスト
 *
 * Vitest Browser Mode を使用したViewerの統合テスト
 *
 * テスト対象：
 * - 複数ボードの読み込み
 * - タブモード（切り替え、閉じる）
 * - グリッドモード（表示、クリックでタブモードへ）
 * - モード切替
 */

import "@/lib/i18n";
import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ViewerGrid } from "@/components/viewer/ViewerGrid";
import { ViewerTabs } from "@/components/viewer/ViewerTabs";
import { ViewerToolbar } from "@/components/viewer/ViewerToolbar";
import {
	parseMultipleStgyCodes,
	useViewerActions,
	useViewerActiveId,
	useViewerBoardCount,
	useViewerBoards,
	useViewerMode,
	type ViewerBoard,
	type ViewerMode,
	ViewerStoreProvider,
} from "@/lib/viewer";

/** アクションをコンポーネント外部から呼び出すためのref型 */
type ActionsRef = {
	current: ReturnType<typeof useViewerActions> | null;
};

// テスト用のサンプルstgyコード
const SAMPLE_STGY_1 =
	"[stgy:a0OcAwAYAfwgAFYAFBAAZYTLdYTLdYTLdYTLdYTLdYTLdYTLd]";
const SAMPLE_STGY_2 =
	"[stgy:ag40qa9YRyTPXZgVoFg1PhfYFKZPnDzJzfLyt51cHDkEEDia+PwMEbq7od+fEJ186kZxqHZSMHPrEWXPrSypGr47NcAkRTNWvNc4OQ8QPYGychElb-BvEZo+Os2dqLJFN5bLGkAn9j6mR4eNSYvA+eu-Zar0FYE3f+Zwa8nty3QUC86FlycOdOJ8vxFWYJmHZ0tDKEDcrVmRZol1QuWNRmlqVyTQbcN-m6t1S4EohXk05l6LzIfdDuS4rKemSgCMDOWI0]";
const SAMPLE_STGY_3 =
	"[stgy:a0OcAwAYAfwgAFYAFBAAZYTLdYTLdYTLdYTLdYTLdYTLdYTLd]";

/** テスト用ボードを生成 */
function createTestBoards(): ViewerBoard[] {
	return parseMultipleStgyCodes(`${SAMPLE_STGY_1}\n${SAMPLE_STGY_2}`);
}

/** 状態監視用コンポーネント */
function StateMonitor({
	onStateChange,
}: {
	onStateChange: (state: {
		boards: ViewerBoard[];
		activeId: string | null;
		viewMode: ViewerMode;
		boardCount: number;
	}) => void;
}) {
	const boards = useViewerBoards();
	const activeId = useViewerActiveId();
	const viewMode = useViewerMode();
	const boardCount = useViewerBoardCount();

	// 状態が変わるたびにコールバック
	onStateChange({ boards, activeId, viewMode, boardCount });

	return null;
}

describe("Viewer E2E", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe("ViewerStoreProvider", () => {
		it("初期ボードが正しく読み込まれる", async () => {
			const initialBoards = createTestBoards();
			let currentState: {
				boards: ViewerBoard[];
				activeId: string | null;
				boardCount: number;
			} | null = null;

			await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<StateMonitor
						onStateChange={(state) => {
							currentState = state;
						}}
					/>
				</ViewerStoreProvider>,
			);

			expect(currentState).not.toBeNull();
			expect(currentState!.boards).toHaveLength(2);
			expect(currentState!.activeId).toBe(initialBoards[0].id);
			expect(currentState!.boardCount).toBe(2);
		});

		it("loadBoardsで複数ボードを読み込める", async () => {
			let currentBoardCount = 0;
			const actionsRef: ActionsRef = { current: null };

			function TestComponent() {
				const actions = useViewerActions();
				const boardCount = useViewerBoardCount();
				currentBoardCount = boardCount;
				actionsRef.current = actions;
				return null;
			}

			await render(
				<ViewerStoreProvider initialBoards={[]}>
					<TestComponent />
				</ViewerStoreProvider>,
			);

			expect(currentBoardCount).toBe(0);

			// 3つのボードを読み込む
			actionsRef.current!.loadBoards(
				`${SAMPLE_STGY_1}\n${SAMPLE_STGY_2}\n${SAMPLE_STGY_3}`,
			);
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(currentBoardCount).toBe(3);
		});

		it("removeBoardでボードを削除できる", async () => {
			const initialBoards = createTestBoards();
			let currentBoardCount = 0;
			const actionsRef: ActionsRef = { current: null };

			function TestComponent() {
				const actions = useViewerActions();
				const boardCount = useViewerBoardCount();
				currentBoardCount = boardCount;
				actionsRef.current = actions;
				return null;
			}

			await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<TestComponent />
				</ViewerStoreProvider>,
			);

			expect(currentBoardCount).toBe(2);

			// 最初のボードを削除
			actionsRef.current!.removeBoard(initialBoards[0].id);
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(currentBoardCount).toBe(1);
		});

		it("削除したボードがアクティブだった場合、次のボードがアクティブになる", async () => {
			const initialBoards = createTestBoards();
			let currentActiveId: string | null = null;
			const actionsRef: ActionsRef = { current: null };

			function TestComponent() {
				const actions = useViewerActions();
				const activeId = useViewerActiveId();
				currentActiveId = activeId;
				actionsRef.current = actions;
				return null;
			}

			await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<TestComponent />
				</ViewerStoreProvider>,
			);

			// 最初は1番目のボードがアクティブ
			expect(currentActiveId).toBe(initialBoards[0].id);

			// アクティブなボードを削除
			actionsRef.current!.removeBoard(initialBoards[0].id);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// 2番目のボードがアクティブになる
			expect(currentActiveId).toBe(initialBoards[1].id);
		});

		it("setViewModeでモードを切り替えられる", async () => {
			let currentMode: ViewerMode = "tab";
			const actionsRef: ActionsRef = { current: null };

			function TestComponent() {
				const actions = useViewerActions();
				const viewMode = useViewerMode();
				currentMode = viewMode;
				actionsRef.current = actions;
				return null;
			}

			await render(
				<ViewerStoreProvider initialBoards={createTestBoards()}>
					<TestComponent />
				</ViewerStoreProvider>,
			);

			expect(currentMode).toBe("tab");

			actionsRef.current!.setViewMode("grid");
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(currentMode).toBe("grid");
		});
	});

	describe("ViewerTabs", () => {
		it("ボードが2つ以上あるとき、タブが表示される", async () => {
			const initialBoards = createTestBoards();

			const screen = await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<ViewerTabs
						boards={initialBoards}
						activeId={initialBoards[0].id}
						onSelectTab={() => {}}
						onCloseTab={() => {}}
					/>
				</ViewerStoreProvider>,
			);

			// タブが2つ表示される
			const tabs = screen.container.querySelectorAll("[role='tab']");
			expect(tabs.length).toBe(2);
		});

		it("ボードが1つのときはタブが表示されない", async () => {
			const singleBoard = parseMultipleStgyCodes(SAMPLE_STGY_1);

			const screen = await render(
				<ViewerStoreProvider initialBoards={singleBoard}>
					<ViewerTabs
						boards={singleBoard}
						activeId={singleBoard[0].id}
						onSelectTab={() => {}}
						onCloseTab={() => {}}
					/>
				</ViewerStoreProvider>,
			);

			// タブが表示されない
			const tabs = screen.container.querySelectorAll("[role='tab']");
			expect(tabs.length).toBe(0);
		});

		it("タブをクリックするとonSelectTabが呼ばれる", async () => {
			const initialBoards = createTestBoards();
			let selectedId: string | null = null;

			const screen = await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<ViewerTabs
						boards={initialBoards}
						activeId={initialBoards[0].id}
						onSelectTab={(id) => {
							selectedId = id;
						}}
						onCloseTab={() => {}}
					/>
				</ViewerStoreProvider>,
			);

			// 2番目のタブをクリック
			const tabs = screen.container.querySelectorAll("[role='tab']");
			await userEvent.click(tabs[1]);

			expect(selectedId).toBe(initialBoards[1].id);
		});

		it("閉じるボタンをクリックするとonCloseTabが呼ばれる", async () => {
			const initialBoards = createTestBoards();
			let closedId: string | null = null;

			const screen = await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<ViewerTabs
						boards={initialBoards}
						activeId={initialBoards[0].id}
						onSelectTab={() => {}}
						onCloseTab={(id) => {
							closedId = id;
						}}
					/>
				</ViewerStoreProvider>,
			);

			// 最初のタブの閉じるボタンをクリック
			const closeButtons = screen.container.querySelectorAll(
				"[role='tab'] button",
			);
			expect(closeButtons.length).toBeGreaterThan(0);
			await userEvent.click(closeButtons[0]);

			expect(closedId).toBe(initialBoards[0].id);
		});

		it("タブがドラッグ可能である（cursor-grabスタイル）", async () => {
			const initialBoards = createTestBoards();

			const screen = await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<ViewerTabs
						boards={initialBoards}
						activeId={initialBoards[0].id}
						onSelectTab={() => {}}
						onCloseTab={() => {}}
					/>
				</ViewerStoreProvider>,
			);

			// タブにcursor-grabスタイルがあることを確認
			const tabs = screen.container.querySelectorAll("[role='tab']");
			expect(tabs.length).toBe(2);
			expect(tabs[0].className).toContain("cursor-grab");
		});

		it("onReorderコールバックが渡されている場合、DndContextが機能する", async () => {
			const initialBoards = createTestBoards();
			let reorderCalled = false;

			const screen = await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<ViewerTabs
						boards={initialBoards}
						activeId={initialBoards[0].id}
						onSelectTab={() => {}}
						onCloseTab={() => {}}
						onReorder={() => {
							reorderCalled = true;
						}}
					/>
				</ViewerStoreProvider>,
			);

			// DndContextがレンダリングされていることを確認（タブが表示されている）
			const tabs = screen.container.querySelectorAll("[role='tab']");
			expect(tabs.length).toBe(2);
			// onReorderはドラッグ操作でのみ呼ばれるため、ここでは呼ばれない
			expect(reorderCalled).toBe(false);
		});
	});

	describe("ViewerGrid", () => {
		it("全ボードがグリッドカードとして表示される", async () => {
			const initialBoards = createTestBoards();

			const screen = await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<ViewerGrid
						boards={initialBoards}
						onSelectBoard={() => {}}
						onCloseBoard={() => {}}
					/>
				</ViewerStoreProvider>,
			);

			// data-testidでカードを選択（BoardViewer内部のrole="button"を除外）
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			expect(cards.length).toBe(2);
		});

		it("カードをクリックするとonSelectBoardが呼ばれる", async () => {
			const initialBoards = createTestBoards();
			let selectedId: string | null = null;

			const screen = await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<ViewerGrid
						boards={initialBoards}
						onSelectBoard={(id) => {
							selectedId = id;
						}}
						onCloseBoard={() => {}}
					/>
				</ViewerStoreProvider>,
			);

			// 2番目のカードをクリック
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			await userEvent.click(cards[1]);

			expect(selectedId).toBe(initialBoards[1].id);
		});

		it("閉じるボタンをクリックするとonCloseBoardが呼ばれる", async () => {
			const initialBoards = createTestBoards();
			let closedId: string | null = null;

			const screen = await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<ViewerGrid
						boards={initialBoards}
						onSelectBoard={() => {}}
						onCloseBoard={(id) => {
							closedId = id;
						}}
					/>
				</ViewerStoreProvider>,
			);

			// カードの閉じるボタンをホバーして表示させる
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			await userEvent.hover(cards[0]);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// 閉じるボタンをクリック（コピーボタンの次にある）
			const buttons = cards[0].querySelectorAll("button");
			const closeButton = buttons[buttons.length - 1]; // 最後のボタンが閉じるボタン
			expect(closeButton).toBeTruthy();
			await userEvent.click(closeButton);

			expect(closedId).toBe(initialBoards[0].id);
		});

		it("コピーボタンをクリックするとstgyCodeがクリップボードにコピーされる", async () => {
			const initialBoards = createTestBoards();
			let copiedText: string | null = null;

			// clipboard.writeTextをモック
			const originalClipboard = navigator.clipboard;
			Object.defineProperty(navigator, "clipboard", {
				value: {
					writeText: async (text: string) => {
						copiedText = text;
					},
				},
				writable: true,
				configurable: true,
			});

			const screen = await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<ViewerGrid
						boards={initialBoards}
						onSelectBoard={() => {}}
						onCloseBoard={() => {}}
					/>
				</ViewerStoreProvider>,
			);

			// カードをホバーしてコピーボタンを表示
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			await userEvent.hover(cards[0]);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// コピーボタンをクリック（最初のボタンがコピー、2番目が閉じる）
			const buttons = cards[0].querySelectorAll("button");
			expect(buttons.length).toBeGreaterThanOrEqual(2);
			await userEvent.click(buttons[0]);

			// stgyCodeがコピーされている
			expect(copiedText).toBe(initialBoards[0].stgyCode);

			// クリップボードを復元
			Object.defineProperty(navigator, "clipboard", {
				value: originalClipboard,
				writable: true,
				configurable: true,
			});
		});

		it("ホバー時にドラッグハンドルが表示される", async () => {
			const initialBoards = createTestBoards();

			const screen = await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<ViewerGrid
						boards={initialBoards}
						onSelectBoard={() => {}}
						onCloseBoard={() => {}}
					/>
				</ViewerStoreProvider>,
			);

			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			expect(cards.length).toBe(2);

			// ホバー前はドラッグハンドルは opacity-0
			const dragHandle = cards[0].querySelector("[title]");
			expect(dragHandle).toBeTruthy();

			// ホバーしてドラッグハンドルを表示
			await userEvent.hover(cards[0]);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// ドラッグハンドルが存在することを確認
			const handles = cards[0].querySelectorAll(
				"[class*='cursor-grab']",
			);
			expect(handles.length).toBeGreaterThan(0);
		});

		it("onReorderコールバックが渡されている場合、DndContextが機能する", async () => {
			const initialBoards = createTestBoards();
			let reorderCalled = false;

			const screen = await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<ViewerGrid
						boards={initialBoards}
						onSelectBoard={() => {}}
						onCloseBoard={() => {}}
						onReorder={() => {
							reorderCalled = true;
						}}
					/>
				</ViewerStoreProvider>,
			);

			// DndContextがレンダリングされていることを確認（カードが表示されている）
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			expect(cards.length).toBe(2);
			// onReorderはドラッグ操作でのみ呼ばれるため、ここでは呼ばれない
			expect(reorderCalled).toBe(false);
		});
	});

	describe("ViewerToolbar", () => {
		it("ボードが2つ以上あるとき、ツールバーが表示される", async () => {
			const screen = await render(
				<ViewerStoreProvider initialBoards={createTestBoards()}>
					<ViewerToolbar
						viewMode="tab"
						onViewModeChange={() => {}}
						boardCount={2}
					/>
				</ViewerStoreProvider>,
			);

			// ボード数が表示される
			const boardCount = screen.container.textContent;
			expect(boardCount).toContain("2");
		});

		it("ボードが1つのときはツールバーが表示されない", async () => {
			const screen = await render(
				<ViewerStoreProvider
					initialBoards={parseMultipleStgyCodes(SAMPLE_STGY_1)}
				>
					<ViewerToolbar
						viewMode="tab"
						onViewModeChange={() => {}}
						boardCount={1}
					/>
				</ViewerStoreProvider>,
			);

			// ツールバーが表示されない（空）
			expect(screen.container.textContent).toBe("");
		});

		it("タブモードボタンをクリックするとonViewModeChangeがtabで呼ばれる", async () => {
			let newMode: ViewerMode | null = null;

			const screen = await render(
				<ViewerStoreProvider initialBoards={createTestBoards()}>
					<ViewerToolbar
						viewMode="grid"
						onViewModeChange={(mode) => {
							newMode = mode;
						}}
						boardCount={2}
					/>
				</ViewerStoreProvider>,
			);

			// タブモードボタンをクリック
			const tabButton = screen.container.querySelector(
				"button[title*='タブ'], button[title*='Tab']",
			);
			expect(tabButton).toBeTruthy();
			await userEvent.click(tabButton!);

			expect(newMode).toBe("tab");
		});

		it("グリッドモードボタンをクリックするとonViewModeChangeがgridで呼ばれる", async () => {
			let newMode: ViewerMode | null = null;

			const screen = await render(
				<ViewerStoreProvider initialBoards={createTestBoards()}>
					<ViewerToolbar
						viewMode="tab"
						onViewModeChange={(mode) => {
							newMode = mode;
						}}
						boardCount={2}
					/>
				</ViewerStoreProvider>,
			);

			// グリッドモードボタンをクリック
			const gridButton = screen.container.querySelector(
				"button[title*='グリッド'], button[title*='Grid']",
			);
			expect(gridButton).toBeTruthy();
			await userEvent.click(gridButton!);

			expect(newMode).toBe("grid");
		});

		it("アクティブなモードのボタンがハイライトされる", async () => {
			const screen = await render(
				<ViewerStoreProvider initialBoards={createTestBoards()}>
					<ViewerToolbar
						viewMode="tab"
						onViewModeChange={() => {}}
						boardCount={2}
					/>
				</ViewerStoreProvider>,
			);

			// タブモードボタンがアクティブ（bg-primary）
			const tabButton = screen.container.querySelector(
				"button[title*='タブ'], button[title*='Tab']",
			);
			expect(tabButton?.className).toContain("bg-primary");

			// グリッドモードボタンが非アクティブ
			const gridButton = screen.container.querySelector(
				"button[title*='グリッド'], button[title*='Grid']",
			);
			expect(gridButton?.className).not.toContain("bg-primary");
		});
	});

	describe("統合テスト: 複数ボードワークフロー", () => {
		it("グリッドモードでカードをクリックするとタブモードに切り替わりそのボードがアクティブになる", async () => {
			const initialBoards = createTestBoards();
			let currentMode: ViewerMode = "grid";
			let currentActiveId: string | null = initialBoards[0].id;

			function TestComponent() {
				const boards = useViewerBoards();
				const activeId = useViewerActiveId();
				const viewMode = useViewerMode();
				const actions = useViewerActions();

				currentMode = viewMode;
				currentActiveId = activeId;

				return (
					<>
						{viewMode === "grid" && (
							<ViewerGrid
								boards={boards}
								onSelectBoard={(id) => {
									actions.setActiveBoard(id);
									actions.setViewMode("tab");
								}}
								onCloseBoard={actions.removeBoard}
							/>
						)}
					</>
				);
			}

			const screen = await render(
				<ViewerStoreProvider
					initialBoards={initialBoards}
					initialViewMode="grid"
				>
					<TestComponent />
				</ViewerStoreProvider>,
			);

			// 初期状態: グリッドモード、最初のボードがアクティブ
			expect(currentMode).toBe("grid");
			expect(currentActiveId).toBe(initialBoards[0].id);

			// 2番目のカードをクリック
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			await userEvent.click(cards[1]);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// タブモードに切り替わり、2番目のボードがアクティブ
			expect(currentMode).toBe("tab");
			expect(currentActiveId).toBe(initialBoards[1].id);
		});

		it("全てのボードを閉じるとアクティブIDがnullになる", async () => {
			const initialBoards = createTestBoards();
			let currentActiveId: string | null = initialBoards[0].id;
			let currentBoardCount = 2;
			const actionsRef: ActionsRef = { current: null };

			function TestComponent() {
				const activeId = useViewerActiveId();
				const boardCount = useViewerBoardCount();
				const actions = useViewerActions();

				currentActiveId = activeId;
				currentBoardCount = boardCount;
				actionsRef.current = actions;

				return null;
			}

			await render(
				<ViewerStoreProvider initialBoards={initialBoards}>
					<TestComponent />
				</ViewerStoreProvider>,
			);

			// 1つ目を削除
			actionsRef.current!.removeBoard(initialBoards[0].id);
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(currentBoardCount).toBe(1);
			expect(currentActiveId).toBe(initialBoards[1].id);

			// 2つ目を削除
			actionsRef.current!.removeBoard(initialBoards[1].id);
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(currentBoardCount).toBe(0);
			expect(currentActiveId).toBeNull();
		});
	});
});
