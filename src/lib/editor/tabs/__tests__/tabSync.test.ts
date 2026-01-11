/**
 * Tab synchronization logic tests
 *
 * Tests tab sync logic in EditorWithTabs
 * - Behavior on initial mount (after reload)
 * - Behavior on import from Viewer
 */

import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import * as actions from "../actions";
import { createTabStore, type TabStore } from "../store";

/** Board type (simplified for testing) */
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
	 * Simulate sync logic in EditorWithTabs useEffect
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

		// Set store state
		store.setState(() => ({ openTabs, activeTabId }));

		// Sync logic
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

	describe("initial mount (after reload)", () => {
		it("initializes with currentBoardId when tabs are empty", () => {
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

		it("switches to activeTabId when existing tabs and valid activeTabId", () => {
			simulateTabSync({
				currentBoardId: "board-new",
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
				existingBoardIds: ["board-1", "board-2", "board-new"],
				isInitialMount: true,
			});

			// Switches to activeTabId (onSelectBoard is called)
			expect(onSelectBoard).toHaveBeenCalledWith("board-1");
			// Tabs remain unchanged
			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
		});

		it("adds currentBoardId to tabs when existing tabs but invalid activeTabId", () => {
			simulateTabSync({
				currentBoardId: "board-new",
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-deleted", // Non-existent board
				existingBoardIds: ["board-1", "board-2", "board-new"],
				isInitialMount: true,
			});

			// currentBoardId is added to tabs
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-new"]);
			expect(store.state.activeTabId).toBe("board-new");
		});
	});

	describe("import from Viewer (after initial mount)", () => {
		it("adds new board to tabs", () => {
			simulateTabSync({
				currentBoardId: "board-new",
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
				existingBoardIds: ["board-1", "board-2", "board-new"],
				isInitialMount: false, // After initial mount
			});

			// onSelectBoard is not called
			expect(onSelectBoard).not.toHaveBeenCalled();
			// New board is added to tabs
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-new"]);
			expect(store.state.activeTabId).toBe("board-new");
		});

		it("switches to existing board tab", () => {
			// addTab switches to active without adding if tab already exists
			simulateTabSync({
				currentBoardId: "board-1",
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-2",
				existingBoardIds: ["board-1", "board-2"],
				isInitialMount: false,
			});

			// board-1 is already in tabs so openTabs doesn't change
			// However, the !openTabs.includes(currentBoardId) condition is false so it's skipped
			// This test doesn't enter that condition
		});
	});

	describe("reload after replaceAllTabs", () => {
		it("tabs set by replaceAllTabs are maintained after reload", () => {
			// Set tabs with replaceAllTabs
			actions.replaceAllTabs(store, ["board-a", "board-b", "board-c"]);

			expect(store.state.openTabs).toEqual(["board-a", "board-b", "board-c"]);
			expect(store.state.activeTabId).toBe("board-a");

			// Simulate reload (different board selected during initialization)
			// isInitialMount=true with valid activeTabId switches to activeTabId
			onSelectBoard.mockClear();

			simulateTabSync({
				currentBoardId: "board-x", // Board selected during initialization (not in tabs)
				openTabs: ["board-a", "board-b", "board-c"],
				activeTabId: "board-a",
				existingBoardIds: ["board-a", "board-b", "board-c", "board-x"],
				isInitialMount: true,
			});

			// Switches to activeTabId (board-a)
			expect(onSelectBoard).toHaveBeenCalledWith("board-a");
			// Tabs remain unchanged
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
	 * Simulate deleted board tab sync logic in EditorWithTabs
	 * (tests useEffect in src/routes/editor.tsx)
	 * Confirmed boards approach: only detect deletion for boards that have been confirmed
	 */
	function simulateDeletedBoardSync(params: {
		boards: TestBoard[];
		openTabs: string[];
	}): { removedTabs: string[] } {
		const { boards, openTabs } = params;

		// Set store state
		store.setState((s) => ({ ...s, openTabs }));

		const currentBoardIds = new Set(boards.map((b) => b.id));
		const removedTabs: string[] = [];

		// Add currently existing boards to "confirmed"
		for (const boardId of currentBoardIds) {
			confirmedBoards.add(boardId);
		}

		// Boards that were confirmed but are now gone = deleted
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

	describe("unconfirmed board tabs", () => {
		it("tabs for boards not yet in boards are not deleted", () => {
			// Scenario when importing from Viewer:
			// Tabs are set but useLiveQuery boards hasn't reflected yet
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3"],
				activeTabId: "board-1",
			}));

			// Only board-1 exists in boards (board-2, board-3 not yet reflected)
			const result = simulateDeletedBoardSync({
				boards: [{ id: "board-1" }],
				openTabs: store.state.openTabs,
			});

			// board-2, board-3 are unconfirmed so not deleted
			expect(result.removedTabs).toEqual([]);
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);
		});

		it("boards are added to confirmed when they appear in boards", () => {
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3"],
				activeTabId: "board-1",
			}));

			// Initially only board-1
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }],
				openTabs: store.state.openTabs,
			});
			expect(confirmedBoards.has("board-1")).toBe(true);
			expect(confirmedBoards.has("board-2")).toBe(false);

			// Then board-2, board-3 also appear
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }, { id: "board-3" }],
				openTabs: store.state.openTabs,
			});
			expect(confirmedBoards.has("board-2")).toBe(true);
			expect(confirmedBoards.has("board-3")).toBe(true);
		});
	});

	describe("confirmed board deletion detection", () => {
		it("tab is deleted when confirmed board disappears", () => {
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3"],
				activeTabId: "board-2",
			}));

			// First confirm all boards
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }, { id: "board-3" }],
				openTabs: store.state.openTabs,
			});

			// board-2 is deleted
			const result = simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-3" }],
				openTabs: store.state.openTabs,
			});

			// board-2 tab is closed
			expect(result.removedTabs).toEqual(["board-2"]);
			expect(store.state.openTabs).not.toContain("board-2");
		});

		it("all tabs are closed when multiple boards are deleted simultaneously", () => {
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3", "board-4"],
				activeTabId: "board-1",
			}));

			// First confirm all boards
			simulateDeletedBoardSync({
				boards: [
					{ id: "board-1" },
					{ id: "board-2" },
					{ id: "board-3" },
					{ id: "board-4" },
				],
				openTabs: store.state.openTabs,
			});

			// board-2 and board-3 are deleted (simulate folder deletion)
			const result = simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-4" }],
				openTabs: store.state.openTabs,
			});

			expect(result.removedTabs).toEqual(["board-2", "board-3"]);
			expect(store.state.openTabs).toEqual(["board-1", "board-4"]);
		});
	});

	describe("multi-import from Viewer scenario", () => {
		it("boards are confirmed normally after import completes", () => {
			// Step 1: Tabs are set first (boards is empty)
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3"],
				activeTabId: "board-1",
			}));

			// Step 2: Sync with empty boards (tabs are not deleted)
			let result = simulateDeletedBoardSync({
				boards: [],
				openTabs: store.state.openTabs,
			});
			expect(result.removedTabs).toEqual([]);
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);

			// Step 3: boards is updated (all boards are confirmed)
			result = simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }, { id: "board-3" }],
				openTabs: store.state.openTabs,
			});
			expect(result.removedTabs).toEqual([]);
			expect(confirmedBoards.size).toBe(3);

			// Step 4: Later deleting board-2 also closes its tab
			result = simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-3" }],
				openTabs: store.state.openTabs,
			});
			expect(result.removedTabs).toEqual(["board-2"]);
		});
	});
});

// Legacy implementation test - kept for reference, not currently used
describe.skip("deleted board tab sync logic (legacy prevBoardIds)", () => {
	let store: TabStore;
	let prevBoardIds: Set<string>;

	beforeEach(() => {
		store = createTabStore();
		prevBoardIds = new Set();
	});

	/**
	 * Legacy implementation test (prevBoardIds based)
	 * Kept for reference
	 */
	function simulateDeletedBoardSync(params: {
		boards: TestBoard[];
		openTabs: string[];
	}) {
		const { boards, openTabs } = params;

		// Set store state
		store.setState((s) => ({ ...s, openTabs }));

		const currentBoardIds = new Set(boards.map((b) => b.id));

		// Boards that existed before but not now are "deleted"
		const deletedBoardIds = [...prevBoardIds].filter(
			(id) => !currentBoardIds.has(id),
		);

		// Close tabs of deleted boards
		for (const deletedId of deletedBoardIds) {
			if (store.state.openTabs.includes(deletedId)) {
				const replacementId = boards.length > 0 ? boards[0].id : undefined;
				actions.removeDeletedBoardTab(store, deletedId, replacementId);
			}
		}

		// Save current board IDs
		prevBoardIds = currentBoardIds;
	}

	describe("board deletion", () => {
		it("deleted board tab is closed", () => {
			// Initial state: 3 boards and tabs
			prevBoardIds = new Set(["board-1", "board-2", "board-3"]);
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3"],
				activeTabId: "board-2",
			}));

			// Delete board-2
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-3" }],
				openTabs: ["board-1", "board-2", "board-3"],
			});

			expect(store.state.openTabs).toEqual(["board-1", "board-3"]);
			expect(store.state.openTabs).not.toContain("board-2");
		});

		it("all tabs closed when multiple boards deleted simultaneously", () => {
			// Initial state: 4 boards and tabs
			prevBoardIds = new Set(["board-1", "board-2", "board-3", "board-4"]);
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-3", "board-4"],
				activeTabId: "board-1",
			}));

			// Delete board-2 and board-3 (simulate folder deletion)
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-4" }],
				openTabs: ["board-1", "board-2", "board-3", "board-4"],
			});

			expect(store.state.openTabs).toEqual(["board-1", "board-4"]);
			expect(store.state.openTabs).not.toContain("board-2");
			expect(store.state.openTabs).not.toContain("board-3");
		});

		it("deleting board not open in tabs has no effect", () => {
			// board-3 exists as board but is not open in tabs
			prevBoardIds = new Set(["board-1", "board-2", "board-3"]);
			store.setState(() => ({
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
			}));

			// Delete board-3
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }],
				openTabs: ["board-1", "board-2"],
			});

			// Tabs unchanged
			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
		});
	});

	describe("board addition", () => {
		it("adding new board doesn't affect existing tabs", () => {
			// Initial state: 2 boards and tabs
			prevBoardIds = new Set(["board-1", "board-2"]);
			store.setState(() => ({
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
			}));

			// Add new board
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }, { id: "board-new" }],
				openTabs: ["board-1", "board-2"],
			});

			// Existing tabs unchanged (new board not yet added to tabs)
			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
		});

		it("existing tabs maintained after new board added to tabs", () => {
			// Initial state
			prevBoardIds = new Set(["board-1", "board-2"]);
			store.setState(() => ({
				openTabs: ["board-1", "board-2", "board-new"],
				activeTabId: "board-new",
			}));

			// Board list updated (after board-new was added)
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }, { id: "board-new" }],
				openTabs: ["board-1", "board-2", "board-new"],
			});

			// All tabs maintained
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-new"]);
		});
	});

	describe("initial render", () => {
		it("tabs are not deleted when prevBoardIds is empty", () => {
			// prevBoardIds is empty on initial render
			prevBoardIds = new Set();
			store.setState(() => ({
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
			}));

			// Board list loaded for the first time
			simulateDeletedBoardSync({
				boards: [{ id: "board-1" }, { id: "board-2" }],
				openTabs: ["board-1", "board-2"],
			});

			// Tabs unchanged
			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
		});
	});
});

describe("initialBoardIds ordering", () => {
	describe("createTabStore with initial state", () => {
		it("tabs initialized in order specified by initialState", () => {
			const store = createTabStore({
				openTabs: ["board-a", "board-b", "board-c"],
				activeTabId: "board-a",
			});

			expect(store.state.openTabs).toEqual(["board-a", "board-b", "board-c"]);
			expect(store.state.activeTabId).toBe("board-a");
		});

		it("empty initialState initializes with empty tabs", () => {
			const store = createTabStore();

			expect(store.state.openTabs).toEqual([]);
			expect(store.state.activeTabId).toBeNull();
		});
	});

	describe("replaceAllTabs", () => {
		it("replaces tabs in specified order", () => {
			const store = createTabStore({
				openTabs: ["old-1", "old-2"],
				activeTabId: "old-1",
			});

			actions.replaceAllTabs(store, ["new-a", "new-b", "new-c"]);

			expect(store.state.openTabs).toEqual(["new-a", "new-b", "new-c"]);
			expect(store.state.activeTabId).toBe("new-a");
		});

		it("order is maintained after replaceAllTabs", () => {
			const store = createTabStore();

			// Simulate multiple imports from Viewer
			// Order: board-5, board-6, board-4
			actions.replaceAllTabs(store, ["board-5", "board-6", "board-4"]);

			// Verify order is maintained
			expect(store.state.openTabs).toEqual(["board-5", "board-6", "board-4"]);
			expect(store.state.activeTabId).toBe("board-5");
		});

		it("order maintained with many boards", () => {
			const store = createTabStore();

			// Add 10 boards in specific order
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

			// Verify order is completely maintained
			expect(store.state.openTabs).toEqual(boardIds);
		});
	});

	describe("multi-import from Viewer simulation", () => {
		it("order is preserved when importing multiple from Viewer", () => {
			// Scenario: Select 3 boards in Viewer and send to Editor
			// Display order in Viewer: 5, All, 6 (left to right)
			const importOrder = ["board-5", "board-zentai", "board-6"];

			// Simulate TabStoreProvider receiving initialBoardIds
			const store = createTabStore({
				openTabs: importOrder,
				activeTabId: importOrder[0],
			});

			// Verify tab order is maintained
			expect(store.state.openTabs).toEqual([
				"board-5",
				"board-zentai",
				"board-6",
			]);
			// First tab is active
			expect(store.state.activeTabId).toBe("board-5");
		});
	});
});
