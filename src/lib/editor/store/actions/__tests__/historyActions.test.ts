/**
 * 履歴アクションのテスト
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
		const board = createEmptyBoard("テストボード");
		const initialState = createInitialStateWithOptions({ board });
		store = new Store<EditorState>(initialState);
		historyActions = createHistoryActions(store);
		objectActions = createObjectActions(store);
	});

	describe("undo", () => {
		it("変更を元に戻せる", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			expect(store.state.board.objects).toHaveLength(1);

			historyActions.undo();

			expect(store.state.board.objects).toHaveLength(0);
		});

		it("初期状態では何も起きない", () => {
			const initialHistoryIndex = store.state.historyIndex;

			historyActions.undo();

			expect(store.state.historyIndex).toBe(initialHistoryIndex);
		});

		it("連続してundoできる", () => {
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

		it("選択が解除される", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			expect(store.state.selectedIds).toHaveLength(1);

			historyActions.undo();

			expect(store.state.selectedIds).toHaveLength(0);
		});
	});

	describe("redo", () => {
		it("undoした変更をやり直せる", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);
			historyActions.undo();

			expect(store.state.board.objects).toHaveLength(0);

			historyActions.redo();

			expect(store.state.board.objects).toHaveLength(1);
		});

		it("undoしていない状態では何も起きない", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			const historyIndex = store.state.historyIndex;

			historyActions.redo();

			expect(store.state.historyIndex).toBe(historyIndex);
		});

		it("連続してredoできる", () => {
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

	describe("undo/redo の組み合わせ", () => {
		it("undoしてから新しい変更をすると、redo履歴が消える", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);
			const obj3 = createDefaultObject(ObjectIds.DPS);

			objectActions.addObject(obj1);
			objectActions.addObject(obj2);
			historyActions.undo();

			// obj2を追加した状態からundoしたので、obj1だけの状態
			expect(store.state.board.objects).toHaveLength(1);

			// 新しいオブジェクトを追加
			objectActions.addObject(obj3);

			// redoしても何も起きない（履歴が上書きされている）
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
		it("ボードを設定できる", () => {
			const newBoard = createEmptyBoard("新しいボード");
			newBoard.backgroundId = 3;

			historyActions.setBoard(newBoard);

			expect(store.state.board.name).toBe("新しいボード");
			expect(store.state.board.backgroundId).toBe(3);
		});

		it("選択とグループがリセットされる", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			const newBoard = createEmptyBoard("新しいボード");
			historyActions.setBoard(newBoard);

			expect(store.state.selectedIds).toHaveLength(0);
			expect(store.state.groups).toHaveLength(0);
		});

		it("履歴がリセットされる", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);
			objectActions.addObject(obj1);
			objectActions.addObject(obj2);

			const newBoard = createEmptyBoard("新しいボード");
			historyActions.setBoard(newBoard);

			expect(store.state.history).toHaveLength(1);
			expect(store.state.historyIndex).toBe(0);
		});

		it("isDirtyがfalseになる", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);
			expect(store.state.isDirty).toBe(true);

			const newBoard = createEmptyBoard("新しいボード");
			historyActions.setBoard(newBoard);

			expect(store.state.isDirty).toBe(false);
		});
	});

	describe("updateBoardMeta", () => {
		it("ボード名を更新できる", () => {
			historyActions.updateBoardMeta({ name: "更新された名前" });

			expect(store.state.board.name).toBe("更新された名前");
		});

		it("背景IDを更新できる", () => {
			historyActions.updateBoardMeta({ backgroundId: 5 });

			expect(store.state.board.backgroundId).toBe(5);
		});

		it("isDirtyがtrueになる", () => {
			expect(store.state.isDirty).toBe(false);

			historyActions.updateBoardMeta({ name: "新しい名前" });

			expect(store.state.isDirty).toBe(true);
		});
	});

	describe("commitHistory", () => {
		it("履歴にエントリを追加できる", () => {
			const initialLength = store.state.history.length;

			// 直接状態を変更（通常はactionを通すが、テスト用）
			store.setState((s) => ({
				...s,
				board: { ...s.board, name: "変更後" },
			}));

			historyActions.commitHistory("名前変更");

			expect(store.state.history.length).toBe(initialLength + 1);
		});

		it("変更がない場合は履歴に追加されない", () => {
			const initialLength = store.state.history.length;

			// 何も変更せずにcommit
			historyActions.commitHistory("何もなし");

			expect(store.state.history.length).toBe(initialLength);
		});
	});

	describe("jumpToHistory", () => {
		it("任意の履歴位置に移動できる", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);
			const obj3 = createDefaultObject(ObjectIds.DPS);

			objectActions.addObject(obj1);
			objectActions.addObject(obj2);
			objectActions.addObject(obj3);

			// 履歴: [初期, obj1追加, obj2追加, obj3追加]
			// index: 0      1         2         3

			historyActions.jumpToHistory(1);

			expect(store.state.board.objects).toHaveLength(1);
			expect(store.state.historyIndex).toBe(1);
		});

		it("範囲外のインデックスでは何も起きない", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			const historyIndex = store.state.historyIndex;

			historyActions.jumpToHistory(100);

			expect(store.state.historyIndex).toBe(historyIndex);
		});

		it("同じ位置への移動は無視される", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			const historyIndex = store.state.historyIndex;

			historyActions.jumpToHistory(historyIndex);

			// 同じ状態が維持される
			expect(store.state.historyIndex).toBe(historyIndex);
		});
	});

	describe("clearHistory", () => {
		it("履歴をクリアできる", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);
			objectActions.addObject(obj1);
			objectActions.addObject(obj2);

			expect(store.state.history.length).toBeGreaterThan(1);

			historyActions.clearHistory();

			expect(store.state.history).toHaveLength(1);
			expect(store.state.historyIndex).toBe(0);
		});

		it("現在のボード状態は維持される", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			objectActions.addObject(obj);

			historyActions.clearHistory();

			// オブジェクトは残っている
			expect(store.state.board.objects).toHaveLength(1);
		});
	});
});
