/**
 * Tab ordering browser tests
 *
 * Integration tests for tab functionality using Vitest Browser Mode
 *
 * Test targets:
 * - Tab order initialization via initialBoardIds
 * - Tab display order matches specified order
 */

import "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { BoardTabs } from "@/components/editor/BoardTabs";
import { DEFAULT_GRID_SETTINGS, type StoredBoard } from "@/lib/boards/schema";
import { TabStoreProvider } from "@/lib/editor/tabs/TabStoreProvider";
import { DEFAULT_OVERLAY_SETTINGS } from "@/lib/editor/types";

/** Helper function that waits until the condition is satisfied */
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
	// Execute one final time to throw the error
	await fn();
}

/** Create test board */
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
		it("tabs are displayed in initialBoardIds order", async () => {
			// Create 3 boards (to be displayed in different order than ID order)
			const boards: StoredBoard[] = [
				createTestBoard("board-a", "Board A"),
				createTestBoard("board-b", "Board B"),
				createTestBoard("board-c", "Board C"),
			];

			// Display order: C, A, B (not alphabetical by ID)
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

			// Wait for tabs to appear
			await waitFor(() => {
				const tabs = screen.container.querySelectorAll("[data-tab-id]");
				expect(tabs.length).toBe(3);
			});

			// Verify tab order
			const tabElements = screen.container.querySelectorAll("[data-tab-id]");
			const tabIds = Array.from(tabElements).map((el) =>
				el.getAttribute("data-tab-id"),
			);
			expect(tabIds).toEqual(["board-c", "board-a", "board-b"]);
		});

		it("order is maintained with many boards", async () => {
			// Create 5 boards
			const boards: StoredBoard[] = [
				createTestBoard("id-1", "Board 1"),
				createTestBoard("id-2", "Board 2"),
				createTestBoard("id-3", "Board 3"),
				createTestBoard("id-4", "Board 4"),
				createTestBoard("id-5", "Board 5"),
			];

			// Display in specific order: 3, 1, 5, 2, 4
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

		it("first tab becomes active", async () => {
			const boards: StoredBoard[] = [
				createTestBoard("board-x", "Board X"),
				createTestBoard("board-y", "Board Y"),
				createTestBoard("board-z", "Board Z"),
			];

			// Display in order: Y, Z, X
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

			// Verify first tab ID is board-y
			const tabElements = screen.container.querySelectorAll("[data-tab-id]");
			const firstTab = tabElements[0];
			expect(firstTab?.getAttribute("data-tab-id")).toBe("board-y");
		});
	});

	describe("Tab click", () => {
		it("clicking a tab calls onSelectBoard", async () => {
			const boards: StoredBoard[] = [
				createTestBoard("board-1", "Board 1"),
				createTestBoard("board-2", "Board 2"),
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

			// Click the button inside the second tab
			const tabElements = screen.container.querySelectorAll("[data-tab-id]");
			const secondTab = tabElements[1];
			expect(secondTab).toBeTruthy();

			// Get the button element inside the tab
			const tabButton = secondTab?.querySelector("button");
			expect(tabButton).toBeTruthy();

			await userEvent.click(tabButton!);

			// Verify onSelectBoard was called
			expect(onSelectBoard).toHaveBeenCalledWith("board-2");
		});
	});

	describe("Multi-import simulation from Viewer", () => {
		it("tabs are displayed in the same order as Viewer display order", async () => {
			// Scenario: Select 3 boards in Viewer and send to Editor
			const boards: StoredBoard[] = [
				createTestBoard("board-1", "board1"),
				createTestBoard("board-2", "board2"),
				createTestBoard("board-3", "board3"),
			];

			// Viewer display order: board1, board2, board3
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

			// Verify displayed in same order as Viewer
			expect(tabIds).toEqual(["board-1", "board-2", "board-3"]);

			// Also verify tab names
			const tabNames = Array.from(tabElements).map(
				(el) => el.textContent?.trim().replace(/×$/, "").trim(), // Remove close button text
			);
			expect(tabNames[0]).toContain("board1");
			expect(tabNames[1]).toContain("board2");
			expect(tabNames[2]).toContain("board3");
		});
	});

	describe("onInitialBoardIdsConsumed callback", () => {
		it("callback is called after initialBoardIds are consumed", async () => {
			const boards: StoredBoard[] = [
				createTestBoard("board-1", "Board 1"),
				createTestBoard("board-2", "Board 2"),
			];

			const initialBoardIds = ["board-1", "board-2"];
			const onConsumed = vi.fn();

			const screen = await render(
				<TabStoreProvider
					initialBoardIds={initialBoardIds}
					onInitialBoardIdsConsumed={onConsumed}
				>
					<BoardTabs
						boards={boards}
						unsavedBoardIds={new Set()}
						onSelectBoard={vi.fn()}
						onAddClick={vi.fn()}
						onDuplicateBoard={vi.fn()}
					/>
				</TabStoreProvider>,
			);

			// Wait for tabs to render
			await waitFor(() => {
				const tabs = screen.container.querySelectorAll("[data-tab-id]");
				expect(tabs.length).toBe(2);
			});

			// Callback should have been called
			await waitFor(() => {
				expect(onConsumed).toHaveBeenCalledTimes(1);
			});
		});

		it("callback is not called when initialBoardIds is null", async () => {
			const boards: StoredBoard[] = [createTestBoard("board-1", "Board 1")];

			const onConsumed = vi.fn();

			await render(
				<TabStoreProvider
					initialBoardIds={null}
					onInitialBoardIdsConsumed={onConsumed}
				>
					<BoardTabs
						boards={boards}
						unsavedBoardIds={new Set()}
						onSelectBoard={vi.fn()}
						onAddClick={vi.fn()}
						onDuplicateBoard={vi.fn()}
					/>
				</TabStoreProvider>,
			);

			// Wait a bit to ensure callback would have been called if it was going to be
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Callback should NOT have been called
			expect(onConsumed).not.toHaveBeenCalled();
		});

		it("callback is not called when initialBoardIds is empty array", async () => {
			const boards: StoredBoard[] = [createTestBoard("board-1", "Board 1")];

			const onConsumed = vi.fn();

			await render(
				<TabStoreProvider
					initialBoardIds={[]}
					onInitialBoardIdsConsumed={onConsumed}
				>
					<BoardTabs
						boards={boards}
						unsavedBoardIds={new Set()}
						onSelectBoard={vi.fn()}
						onAddClick={vi.fn()}
						onDuplicateBoard={vi.fn()}
					/>
				</TabStoreProvider>,
			);

			// Wait a bit to ensure callback would have been called if it was going to be
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Callback should NOT have been called
			expect(onConsumed).not.toHaveBeenCalled();
		});
	});
});
