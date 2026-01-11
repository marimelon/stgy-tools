/**
 * Factory function tests
 */

import { describe, expect, it } from "vitest";
import i18n from "@/lib/i18n";
import { BackgroundId, ObjectIds } from "@/lib/stgy";
import {
	calculateTextBoardSize,
	createDefaultObject,
	createEmptyBoard,
	duplicateObject,
	recalculateBoardSize,
} from "../factory";

describe("factory", () => {
	describe("createEmptyBoard", () => {
		it("creates empty board with default values", () => {
			const board = createEmptyBoard();
			expect(board.version).toBe(2);
			expect(board.name).toBe("");
			expect(board.backgroundId).toBe(BackgroundId.None);
			expect(board.objects).toEqual([]);
		});

		it("creates board with specified name", () => {
			const board = createEmptyBoard("Test Board");
			expect(board.name).toBe("Test Board");
		});
	});

	describe("createDefaultObject", () => {
		it("creates role icon with default values", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			expect(obj.objectId).toBe(ObjectIds.Tank);
			expect(obj.flags.visible).toBe(true);
			expect(obj.flags.flipHorizontal).toBe(false);
			expect(obj.flags.flipVertical).toBe(false);
			expect(obj.flags.locked).toBe(false);
			expect(obj.position).toEqual({ x: 256, y: 192 });
			expect(obj.rotation).toBe(0);
			expect(obj.color).toEqual({ r: 255, g: 128, b: 0, opacity: 0 });
		});

		it("creates object with specified position", () => {
			const obj = createDefaultObject(ObjectIds.Tank, { x: 100, y: 50 });
			expect(obj.position).toEqual({ x: 100, y: 50 });
		});

		it("text object has text property", () => {
			const obj = createDefaultObject(ObjectIds.Text);
			expect(obj.text).toBe(i18n.t("common.defaultText"));
		});

		it("ConeAoE has param1 (angle)", () => {
			const obj = createDefaultObject(ObjectIds.ConeAoE);
			expect(obj.param1).toBeDefined();
		});

		it("DonutAoE starts with 360 degree angle", () => {
			const obj = createDefaultObject(ObjectIds.DonutAoE);
			expect(obj.param1).toBe(360);
		});

		it("LineAoE has param1 (height) and param2 (width)", () => {
			const obj = createDefaultObject(ObjectIds.LineAoE);
			expect(obj.param1).toBe(128); // Default height
			expect(obj.param2).toBe(128); // Default width
		});

		it("Line has param1 (endX), param2 (endY), param3 (line width)", () => {
			const obj = createDefaultObject(ObjectIds.Line);
			// Line draws from start(128, 192) to end(384, 192) (offset 128px left for centering)
			expect(obj.position).toEqual({ x: 128, y: 192 });
			expect(obj.param1).toBe(3840); // End X coordinate * 10 = 384 * 10
			expect(obj.param2).toBe(1920); // End Y coordinate * 10 = 192 * 10
			expect(obj.param3).toBe(6); // Default line width
		});

		it("Line calculates endpoint correctly with specified position", () => {
			const obj = createDefaultObject(ObjectIds.Line, { x: 100, y: 50 });
			// targetPosition(100, 50) offset 128px left -> start(-28, 50)
			// end is 256px right from start -> (228, 50)
			expect(obj.position).toEqual({ x: -28, y: 50 });
			expect(obj.param1).toBe(2280); // End X coordinate * 10 = 228 * 10
			expect(obj.param2).toBe(500); // End Y coordinate * 10 = 50 * 10
			expect(obj.param3).toBe(6);
		});

		it("Line defaults to white color", () => {
			const obj = createDefaultObject(ObjectIds.Line);
			expect(obj.color).toEqual({ r: 255, g: 255, b: 255, opacity: 0 });
		});
	});

	describe("duplicateObject", () => {
		it("duplicates object with default offset", () => {
			const original = createDefaultObject(ObjectIds.Tank, { x: 100, y: 100 });
			const copy = duplicateObject(original);

			expect(copy.objectId).toBe(original.objectId);
			expect(copy.position).toEqual({ x: 110, y: 110 }); // +10, +10
			expect(copy.rotation).toBe(original.rotation);
			expect(copy.size).toBe(original.size);
		});

		it("duplicates with custom offset", () => {
			const original = createDefaultObject(ObjectIds.Healer, { x: 50, y: 50 });
			const copy = duplicateObject(original, { x: 20, y: 30 });

			expect(copy.position).toEqual({ x: 70, y: 80 });
		});

		it("duplicate is independent from original (deep copy)", () => {
			const original = createDefaultObject(ObjectIds.DPS);
			const copy = duplicateObject(original);

			// Modifying flags doesn't affect original
			copy.flags.visible = false;
			expect(original.flags.visible).toBe(true);

			// Modifying color doesn't affect original
			copy.color.r = 0;
			expect(original.color.r).toBe(255);
		});
	});

	describe("calculateTextBoardSize (deprecated)", () => {
		it("always returns default canvas size", () => {
			// @deprecated: stgy binary format doesn't include board size
			expect(calculateTextBoardSize(0)).toEqual({ width: 512, height: 384 });
			expect(calculateTextBoardSize(10)).toEqual({ width: 512, height: 384 });
			expect(calculateTextBoardSize(100)).toEqual({ width: 512, height: 384 });
		});
	});

	describe("recalculateBoardSize (deprecated)", () => {
		it("always returns default canvas size", () => {
			// @deprecated: stgy binary format doesn't include board size
			const board = createEmptyBoard();
			const size = recalculateBoardSize(board);
			expect(size).toEqual({ width: 512, height: 384 });
		});
	});
});
