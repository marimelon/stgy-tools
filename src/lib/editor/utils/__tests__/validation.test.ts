/**
 * バリデーションのテスト
 */

import { describe, expect, it } from "vitest";
import {
	type BoardObject,
	MAX_TOTAL_OBJECTS,
	OBJECT_LIMITS,
	ObjectIds,
} from "@/lib/stgy";
import { createDefaultObject, createEmptyBoard } from "../../factory";
import { canAddObject, canAddObjects } from "../validation";

describe("validation", () => {
	describe("canAddObject", () => {
		it("空のボードにはオブジェクトを追加できる", () => {
			const board = createEmptyBoard();

			const result = canAddObject(board, ObjectIds.Tank);

			expect(result.canAdd).toBe(true);
			expect(result.errorKey).toBeUndefined();
		});

		it("制限のないオブジェクトは何個でも追加できる", () => {
			const board = createEmptyBoard();

			// Tankには個別制限がない
			for (let i = 0; i < 10; i++) {
				const obj = createDefaultObject(ObjectIds.Tank);
				board.objects.push(obj);
			}

			const result = canAddObject(board, ObjectIds.Tank);

			expect(result.canAdd).toBe(true);
		});

		it("個別制限のあるオブジェクトは制限を超えると追加できない", () => {
			const board = createEmptyBoard();
			const lineLimit = OBJECT_LIMITS[ObjectIds.Line] ?? 10;

			// 制限いっぱいまで追加
			for (let i = 0; i < lineLimit; i++) {
				const obj = createDefaultObject(ObjectIds.Line);
				board.objects.push(obj);
			}

			const result = canAddObject(board, ObjectIds.Line);

			expect(result.canAdd).toBe(false);
			expect(result.errorKey).toBe("editor.errors.maxObjectType");
			expect(result.errorParams?.max).toBe(lineLimit);
		});

		it("全体の最大数を超えると追加できない", () => {
			const board = createEmptyBoard();

			// MAX_TOTAL_OBJECTS個追加（制限のないオブジェクトを使用）
			for (let i = 0; i < MAX_TOTAL_OBJECTS; i++) {
				const obj = createDefaultObject(ObjectIds.Tank);
				board.objects.push(obj);
			}

			const result = canAddObject(board, ObjectIds.Tank);

			expect(result.canAdd).toBe(false);
			expect(result.errorKey).toBe("editor.errors.maxTotalObjects");
			expect(result.errorParams?.max).toBe(MAX_TOTAL_OBJECTS);
		});

		it("制限ぴったりの場合は追加できない", () => {
			const board = createEmptyBoard();
			const lineAoELimit = OBJECT_LIMITS[ObjectIds.LineAoE] ?? 10;

			for (let i = 0; i < lineAoELimit; i++) {
				const obj = createDefaultObject(ObjectIds.LineAoE);
				board.objects.push(obj);
			}

			const result = canAddObject(board, ObjectIds.LineAoE);

			expect(result.canAdd).toBe(false);
		});

		it("制限より1つ少ない場合は追加できる", () => {
			const board = createEmptyBoard();
			const lineAoELimit = OBJECT_LIMITS[ObjectIds.LineAoE] ?? 10;

			for (let i = 0; i < lineAoELimit - 1; i++) {
				const obj = createDefaultObject(ObjectIds.LineAoE);
				board.objects.push(obj);
			}

			const result = canAddObject(board, ObjectIds.LineAoE);

			expect(result.canAdd).toBe(true);
		});
	});

	describe("canAddObjects", () => {
		it("空の配列は追加できる", () => {
			const board = createEmptyBoard();

			const result = canAddObjects(board, []);

			expect(result.canAdd).toBe(true);
		});

		it("複数オブジェクトを一度に追加できる", () => {
			const board = createEmptyBoard();
			const objects: BoardObject[] = [
				createDefaultObject(ObjectIds.Tank),
				createDefaultObject(ObjectIds.Healer),
				createDefaultObject(ObjectIds.DPS),
			];

			const result = canAddObjects(board, objects);

			expect(result.canAdd).toBe(true);
		});

		it("追加後に全体制限を超える場合は追加できない", () => {
			const board = createEmptyBoard();

			// 48個追加
			for (let i = 0; i < MAX_TOTAL_OBJECTS - 2; i++) {
				const obj = createDefaultObject(ObjectIds.Tank);
				board.objects.push(obj);
			}

			// 3個追加しようとする → 51個になるので失敗
			const objects: BoardObject[] = [
				createDefaultObject(ObjectIds.Tank),
				createDefaultObject(ObjectIds.Tank),
				createDefaultObject(ObjectIds.Tank),
			];

			const result = canAddObjects(board, objects);

			expect(result.canAdd).toBe(false);
			expect(result.errorKey).toBe("editor.errors.maxTotalObjectsExceeded");
		});

		it("追加後に個別制限を超える場合は追加できない", () => {
			const board = createEmptyBoard();
			const lineLimit = OBJECT_LIMITS[ObjectIds.Line] ?? 10;

			// 制限の半分まで追加
			const halfLimit = Math.floor(lineLimit / 2);
			for (let i = 0; i < halfLimit; i++) {
				const obj = createDefaultObject(ObjectIds.Line);
				board.objects.push(obj);
			}

			// 制限を超える数のLineを追加しようとする
			const objects: BoardObject[] = [];
			for (let i = 0; i < halfLimit + 2; i++) {
				objects.push(createDefaultObject(ObjectIds.Line));
			}

			const result = canAddObjects(board, objects);

			expect(result.canAdd).toBe(false);
			expect(result.errorKey).toBe("editor.errors.maxObjectType");
		});

		it("複数種類のオブジェクトを含む場合、各種類の制限をチェックする", () => {
			const board = createEmptyBoard();
			const lineLimit = OBJECT_LIMITS[ObjectIds.Line] ?? 10;

			// Lineを制限いっぱいまで追加
			for (let i = 0; i < lineLimit; i++) {
				const obj = createDefaultObject(ObjectIds.Line);
				board.objects.push(obj);
			}

			// Tank（制限なし）とLine（制限あり）を追加しようとする
			const objects: BoardObject[] = [
				createDefaultObject(ObjectIds.Tank),
				createDefaultObject(ObjectIds.Line), // これが制限超過
			];

			const result = canAddObjects(board, objects);

			expect(result.canAdd).toBe(false);
		});

		it("異なる種類のオブジェクトはそれぞれの制限で判定される", () => {
			const board = createEmptyBoard();
			const lineLimit = OBJECT_LIMITS[ObjectIds.Line] ?? 10;

			// Lineを制限の半分まで追加
			for (let i = 0; i < Math.floor(lineLimit / 2); i++) {
				const obj = createDefaultObject(ObjectIds.Line);
				board.objects.push(obj);
			}

			// LineとLineAoEを追加（どちらも制限内）
			const objects: BoardObject[] = [
				createDefaultObject(ObjectIds.Line),
				createDefaultObject(ObjectIds.LineAoE),
			];

			const result = canAddObjects(board, objects);

			expect(result.canAdd).toBe(true);
		});
	});
});
