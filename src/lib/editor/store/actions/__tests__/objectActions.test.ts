/**
 * オブジェクトアクションのテスト
 */

import { Store } from "@tanstack/store";
import { beforeEach, describe, expect, it } from "vitest";
import { ObjectIds } from "@/lib/stgy";
import { createDefaultObject, createEmptyBoard } from "../../../factory";
import { createInitialStateWithOptions } from "../../../reducer";
import type { EditorState } from "../../../types";
import type { EditorStore } from "../../types";
import { createObjectActions } from "../objectActions";

describe("objectActions", () => {
	let store: EditorStore;
	let actions: ReturnType<typeof createObjectActions>;

	beforeEach(() => {
		const board = createEmptyBoard("テストボード");
		const initialState = createInitialStateWithOptions({ board });
		store = new Store<EditorState>(initialState);
		actions = createObjectActions(store);
	});

	describe("addObject", () => {
		it("オブジェクトを追加できる", () => {
			const obj = createDefaultObject(ObjectIds.Tank, { x: 100, y: 100 });
			actions.addObject(obj);

			const state = store.state;
			expect(state.board.objects).toHaveLength(1);
			expect(state.board.objects[0].objectId).toBe(ObjectIds.Tank);
			expect(state.board.objects[0].position).toEqual({ x: 100, y: 100 });
		});

		it("追加されたオブジェクトが選択される", () => {
			const obj = createDefaultObject(ObjectIds.Healer);
			actions.addObject(obj);

			const state = store.state;
			expect(state.selectedIds).toHaveLength(1);
			expect(state.selectedIds[0]).toBe(obj.id);
		});

		it("配列の先頭に追加される（最前面レイヤー）", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);

			actions.addObject(obj1);
			actions.addObject(obj2);

			const state = store.state;
			expect(state.board.objects[0].objectId).toBe(ObjectIds.Healer);
			expect(state.board.objects[1].objectId).toBe(ObjectIds.Tank);
		});

		it("履歴に追加される", () => {
			const obj = createDefaultObject(ObjectIds.DPS);
			actions.addObject(obj);

			const state = store.state;
			expect(state.history.length).toBeGreaterThan(1);
			expect(state.historyIndex).toBe(state.history.length - 1);
		});
	});

	describe("deleteObjects", () => {
		it("オブジェクトを削除できる", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			actions.addObject(obj);

			actions.deleteObjects([obj.id]);

			const state = store.state;
			expect(state.board.objects).toHaveLength(0);
		});

		it("選択が解除される", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			actions.addObject(obj);

			actions.deleteObjects([obj.id]);

			const state = store.state;
			expect(state.selectedIds).toHaveLength(0);
		});

		it("複数オブジェクトを一度に削除できる", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);
			const obj3 = createDefaultObject(ObjectIds.DPS);

			actions.addObject(obj1);
			actions.addObject(obj2);
			actions.addObject(obj3);

			actions.deleteObjects([obj1.id, obj3.id]);

			const state = store.state;
			expect(state.board.objects).toHaveLength(1);
			expect(state.board.objects[0].id).toBe(obj2.id);
		});

		it("空の配列では何も起きない", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			actions.addObject(obj);
			const beforeState = store.state;

			actions.deleteObjects([]);

			expect(store.state.board.objects).toHaveLength(1);
			expect(store.state.historyIndex).toBe(beforeState.historyIndex);
		});
	});

	describe("updateObject", () => {
		it("オブジェクトの位置を更新できる", () => {
			const obj = createDefaultObject(ObjectIds.Tank, { x: 100, y: 100 });
			actions.addObject(obj);

			actions.updateObject(obj.id, { position: { x: 200, y: 150 } });

			const state = store.state;
			expect(state.board.objects[0].position).toEqual({ x: 200, y: 150 });
		});

		it("オブジェクトの回転を更新できる", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			actions.addObject(obj);

			actions.updateObject(obj.id, { rotation: 45 });

			const state = store.state;
			expect(state.board.objects[0].rotation).toBe(45);
		});

		it("オブジェクトの色を更新できる", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			actions.addObject(obj);

			actions.updateObject(obj.id, {
				color: { r: 255, g: 0, b: 0, opacity: 50 },
			});

			const state = store.state;
			expect(state.board.objects[0].color.r).toBe(255);
			expect(state.board.objects[0].color.g).toBe(0);
			expect(state.board.objects[0].color.b).toBe(0);
			expect(state.board.objects[0].color.opacity).toBe(50);
		});

		it("isDirtyがtrueになる", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			actions.addObject(obj);

			// 履歴をコミットしてisDirtyをリセット
			store.setState((s) => ({ ...s, isDirty: false }));

			actions.updateObject(obj.id, { rotation: 90 });

			expect(store.state.isDirty).toBe(true);
		});
	});

	describe("duplicateObjects", () => {
		it("オブジェクトを複製できる", () => {
			const obj = createDefaultObject(ObjectIds.Tank, { x: 100, y: 100 });
			actions.addObject(obj);

			actions.duplicateObjects([obj.id]);

			const state = store.state;
			expect(state.board.objects).toHaveLength(2);
		});

		it("複製されたオブジェクトが選択される", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			actions.addObject(obj);

			actions.duplicateObjects([obj.id]);

			const state = store.state;
			expect(state.selectedIds).toHaveLength(1);
			expect(state.selectedIds[0]).not.toBe(obj.id);
		});

		it("複製は新しいIDを持つ", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			actions.addObject(obj);

			actions.duplicateObjects([obj.id]);

			const state = store.state;
			const ids = state.board.objects.map((o) => o.id);
			expect(new Set(ids).size).toBe(2);
		});

		it("複数オブジェクトを一度に複製できる", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank);
			const obj2 = createDefaultObject(ObjectIds.Healer);
			actions.addObject(obj1);
			actions.addObject(obj2);

			actions.duplicateObjects([obj1.id, obj2.id]);

			const state = store.state;
			expect(state.board.objects).toHaveLength(4);
		});
	});

	describe("moveObjects", () => {
		it("オブジェクトを移動できる", () => {
			const obj = createDefaultObject(ObjectIds.Tank, { x: 100, y: 100 });
			actions.addObject(obj);

			actions.moveObjects([obj.id], 50, 30);

			const state = store.state;
			expect(state.board.objects[0].position).toEqual({ x: 150, y: 130 });
		});

		it("複数オブジェクトを一度に移動できる", () => {
			const obj1 = createDefaultObject(ObjectIds.Tank, { x: 100, y: 100 });
			const obj2 = createDefaultObject(ObjectIds.Healer, { x: 200, y: 200 });
			actions.addObject(obj1);
			actions.addObject(obj2);

			actions.moveObjects([obj1.id, obj2.id], 10, 20);

			const state = store.state;
			const tank = state.board.objects.find((o) => o.id === obj1.id);
			const healer = state.board.objects.find((o) => o.id === obj2.id);
			expect(tank?.position).toEqual({ x: 110, y: 120 });
			expect(healer?.position).toEqual({ x: 210, y: 220 });
		});

		it("Lineオブジェクトは終点も移動する", () => {
			const obj = createDefaultObject(ObjectIds.Line, { x: 100, y: 100 });
			const originalParam1 = obj.param1;
			const originalParam2 = obj.param2;
			actions.addObject(obj);

			actions.moveObjects([obj.id], 50, 30);

			const state = store.state;
			const line = state.board.objects[0];
			expect(line.param1).toBe((originalParam1 ?? 0) + 500); // 50 * 10
			expect(line.param2).toBe((originalParam2 ?? 0) + 300); // 30 * 10
		});
	});

	describe("deleteSelected", () => {
		it("選択中のオブジェクトを削除する", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			actions.addObject(obj);

			// addObjectで自動選択されている
			actions.deleteSelected();

			const state = store.state;
			expect(state.board.objects).toHaveLength(0);
		});
	});

	describe("duplicateSelected", () => {
		it("選択中のオブジェクトを複製する", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			actions.addObject(obj);

			// addObjectで自動選択されている
			actions.duplicateSelected();

			const state = store.state;
			expect(state.board.objects).toHaveLength(2);
		});
	});
});
