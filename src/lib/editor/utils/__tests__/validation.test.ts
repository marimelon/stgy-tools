/**
 * Validation tests
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
		it("can add object to empty board", () => {
			const board = createEmptyBoard();

			const result = canAddObject(board, ObjectIds.Tank);

			expect(result.canAdd).toBe(true);
			expect(result.errorKey).toBeUndefined();
		});

		it("can add unlimited objects without individual limits", () => {
			const board = createEmptyBoard();

			// Tank has no individual limit
			for (let i = 0; i < 10; i++) {
				const obj = createDefaultObject(ObjectIds.Tank);
				board.objects.push(obj);
			}

			const result = canAddObject(board, ObjectIds.Tank);

			expect(result.canAdd).toBe(true);
		});

		it("cannot add object when exceeding individual limit", () => {
			const board = createEmptyBoard();
			const lineLimit = OBJECT_LIMITS[ObjectIds.Line] ?? 10;

			// Add up to the limit
			for (let i = 0; i < lineLimit; i++) {
				const obj = createDefaultObject(ObjectIds.Line);
				board.objects.push(obj);
			}

			const result = canAddObject(board, ObjectIds.Line);

			expect(result.canAdd).toBe(false);
			expect(result.errorKey).toBe("editor.errors.maxObjectType");
			expect(result.errorParams?.max).toBe(lineLimit);
		});

		it("cannot add when exceeding total maximum", () => {
			const board = createEmptyBoard();

			// Add MAX_TOTAL_OBJECTS (use objects without limits)
			for (let i = 0; i < MAX_TOTAL_OBJECTS; i++) {
				const obj = createDefaultObject(ObjectIds.Tank);
				board.objects.push(obj);
			}

			const result = canAddObject(board, ObjectIds.Tank);

			expect(result.canAdd).toBe(false);
			expect(result.errorKey).toBe("editor.errors.maxTotalObjects");
			expect(result.errorParams?.max).toBe(MAX_TOTAL_OBJECTS);
		});

		it("cannot add when exactly at limit", () => {
			const board = createEmptyBoard();
			const lineAoELimit = OBJECT_LIMITS[ObjectIds.LineAoE] ?? 10;

			for (let i = 0; i < lineAoELimit; i++) {
				const obj = createDefaultObject(ObjectIds.LineAoE);
				board.objects.push(obj);
			}

			const result = canAddObject(board, ObjectIds.LineAoE);

			expect(result.canAdd).toBe(false);
		});

		it("can add when one below limit", () => {
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
		it("can add empty array", () => {
			const board = createEmptyBoard();

			const result = canAddObjects(board, []);

			expect(result.canAdd).toBe(true);
		});

		it("can add multiple objects at once", () => {
			const board = createEmptyBoard();
			const objects: BoardObject[] = [
				createDefaultObject(ObjectIds.Tank),
				createDefaultObject(ObjectIds.Healer),
				createDefaultObject(ObjectIds.DPS),
			];

			const result = canAddObjects(board, objects);

			expect(result.canAdd).toBe(true);
		});

		it("cannot add when total limit would be exceeded", () => {
			const board = createEmptyBoard();

			// Add 48 objects
			for (let i = 0; i < MAX_TOTAL_OBJECTS - 2; i++) {
				const obj = createDefaultObject(ObjectIds.Tank);
				board.objects.push(obj);
			}

			// Try to add 3 more -> would be 51, so it fails
			const objects: BoardObject[] = [
				createDefaultObject(ObjectIds.Tank),
				createDefaultObject(ObjectIds.Tank),
				createDefaultObject(ObjectIds.Tank),
			];

			const result = canAddObjects(board, objects);

			expect(result.canAdd).toBe(false);
			expect(result.errorKey).toBe("editor.errors.maxTotalObjectsExceeded");
		});

		it("cannot add when individual limit would be exceeded", () => {
			const board = createEmptyBoard();
			const lineLimit = OBJECT_LIMITS[ObjectIds.Line] ?? 10;

			// Add half the limit
			const halfLimit = Math.floor(lineLimit / 2);
			for (let i = 0; i < halfLimit; i++) {
				const obj = createDefaultObject(ObjectIds.Line);
				board.objects.push(obj);
			}

			// Try to add more Lines than the limit allows
			const objects: BoardObject[] = [];
			for (let i = 0; i < halfLimit + 2; i++) {
				objects.push(createDefaultObject(ObjectIds.Line));
			}

			const result = canAddObjects(board, objects);

			expect(result.canAdd).toBe(false);
			expect(result.errorKey).toBe("editor.errors.maxObjectType");
		});

		it("checks limits for each type when adding multiple types", () => {
			const board = createEmptyBoard();
			const lineLimit = OBJECT_LIMITS[ObjectIds.Line] ?? 10;

			// Add Lines up to the limit
			for (let i = 0; i < lineLimit; i++) {
				const obj = createDefaultObject(ObjectIds.Line);
				board.objects.push(obj);
			}

			// Try to add Tank (no limit) and Line (has limit)
			const objects: BoardObject[] = [
				createDefaultObject(ObjectIds.Tank),
				createDefaultObject(ObjectIds.Line), // This exceeds the limit
			];

			const result = canAddObjects(board, objects);

			expect(result.canAdd).toBe(false);
		});

		it("different object types are validated by their respective limits", () => {
			const board = createEmptyBoard();
			const lineLimit = OBJECT_LIMITS[ObjectIds.Line] ?? 10;

			// Add Lines up to half the limit
			for (let i = 0; i < Math.floor(lineLimit / 2); i++) {
				const obj = createDefaultObject(ObjectIds.Line);
				board.objects.push(obj);
			}

			// Add Line and LineAoE (both within limits)
			const objects: BoardObject[] = [
				createDefaultObject(ObjectIds.Line),
				createDefaultObject(ObjectIds.LineAoE),
			];

			const result = canAddObjects(board, objects);

			expect(result.canAdd).toBe(true);
		});
	});
});
