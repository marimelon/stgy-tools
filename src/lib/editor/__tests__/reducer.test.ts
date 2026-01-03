/**
 * エディターReducerのテスト
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ObjectIds } from "@/lib/stgy";
import { hasClipboardData } from "../clipboard";
import { createDefaultObject, createEmptyBoard } from "../factory";
import {
	createInitialState,
	createInitialStateWithOptions,
	editorReducer,
} from "../reducer";
import { DEFAULT_OVERLAY_SETTINGS, type EditorState } from "../types";

describe("reducer", () => {
	let initialState: EditorState;
	let obj0Id: string;
	let obj1Id: string;
	let obj2Id: string;

	beforeEach(() => {
		const board = createEmptyBoard("テスト");
		const obj0 = createDefaultObject(ObjectIds.Tank, { x: 100, y: 100 });
		const obj1 = createDefaultObject(ObjectIds.Healer, { x: 200, y: 100 });
		const obj2 = createDefaultObject(ObjectIds.DPS, { x: 300, y: 100 });
		obj0Id = obj0.id;
		obj1Id = obj1.id;
		obj2Id = obj2.id;
		board.objects = [obj0, obj1, obj2];
		initialState = createInitialState(board);
	});

	describe("createInitialState", () => {
		it("初期状態を正しく生成", () => {
			const board = createEmptyBoard();
			const state = createInitialState(board);

			expect(state.board.name).toBe("");
			expect(state.selectedIds).toEqual([]);
			expect(state.groups).toEqual([]);
			expect(state.history).toHaveLength(1);
			expect(state.historyIndex).toBe(0);
			expect(state.isDirty).toBe(false);
			expect(state.editingTextId).toBeNull();
		});

		it("オプション付きで初期状態を生成", () => {
			const board = createEmptyBoard();
			const obj = createDefaultObject(ObjectIds.Tank, { x: 100, y: 100 });
			const obj2 = createDefaultObject(ObjectIds.Healer, { x: 200, y: 100 });
			board.objects = [obj, obj2];
			const groups = [
				{ id: "g1", name: "Group 1", objectIds: [obj.id, obj2.id] },
			];
			const gridSettings = {
				enabled: true,
				size: 32,
				showGrid: true,
				overlayType: "none" as const,
				showBackground: true,
				canvasColor: "slate-800" as const,
				overlaySettings: DEFAULT_OVERLAY_SETTINGS,
			};

			const state = createInitialStateWithOptions({
				board,
				groups,
				gridSettings,
			});

			expect(state.groups).toHaveLength(1);
			expect(state.gridSettings.enabled).toBe(true);
			expect(state.gridSettings.size).toBe(32);
		});
	});

	describe("SELECT_OBJECT", () => {
		it("オブジェクトを選択", () => {
			const state = editorReducer(initialState, {
				type: "SELECT_OBJECT",
				objectId: obj1Id,
			});
			expect(state.selectedIds).toEqual([obj1Id]);
		});

		it("追加選択", () => {
			let state = editorReducer(initialState, {
				type: "SELECT_OBJECT",
				objectId: obj0Id,
			});
			state = editorReducer(state, {
				type: "SELECT_OBJECT",
				objectId: obj1Id,
				additive: true,
			});
			expect(state.selectedIds).toEqual([obj0Id, obj1Id]);
		});

		it("追加選択で既に選択済みなら解除", () => {
			let state = editorReducer(initialState, {
				type: "SELECT_OBJECTS",
				objectIds: [obj0Id, obj1Id, obj2Id],
			});
			state = editorReducer(state, {
				type: "SELECT_OBJECT",
				objectId: obj1Id,
				additive: true,
			});
			expect(state.selectedIds).toEqual([obj0Id, obj2Id]);
		});

		it("非追加選択は既存選択をクリア", () => {
			let state = editorReducer(initialState, {
				type: "SELECT_OBJECTS",
				objectIds: [obj0Id, obj1Id],
			});
			state = editorReducer(state, {
				type: "SELECT_OBJECT",
				objectId: obj2Id,
			});
			expect(state.selectedIds).toEqual([obj2Id]);
		});
	});

	describe("DESELECT_ALL", () => {
		it("全選択解除", () => {
			let state = editorReducer(initialState, {
				type: "SELECT_OBJECTS",
				objectIds: [obj0Id, obj1Id, obj2Id],
			});
			state = editorReducer(state, { type: "DESELECT_ALL" });
			expect(state.selectedIds).toEqual([]);
		});
	});

	describe("UPDATE_OBJECT", () => {
		it("オブジェクトを更新", () => {
			const state = editorReducer(initialState, {
				type: "UPDATE_OBJECT",
				objectId: obj0Id,
				updates: { rotation: 45 },
			});
			expect(state.board.objects[0].rotation).toBe(45);
		});

		it("位置を更新", () => {
			const state = editorReducer(initialState, {
				type: "UPDATE_OBJECT",
				objectId: obj0Id,
				updates: { position: { x: 50, y: 50 } },
			});
			expect(state.board.objects[0].position).toEqual({ x: 50, y: 50 });
		});

		it("元の状態は変更しない（イミュータブル）", () => {
			const originalPosition = { ...initialState.board.objects[0].position };
			editorReducer(initialState, {
				type: "UPDATE_OBJECT",
				objectId: obj0Id,
				updates: { position: { x: 999, y: 999 } },
			});
			expect(initialState.board.objects[0].position).toEqual(originalPosition);
		});
	});

	describe("ADD_OBJECT", () => {
		it("オブジェクトを追加（先頭に追加される）", () => {
			const newObj = createDefaultObject(ObjectIds.CircleAoE);
			const state = editorReducer(initialState, {
				type: "ADD_OBJECT",
				object: newObj,
			});
			expect(state.board.objects).toHaveLength(4);
			expect(state.board.objects[0].objectId).toBe(ObjectIds.CircleAoE); // 先頭に追加
			expect(state.selectedIds).toEqual([newObj.id]); // 新規追加は自動選択
		});
	});

	describe("DELETE_OBJECTS", () => {
		it("選択オブジェクトを削除", () => {
			const state = editorReducer(initialState, {
				type: "DELETE_OBJECTS",
				objectIds: [obj1Id],
			});
			expect(state.board.objects).toHaveLength(2);
			expect(state.board.objects[0].objectId).toBe(ObjectIds.Tank);
			expect(state.board.objects[1].objectId).toBe(ObjectIds.DPS);
		});

		it("複数オブジェクトを削除", () => {
			const state = editorReducer(initialState, {
				type: "DELETE_OBJECTS",
				objectIds: [obj0Id, obj2Id],
			});
			expect(state.board.objects).toHaveLength(1);
			expect(state.board.objects[0].objectId).toBe(ObjectIds.Healer);
		});

		it("削除後は選択解除", () => {
			let state = editorReducer(initialState, {
				type: "SELECT_OBJECT",
				objectId: obj1Id,
			});
			state = editorReducer(state, {
				type: "DELETE_OBJECTS",
				objectIds: [obj1Id],
			});
			expect(state.selectedIds).toEqual([]);
		});
	});

	describe("DUPLICATE_OBJECTS", () => {
		it("オブジェクトを複製", () => {
			const state = editorReducer(initialState, {
				type: "DUPLICATE_OBJECTS",
				objectIds: [obj0Id],
			});
			expect(state.board.objects).toHaveLength(4);
			expect(state.board.objects[3].objectId).toBe(ObjectIds.Tank);
			expect(state.board.objects[3].position.x).toBe(110); // +10
		});

		it("複製後は複製したオブジェクトを選択", () => {
			const state = editorReducer(initialState, {
				type: "DUPLICATE_OBJECTS",
				objectIds: [obj0Id, obj1Id],
			});
			// 複製されたオブジェクトは新しいIDを持つ
			expect(state.selectedIds).toHaveLength(2);
			// 新しいIDは元のIDとは異なる
			expect(state.selectedIds).not.toContain(obj0Id);
			expect(state.selectedIds).not.toContain(obj1Id);
		});
	});

	describe("MOVE_OBJECTS", () => {
		it("オブジェクトを移動", () => {
			const state = editorReducer(initialState, {
				type: "MOVE_OBJECTS",
				objectIds: [obj0Id],
				deltaX: 50,
				deltaY: 25,
			});
			expect(state.board.objects[0].position).toEqual({ x: 150, y: 125 });
		});

		it("複数オブジェクトを同時移動", () => {
			const state = editorReducer(initialState, {
				type: "MOVE_OBJECTS",
				objectIds: [obj0Id, obj1Id],
				deltaX: 10,
				deltaY: 10,
			});
			expect(state.board.objects[0].position).toEqual({ x: 110, y: 110 });
			expect(state.board.objects[1].position).toEqual({ x: 210, y: 110 });
		});

		it("MOVE_OBJECTSはlockedフラグをチェックしない（UIレイヤーで制御）", () => {
			// まずロック
			let state = editorReducer(initialState, {
				type: "UPDATE_OBJECT",
				objectId: obj0Id,
				updates: {
					flags: { ...initialState.board.objects[0].flags, locked: true },
				},
			});
			// 移動を試行 - reducerレベルではlockedは無視される
			state = editorReducer(state, {
				type: "MOVE_OBJECTS",
				objectIds: [obj0Id],
				deltaX: 50,
				deltaY: 50,
			});
			// UIレイヤー（useCanvasInteraction等）でロックチェックを行うため、reducer自体は移動する
			expect(state.board.objects[0].position).toEqual({ x: 150, y: 150 });
		});
	});

	describe("UNDO/REDO", () => {
		it("変更がなければ履歴を追加しない", () => {
			// 初期状態で履歴コミットを試行
			const state = editorReducer(initialState, {
				type: "COMMIT_HISTORY",
				description: "変更なし",
			});
			// 変更がないので履歴数は1のまま
			expect(state.history).toHaveLength(1);
			expect(state.historyIndex).toBe(0);
		});

		it("変更があれば履歴を追加する", () => {
			// 変更を加える
			let state = editorReducer(initialState, {
				type: "UPDATE_OBJECT",
				objectId: obj0Id,
				updates: { rotation: 45 },
			});
			// 履歴をコミット
			state = editorReducer(state, {
				type: "COMMIT_HISTORY",
				description: "回転変更",
			});
			// 変更があるので履歴が追加される
			expect(state.history).toHaveLength(2);
			expect(state.historyIndex).toBe(1);
		});

		it("同じ状態への変更は履歴追加しない", () => {
			// 変更を加えて履歴コミット
			let state = editorReducer(initialState, {
				type: "UPDATE_OBJECT",
				objectId: obj0Id,
				updates: { rotation: 45 },
			});
			state = editorReducer(state, {
				type: "COMMIT_HISTORY",
				description: "回転変更1",
			});
			expect(state.history).toHaveLength(2);

			// 同じ状態で再度コミットを試行
			state = editorReducer(state, {
				type: "COMMIT_HISTORY",
				description: "回転変更2",
			});
			// 変更がないので履歴数は2のまま
			expect(state.history).toHaveLength(2);
		});

		it("Undo/Redoの基本動作", () => {
			// 変更を加える
			let state = editorReducer(initialState, {
				type: "UPDATE_OBJECT",
				objectId: obj0Id,
				updates: { rotation: 90 },
			});
			// 履歴をコミット
			state = editorReducer(state, {
				type: "COMMIT_HISTORY",
				description: "回転変更",
			});

			expect(state.board.objects[0].rotation).toBe(90);
			expect(state.historyIndex).toBe(1);

			// Undo
			state = editorReducer(state, { type: "UNDO" });
			expect(state.board.objects[0].rotation).toBe(0);
			expect(state.historyIndex).toBe(0);

			// Redo
			state = editorReducer(state, { type: "REDO" });
			expect(state.board.objects[0].rotation).toBe(90);
			expect(state.historyIndex).toBe(1);
		});

		it("履歴の先頭でUndoは何もしない", () => {
			const state = editorReducer(initialState, { type: "UNDO" });
			expect(state.historyIndex).toBe(0);
		});

		it("履歴の末尾でRedoは何もしない", () => {
			const state = editorReducer(initialState, { type: "REDO" });
			expect(state.historyIndex).toBe(0);
		});
	});

	describe("COPY/PASTE", () => {
		it("コピー&ペースト", () => {
			// 選択
			let state = editorReducer(initialState, {
				type: "SELECT_OBJECT",
				objectId: obj0Id,
			});
			// コピー
			state = editorReducer(state, { type: "COPY_OBJECTS" });
			expect(hasClipboardData()).toBe(true);

			// ペースト
			state = editorReducer(state, { type: "PASTE_OBJECTS" });
			expect(state.board.objects).toHaveLength(4);
		});

		it("位置指定でペースト", () => {
			let state = editorReducer(initialState, {
				type: "SELECT_OBJECT",
				objectId: obj0Id,
			});
			state = editorReducer(state, { type: "COPY_OBJECTS" });
			state = editorReducer(state, {
				type: "PASTE_OBJECTS",
				position: { x: 256, y: 192 },
			});

			// ペーストされたオブジェクトは先頭（最前面）に追加される
			const pastedObj = state.board.objects[0];
			expect(pastedObj.position).toEqual({ x: 256, y: 192 });
		});

		it("選択なしでコピーは何もしない", () => {
			const state = editorReducer(initialState, { type: "COPY_OBJECTS" });
			// 状態が変更されていないことを確認
			expect(state).toBe(initialState);
		});
	});

	describe("GROUP_OBJECTS", () => {
		it("オブジェクトをグループ化", () => {
			const state = editorReducer(initialState, {
				type: "GROUP_OBJECTS",
				objectIds: [obj0Id, obj1Id],
			});
			expect(state.groups).toHaveLength(1);
			expect(state.groups[0].objectIds).toEqual([obj0Id, obj1Id]);
		});

		it("1つ以下のオブジェクトはグループ化しない", () => {
			const state = editorReducer(initialState, {
				type: "GROUP_OBJECTS",
				objectIds: [obj0Id],
			});
			expect(state.groups).toHaveLength(0);
		});
	});

	describe("UNGROUP", () => {
		it("グループを解除", () => {
			let state = editorReducer(initialState, {
				type: "GROUP_OBJECTS",
				objectIds: [obj0Id, obj1Id],
			});
			const groupId = state.groups[0].id;

			state = editorReducer(state, {
				type: "UNGROUP",
				groupId,
			});
			expect(state.groups).toHaveLength(0);
		});
	});

	describe("SET_GRID_SETTINGS", () => {
		it("グリッド設定を更新", () => {
			const state = editorReducer(initialState, {
				type: "SET_GRID_SETTINGS",
				settings: { enabled: true, size: 32 },
			});
			expect(state.gridSettings.enabled).toBe(true);
			expect(state.gridSettings.size).toBe(32);
		});

		it("部分更新も可能", () => {
			let state = editorReducer(initialState, {
				type: "SET_GRID_SETTINGS",
				settings: { enabled: true },
			});
			state = editorReducer(state, {
				type: "SET_GRID_SETTINGS",
				settings: { showGrid: true },
			});
			expect(state.gridSettings.enabled).toBe(true);
			expect(state.gridSettings.showGrid).toBe(true);
		});
	});

	describe("ALIGN_OBJECTS", () => {
		it("左揃え", () => {
			const state = editorReducer(initialState, {
				type: "ALIGN_OBJECTS",
				objectIds: [obj0Id, obj1Id, obj2Id],
				alignment: "left",
			});
			// 最小X座標（100）に揃う
			expect(state.board.objects[0].position.x).toBe(100);
			expect(state.board.objects[1].position.x).toBe(100);
			expect(state.board.objects[2].position.x).toBe(100);
		});

		it("1つ以下のオブジェクトは整列しない", () => {
			const originalX = initialState.board.objects[0].position.x;
			const state = editorReducer(initialState, {
				type: "ALIGN_OBJECTS",
				objectIds: [obj0Id],
				alignment: "left",
			});
			expect(state.board.objects[0].position.x).toBe(originalX);
		});
	});

	describe("UPDATE_BOARD_META", () => {
		it("ボード名を更新", () => {
			const state = editorReducer(initialState, {
				type: "UPDATE_BOARD_META",
				updates: { name: "新しい名前" },
			});
			expect(state.board.name).toBe("新しい名前");
		});

		it("背景を更新", () => {
			const state = editorReducer(initialState, {
				type: "UPDATE_BOARD_META",
				updates: { backgroundId: 3 },
			});
			expect(state.board.backgroundId).toBe(3);
		});
	});
});
