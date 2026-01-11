/**
 * History action tests
 */

import { Store } from "@tanstack/store";
import { beforeEach, describe, expect, it } from "vitest";
import { ObjectIds } from "@/lib/stgy";
import { createDefaultObject, createEmptyBoard } from "../../../factory";
import { createInitialStateWithOptions } from "../../../reducer";
import type { EditorState } from "../../../types";
import type { EditorStore } from "../../types";
import { createHistoryActions } from "../historyActions";
import { createObjectActions } from "../objectActions";

describe("historyActions", () => {
	let store: EditorStore;
	let historyActions: ReturnType<typeof createHistoryActions>;
	let objectActions: ReturnType<typeof createObjectActions>;

	beforeEach(() => {
		const board = createEmptyBoard("Test Board");
		const initialState = createInitialStateWithOptions({ board });
		store = new Store<EditorState>(initialState);
		historyActions = createHistoryActions(store);
		objectActions = createObjectActions(store);
	});

	describe("undo", () => {
		it("can undo changes", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			expect(store.state.board.objects).toHaveLength(1);

			historyActions.undo();

			expect(store.state.board.objects).toHaveLength(0);
		});

		it("does nothing in initial state", () => {
			const initialHistoryIndex = store.state.historyIndex;

			historyActions.undo();

			expect(store.state.historyIndex).toBe(initialHistoryIndex);
		});

		it("can undo consecutively", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);

			objectActions.addObject(obj1);
			objectActions.addObject(obj2);

			expect(store.state.board.objects).toHaveLength(2);

			historyActions.undo();
			expect(store.state.board.objects).toHaveLength(1);

			historyActions.undo();
			expect(store.state.board.objects).toHaveLength(0);
		});

		it("clears selection", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			expect(store.state.selectedIds).toHaveLength(1);

			historyActions.undo();

			expect(store.state.selectedIds).toHaveLength(0);
		});
	});

	describe("redo", () => {
		it("can redo undone changes", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);
			historyActions.undo();

			expect(store.state.board.objects).toHaveLength(0);

			historyActions.redo();

			expect(store.state.board.objects).toHaveLength(1);
		});

		it("does nothing when not undone", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			const historyIndex = store.state.historyIndex;

			historyActions.redo();

			expect(store.state.historyIndex).toBe(historyIndex);
		});

		it("can redo consecutively", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);

			objectActions.addObject(obj1);
			objectActions.addObject(obj2);
			historyActions.undo();
			historyActions.undo();

			expect(store.state.board.objects).toHaveLength(0);

			historyActions.redo();
			expect(store.state.board.objects).toHaveLength(1);

			historyActions.redo();
			expect(store.state.board.objects).toHaveLength(2);
		});
	});

	describe("undo/redo combination", () => {
		it("new changes after undo clear redo history", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);
			const obj3 = createDefaultObject(ObjectIds.DPS);

			objectActions.addObject(obj1);
			objectActions.addObject(obj2);
			historyActions.undo();

			// After undoing obj2 add, only obj1 remains
			expect(store.state.board.objects).toHaveLength(1);

			// Add new object
			objectActions.addObject(obj3);

			// Redo does nothing (history was overwritten)
			historyActions.redo();
			expect(store.state.board.objects).toHaveLength(2);
			expect(store.state.board.objects.some((o) => o.id === obj3.id)).toBe(
				true,
			);
			expect(store.state.board.objects.some((o) => o.id === obj2.id)).toBe(
				false,
			);
		});
	});

	describe("setBoard", () => {
		it("can set board", () => {
			const newBoard = createEmptyBoard("New Board");
			newBoard.backgroundId = 3;

			historyActions.setBoard(newBoard);

			expect(store.state.board.name).toBe("New Board");
			expect(store.state.board.backgroundId).toBe(3);
		});

		it("resets selection and groups", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			const newBoard = createEmptyBoard("New Board");
			historyActions.setBoard(newBoard);

			expect(store.state.selectedIds).toHaveLength(0);
			expect(store.state.groups).toHaveLength(0);
		});

		it("resets history", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);
			objectActions.addObject(obj1);
			objectActions.addObject(obj2);

			const newBoard = createEmptyBoard("New Board");
			historyActions.setBoard(newBoard);

			expect(store.state.history).toHaveLength(1);
			expect(store.state.historyIndex).toBe(0);
		});

		it("sets isDirty to false", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);
			expect(store.state.isDirty).toBe(true);

			const newBoard = createEmptyBoard("New Board");
			historyActions.setBoard(newBoard);

			expect(store.state.isDirty).toBe(false);
		});
	});

	describe("updateBoardMeta", () => {
		it("can update board name", () => {
			historyActions.updateBoardMeta({ name: "Updated Name" });

			expect(store.state.board.name).toBe("Updated Name");
		});

		it("can update background ID", () => {
			historyActions.updateBoardMeta({ backgroundId: 5 });

			expect(store.state.board.backgroundId).toBe(5);
		});

		it("sets isDirty to true", () => {
			expect(store.state.isDirty).toBe(false);

			historyActions.updateBoardMeta({ name: "New Name" });

			expect(store.state.isDirty).toBe(true);
		});
	});

	describe("commitHistory", () => {
		it("can add history entry", () => {
			const initialLength = store.state.history.length;

			// Directly modify state (normally through action, but for testing)
			store.setState((s) => ({
				...s,
				board: { ...s.board, name: "Changed" },
			}));

			historyActions.commitHistory("Name change");

			expect(store.state.history.length).toBe(initialLength + 1);
		});

		it("does not add history if no changes", () => {
			const initialLength = store.state.history.length;

			// Commit without changes
			historyActions.commitHistory("Nothing");

			expect(store.state.history.length).toBe(initialLength);
		});
	});

	describe("jumpToHistory", () => {
		it("can jump to any history position", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);
			const obj3 = createDefaultObject(ObjectIds.DPS);

			objectActions.addObject(obj1);
			objectActions.addObject(obj2);
			objectActions.addObject(obj3);

			// History: [initial, add obj1, add obj2, add obj3]
			// index:    0        1          2          3

			historyActions.jumpToHistory(1);

			expect(store.state.board.objects).toHaveLength(1);
			expect(store.state.historyIndex).toBe(1);
		});

		it("does nothing for out-of-range index", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			const historyIndex = store.state.historyIndex;

			historyActions.jumpToHistory(100);

			expect(store.state.historyIndex).toBe(historyIndex);
		});

		it("ignores jump to same position", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			const historyIndex = store.state.historyIndex;

			historyActions.jumpToHistory(historyIndex);

			// Same state maintained
			expect(store.state.historyIndex).toBe(historyIndex);
		});
	});

	describe("clearHistory", () => {
		it("can clear history", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);
			objectActions.addObject(obj1);
			objectActions.addObject(obj2);

			expect(store.state.history.length).toBeGreaterThan(1);

			historyActions.clearHistory();

			expect(store.state.history).toHaveLength(1);
			expect(store.state.historyIndex).toBe(0);
		});

		it("preserves current board state", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			historyActions.clearHistory();

			// Object is preserved
			expect(store.state.board.objects).toHaveLength(1);
		});
	});
});
