/**
 * Tab actions unit tests
 */

import { beforeEach, describe, expect, it } from "vitest";
import * as actions from "../actions";
import { createTabStore, type TabStore } from "../store";
import { MAX_TABS } from "../types";

describe("tab actions", () => {
	let store: TabStore;

	beforeEach(() => {
		store = createTabStore();
	});

	describe("addTab", () => {
		it("adds a new tab and sets it as active", () => {
			const result = actions.addTab(store, "board-1");

			expect(result).toBe(true);
			expect(store.state.openTabs).toEqual(["board-1"]);
			expect(store.state.activeTabId).toBe("board-1");
		});

		it("adds multiple tabs", () => {
			actions.addTab(store, "board-1");
			actions.addTab(store, "board-2");
			actions.addTab(store, "board-3");

			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);
			expect(store.state.activeTabId).toBe("board-3");
		});

		it("does not duplicate existing tab but switches to it", () => {
			actions.addTab(store, "board-1");
			actions.addTab(store, "board-2");
			const result = actions.addTab(store, "board-1");

			expect(result).toBe(false);
			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
			expect(store.state.activeTabId).toBe("board-1");
		});

		it("respects MAX_TABS limit", () => {
			// Add MAX_TABS boards
			for (let i = 0; i < MAX_TABS; i++) {
				actions.addTab(store, `board-${i}`);
			}

			expect(store.state.openTabs).toHaveLength(MAX_TABS);

			// Try to add one more
			const result = actions.addTab(store, "board-extra");

			expect(result).toBe(false);
			expect(store.state.openTabs).toHaveLength(MAX_TABS);
			expect(store.state.openTabs).not.toContain("board-extra");
		});
	});

	describe("closeTab", () => {
		beforeEach(() => {
			actions.addTab(store, "board-1");
			actions.addTab(store, "board-2");
			actions.addTab(store, "board-3");
		});

		it("closes a non-active tab", () => {
			const result = actions.closeTab(store, "board-1");

			expect(result).toBe(true);
			expect(store.state.openTabs).toEqual(["board-2", "board-3"]);
			expect(store.state.activeTabId).toBe("board-3");
		});

		it("closes active tab and switches to next tab", () => {
			actions.switchTab(store, "board-2");
			const result = actions.closeTab(store, "board-2");

			expect(result).toBe(true);
			expect(store.state.openTabs).toEqual(["board-1", "board-3"]);
			expect(store.state.activeTabId).toBe("board-3");
		});

		it("closes last active tab and switches to previous", () => {
			actions.switchTab(store, "board-3");
			const result = actions.closeTab(store, "board-3");

			expect(result).toBe(true);
			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
			expect(store.state.activeTabId).toBe("board-2");
		});

		it("cannot close the last remaining tab", () => {
			actions.closeTab(store, "board-1");
			actions.closeTab(store, "board-2");
			const result = actions.closeTab(store, "board-3");

			expect(result).toBe(false);
			expect(store.state.openTabs).toEqual(["board-3"]);
		});

		it("returns false for non-existent tab", () => {
			const result = actions.closeTab(store, "non-existent");

			expect(result).toBe(false);
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);
		});
	});

	describe("switchTab", () => {
		beforeEach(() => {
			actions.addTab(store, "board-1");
			actions.addTab(store, "board-2");
		});

		it("switches to an existing tab", () => {
			actions.switchTab(store, "board-1");

			expect(store.state.activeTabId).toBe("board-1");
			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
		});

		it("does nothing for non-existent tab", () => {
			actions.switchTab(store, "non-existent");

			expect(store.state.activeTabId).toBe("board-2");
		});
	});

	describe("closeOtherTabs", () => {
		beforeEach(() => {
			actions.addTab(store, "board-1");
			actions.addTab(store, "board-2");
			actions.addTab(store, "board-3");
		});

		it("closes all tabs except the specified one", () => {
			actions.closeOtherTabs(store, "board-2");

			expect(store.state.openTabs).toEqual(["board-2"]);
			expect(store.state.activeTabId).toBe("board-2");
		});

		it("does nothing for non-existent tab", () => {
			actions.closeOtherTabs(store, "non-existent");

			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);
		});
	});

	describe("closeTabsToRight", () => {
		beforeEach(() => {
			actions.addTab(store, "board-1");
			actions.addTab(store, "board-2");
			actions.addTab(store, "board-3");
			actions.addTab(store, "board-4");
		});

		it("closes all tabs to the right of the specified one", () => {
			actions.closeTabsToRight(store, "board-2");

			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
		});

		it("updates active tab if it was closed", () => {
			actions.switchTab(store, "board-4");
			actions.closeTabsToRight(store, "board-2");

			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
			expect(store.state.activeTabId).toBe("board-2");
		});

		it("keeps active tab if it was not closed", () => {
			actions.switchTab(store, "board-1");
			actions.closeTabsToRight(store, "board-2");

			expect(store.state.openTabs).toEqual(["board-1", "board-2"]);
			expect(store.state.activeTabId).toBe("board-1");
		});

		it("does nothing for last tab", () => {
			actions.closeTabsToRight(store, "board-4");

			expect(store.state.openTabs).toEqual([
				"board-1",
				"board-2",
				"board-3",
				"board-4",
			]);
		});

		it("does nothing for non-existent tab", () => {
			actions.closeTabsToRight(store, "non-existent");

			expect(store.state.openTabs).toEqual([
				"board-1",
				"board-2",
				"board-3",
				"board-4",
			]);
		});
	});

	describe("reorderTabs", () => {
		beforeEach(() => {
			actions.addTab(store, "board-1");
			actions.addTab(store, "board-2");
			actions.addTab(store, "board-3");
		});

		it("moves tab from one position to another", () => {
			actions.reorderTabs(store, 0, 2);

			expect(store.state.openTabs).toEqual(["board-2", "board-3", "board-1"]);
		});

		it("moves tab to earlier position", () => {
			actions.reorderTabs(store, 2, 0);

			expect(store.state.openTabs).toEqual(["board-3", "board-1", "board-2"]);
		});

		it("does nothing for same position", () => {
			actions.reorderTabs(store, 1, 1);

			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);
		});

		it("does nothing for invalid indices", () => {
			actions.reorderTabs(store, -1, 1);
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);

			actions.reorderTabs(store, 1, -1);
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);

			actions.reorderTabs(store, 10, 1);
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);

			actions.reorderTabs(store, 1, 10);
			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);
		});
	});

	describe("removeDeletedBoardTab", () => {
		beforeEach(() => {
			actions.addTab(store, "board-1");
			actions.addTab(store, "board-2");
			actions.addTab(store, "board-3");
		});

		it("removes deleted board tab", () => {
			actions.removeDeletedBoardTab(store, "board-2");

			expect(store.state.openTabs).toEqual(["board-1", "board-3"]);
		});

		it("updates active tab when deleted board was active", () => {
			actions.switchTab(store, "board-2");
			actions.removeDeletedBoardTab(store, "board-2");

			expect(store.state.openTabs).toEqual(["board-1", "board-3"]);
			expect(store.state.activeTabId).toBe("board-3");
		});

		it("allows closing last tab with replacement", () => {
			actions.closeTab(store, "board-1");
			actions.closeTab(store, "board-2");
			actions.removeDeletedBoardTab(store, "board-3", "board-new");

			expect(store.state.openTabs).toEqual(["board-new"]);
			expect(store.state.activeTabId).toBe("board-new");
		});

		it("does nothing for non-existent tab", () => {
			actions.removeDeletedBoardTab(store, "non-existent");

			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);
		});
	});

	describe("initializeTabs", () => {
		it("initializes with valid tabs", () => {
			const existingBoardIds = new Set(["board-1", "board-2", "board-3"]);
			actions.initializeTabs(
				store,
				["board-1", "board-2", "board-3"],
				"board-2",
				existingBoardIds,
			);

			expect(store.state.openTabs).toEqual(["board-1", "board-2", "board-3"]);
			expect(store.state.activeTabId).toBe("board-2");
		});

		it("filters out deleted boards", () => {
			const existingBoardIds = new Set(["board-1", "board-3"]);
			actions.initializeTabs(
				store,
				["board-1", "board-2", "board-3"],
				"board-2",
				existingBoardIds,
			);

			expect(store.state.openTabs).toEqual(["board-1", "board-3"]);
			expect(store.state.activeTabId).toBe("board-1");
		});

		it("sets first tab as active if active tab was deleted", () => {
			const existingBoardIds = new Set(["board-1", "board-3"]);
			actions.initializeTabs(
				store,
				["board-1", "board-2", "board-3"],
				"board-2",
				existingBoardIds,
			);

			expect(store.state.activeTabId).toBe("board-1");
		});

		it("handles empty tabs", () => {
			const existingBoardIds = new Set<string>();
			actions.initializeTabs(store, [], null, existingBoardIds);

			expect(store.state.openTabs).toEqual([]);
			expect(store.state.activeTabId).toBeNull();
		});
	});

	describe("setInitialTab", () => {
		it("sets a single tab as the only open tab", () => {
			actions.setInitialTab(store, "board-1");

			expect(store.state.openTabs).toEqual(["board-1"]);
			expect(store.state.activeTabId).toBe("board-1");
		});

		it("replaces existing tabs", () => {
			actions.addTab(store, "board-1");
			actions.addTab(store, "board-2");
			actions.setInitialTab(store, "board-3");

			expect(store.state.openTabs).toEqual(["board-3"]);
			expect(store.state.activeTabId).toBe("board-3");
		});
	});
});
