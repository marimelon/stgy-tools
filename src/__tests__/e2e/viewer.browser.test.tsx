/**
 * Viewer E2E tests using Vitest Browser Mode.
 *
 * Test targets:
 * - Loading multiple boards
 * - Tab mode (switching, closing)
 * - Grid mode (display, click to switch to tab mode)
 * - Mode switching
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

/** Ref type for calling actions from outside components */
type ActionsRef = {
	current: ReturnType<typeof useViewerActions> | null;
};

// Sample stgy codes for testing
const SAMPLE_STGY_1 =
	"[stgy:a0OcAwAYAfwgAFYAFBAAZYTLdYTLdYTLdYTLdYTLdYTLdYTLd]";
const SAMPLE_STGY_2 =
	"[stgy:ag40qa9YRyTPXZgVoFg1PhfYFKZPnDzJzfLyt51cHDkEEDia+PwMEbq7od+fEJ186kZxqHZSMHPrEWXPrSypGr47NcAkRTNWvNc4OQ8QPYGychElb-BvEZo+Os2dqLJFN5bLGkAn9j6mR4eNSYvA+eu-Zar0FYE3f+Zwa8nty3QUC86FlycOdOJ8vxFWYJmHZ0tDKEDcrVmRZol1QuWNRmlqVyTQbcN-m6t1S4EohXk05l6LzIfdDuS4rKemSgCMDOWI0]";
const SAMPLE_STGY_3 =
	"[stgy:a0OcAwAYAfwgAFYAFBAAZYTLdYTLdYTLdYTLdYTLdYTLdYTLd]";

/** Create test boards */
function createTestBoards(): ViewerBoard[] {
	return parseMultipleStgyCodes(`${SAMPLE_STGY_1}\n${SAMPLE_STGY_2}`);
}

/** State monitoring component */
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

	// Call callback on state change
	onStateChange({ boards, activeId, viewMode, boardCount });

	return null;
}

describe("Viewer E2E", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe("ViewerStoreProvider", () => {
		it("loads initial boards correctly", async () => {
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

		it("loads multiple boards with loadBoards", async () => {
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

			// Load 3 boards
			actionsRef.current!.loadBoards(
				`${SAMPLE_STGY_1}\n${SAMPLE_STGY_2}\n${SAMPLE_STGY_3}`,
			);
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(currentBoardCount).toBe(3);
		});

		it("removes a board with removeBoard", async () => {
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

			// Remove the first board
			actionsRef.current!.removeBoard(initialBoards[0].id);
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(currentBoardCount).toBe(1);
		});

		it("activates the next board when the active board is removed", async () => {
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

			// Initially the first board is active
			expect(currentActiveId).toBe(initialBoards[0].id);

			// Remove the active board
			actionsRef.current!.removeBoard(initialBoards[0].id);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// The second board becomes active
			expect(currentActiveId).toBe(initialBoards[1].id);
		});

		it("switches mode with setViewMode", async () => {
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
		it("displays tabs when there are 2 or more boards", async () => {
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

			// 2 tabs are displayed
			const tabs = screen.container.querySelectorAll("[role='tab']");
			expect(tabs.length).toBe(2);
		});

		it("hides tabs when there is only 1 board", async () => {
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

			// No tabs displayed
			const tabs = screen.container.querySelectorAll("[role='tab']");
			expect(tabs.length).toBe(0);
		});

		it("calls onSelectTab when clicking a tab", async () => {
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

			// Click the second tab
			const tabs = screen.container.querySelectorAll("[role='tab']");
			await userEvent.click(tabs[1]);

			expect(selectedId).toBe(initialBoards[1].id);
		});

		it("calls onCloseTab when clicking the close button", async () => {
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

			// Click the close button on the first tab
			const closeButtons = screen.container.querySelectorAll(
				"[role='tab'] button",
			);
			expect(closeButtons.length).toBeGreaterThan(0);
			await userEvent.click(closeButtons[0]);

			expect(closedId).toBe(initialBoards[0].id);
		});

		it("makes tabs draggable (cursor-grab style)", async () => {
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

			// Verify tabs have cursor-grab style
			const tabs = screen.container.querySelectorAll("[role='tab']");
			expect(tabs.length).toBe(2);
			expect(tabs[0].className).toContain("cursor-grab");
		});

		it("enables DndContext when onReorder callback is provided", async () => {
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

			// Verify DndContext is rendered (tabs are displayed)
			const tabs = screen.container.querySelectorAll("[role='tab']");
			expect(tabs.length).toBe(2);
			// onReorder is only called during drag operations, not here
			expect(reorderCalled).toBe(false);
		});
	});

	describe("ViewerGrid", () => {
		it("displays all boards as grid cards", async () => {
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

			// Select cards by data-testid (exclude role="button" inside BoardViewer)
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			expect(cards.length).toBe(2);
		});

		it("calls onSelectBoard when clicking a card", async () => {
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

			// Click the second card
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			await userEvent.click(cards[1]);

			expect(selectedId).toBe(initialBoards[1].id);
		});

		it("calls onCloseBoard when clicking the close button", async () => {
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

			// Hover over the card to show the close button
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			await userEvent.hover(cards[0]);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Click the close button (after the copy button)
			const buttons = cards[0].querySelectorAll("button");
			const closeButton = buttons[buttons.length - 1]; // Last button is the close button
			expect(closeButton).toBeTruthy();
			await userEvent.click(closeButton);

			expect(closedId).toBe(initialBoards[0].id);
		});

		it("copies stgyCode to clipboard when clicking the copy button", async () => {
			const initialBoards = createTestBoards();
			let copiedText: string | null = null;

			// Mock clipboard.writeText
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

			// Hover over the card to show the copy button
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			await userEvent.hover(cards[0]);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Click the copy button (order: drag handle, copy, close)
			const buttons = cards[0].querySelectorAll("button");
			expect(buttons.length).toBeGreaterThanOrEqual(3);
			await userEvent.click(buttons[1]); // Second button is copy

			// stgyCode is copied
			expect(copiedText).toBe(initialBoards[0].stgyCode);

			// Restore clipboard
			Object.defineProperty(navigator, "clipboard", {
				value: originalClipboard,
				writable: true,
				configurable: true,
			});
		});

		it("shows drag handle on hover", async () => {
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

			// Before hover, drag handle has opacity-0
			const dragHandle = cards[0].querySelector("[title]");
			expect(dragHandle).toBeTruthy();

			// Hover to show drag handle
			await userEvent.hover(cards[0]);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Verify drag handle exists
			const handles = cards[0].querySelectorAll("[class*='cursor-grab']");
			expect(handles.length).toBeGreaterThan(0);
		});

		it("enables DndContext when onReorder callback is provided", async () => {
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

			// Verify DndContext is rendered (cards are displayed)
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			expect(cards.length).toBe(2);
			// onReorder is only called during drag operations, not here
			expect(reorderCalled).toBe(false);
		});
	});

	describe("ViewerToolbar", () => {
		it("displays toolbar when there are 2 or more boards", async () => {
			const screen = await render(
				<ViewerStoreProvider initialBoards={createTestBoards()}>
					<ViewerToolbar
						viewMode="tab"
						onViewModeChange={() => {}}
						boardCount={2}
					/>
				</ViewerStoreProvider>,
			);

			// Board count is displayed
			const boardCount = screen.container.textContent;
			expect(boardCount).toContain("2");
		});

		it("hides toolbar when there is only 1 board", async () => {
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

			// Toolbar is not displayed (empty)
			expect(screen.container.textContent).toBe("");
		});

		it("calls onViewModeChange with 'tab' when clicking tab mode button", async () => {
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

			// Click the tab mode button
			const tabButton = screen.container.querySelector(
				"button[title*='タブ'], button[title*='Tab']",
			);
			expect(tabButton).toBeTruthy();
			await userEvent.click(tabButton!);

			expect(newMode).toBe("tab");
		});

		it("calls onViewModeChange with 'grid' when clicking grid mode button", async () => {
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

			// Click the grid mode button
			const gridButton = screen.container.querySelector(
				"button[title*='グリッド'], button[title*='Grid']",
			);
			expect(gridButton).toBeTruthy();
			await userEvent.click(gridButton!);

			expect(newMode).toBe("grid");
		});

		it("highlights the active mode button", async () => {
			const screen = await render(
				<ViewerStoreProvider initialBoards={createTestBoards()}>
					<ViewerToolbar
						viewMode="tab"
						onViewModeChange={() => {}}
						boardCount={2}
					/>
				</ViewerStoreProvider>,
			);

			// Tab mode button is active (bg-primary)
			const tabButton = screen.container.querySelector(
				"button[title*='タブ'], button[title*='Tab']",
			);
			expect(tabButton?.className).toContain("bg-primary");

			// Grid mode button is inactive
			const gridButton = screen.container.querySelector(
				"button[title*='グリッド'], button[title*='Grid']",
			);
			expect(gridButton?.className).not.toContain("bg-primary");
		});
	});

	describe("Integration: Multiple board workflow", () => {
		it("switches to tab mode and activates the board when clicking a card in grid mode", async () => {
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

			// Initial state: grid mode, first board is active
			expect(currentMode).toBe("grid");
			expect(currentActiveId).toBe(initialBoards[0].id);

			// Click the second card
			const cards = screen.container.querySelectorAll(
				"[data-testid='viewer-grid-card']",
			);
			await userEvent.click(cards[1]);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Switched to tab mode, second board is active
			expect(currentMode).toBe("tab");
			expect(currentActiveId).toBe(initialBoards[1].id);
		});

		it("sets activeId to null when all boards are closed", async () => {
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

			// Remove the first board
			actionsRef.current!.removeBoard(initialBoards[0].id);
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(currentBoardCount).toBe(1);
			expect(currentActiveId).toBe(initialBoards[1].id);

			// Remove the second board
			actionsRef.current!.removeBoard(initialBoards[1].id);
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(currentBoardCount).toBe(0);
			expect(currentActiveId).toBeNull();
		});

		it("loadBoards auto-switches to tab mode when loading single board", async () => {
			let currentMode: ViewerMode = "grid";
			const actionsRef: ActionsRef = { current: null };

			function TestComponent() {
				const viewMode = useViewerMode();
				const actions = useViewerActions();

				currentMode = viewMode;
				actionsRef.current = actions;

				return null;
			}

			await render(
				<ViewerStoreProvider initialBoards={[]} initialViewMode="grid">
					<TestComponent />
				</ViewerStoreProvider>,
			);

			// Initial state: grid mode
			expect(currentMode).toBe("grid");

			// Load a single board
			actionsRef.current!.loadBoards(SAMPLE_STGY_1);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Should auto-switch to tab mode when loading single board
			expect(currentMode).toBe("tab");
		});
	});
});
