import { describe, expect, it } from "vitest";
import type { BoardObject } from "@/lib/stgy";
import { calculateAlignment } from "../reducerHandlers/businessLogic/alignmentCalculations";

// ヘルパー: テスト用のシンプルなオブジェクトを作成
function createTestObject(x: number, y: number): BoardObject {
	return {
		objectId: 47,
		position: { x, y },
		rotation: 0,
		size: 100,
		color: { r: 255, g: 255, b: 255, opacity: 100 },
		flags: {
			visible: true,
			flipHorizontal: false,
			flipVertical: false,
			locked: false,
		},
	};
}

describe("calculateAlignment", () => {
	describe("基本的なバリデーション", () => {
		it("should return empty map for less than 2 indices", () => {
			const objects = [createTestObject(100, 100)];
			const result = calculateAlignment(objects, [0], "left");
			expect(result.positionUpdates.size).toBe(0);
		});

		it("should filter invalid indices", () => {
			const objects = [createTestObject(100, 100), createTestObject(200, 100)];
			const result = calculateAlignment(objects, [0, 5], "left"); // index 5 is invalid
			expect(result.positionUpdates.size).toBe(0); // less than 2 valid indices
		});
	});

	describe("left alignment", () => {
		it("should align all objects to leftmost x", () => {
			const objects = [
				createTestObject(100, 50),
				createTestObject(200, 100),
				createTestObject(150, 150),
			];
			const result = calculateAlignment(objects, [0, 1, 2], "left");

			expect(result.positionUpdates.get(0)?.x).toBe(100);
			expect(result.positionUpdates.get(1)?.x).toBe(100);
			expect(result.positionUpdates.get(2)?.x).toBe(100);

			// Y coordinates should remain unchanged
			expect(result.positionUpdates.get(0)?.y).toBe(50);
			expect(result.positionUpdates.get(1)?.y).toBe(100);
			expect(result.positionUpdates.get(2)?.y).toBe(150);
		});
	});

	describe("center alignment", () => {
		it("should align all objects to horizontal center", () => {
			const objects = [
				createTestObject(100, 50),
				createTestObject(200, 100),
				createTestObject(300, 150),
			];
			const result = calculateAlignment(objects, [0, 1, 2], "center");

			// Center X = (100 + 300) / 2 = 200
			expect(result.positionUpdates.get(0)?.x).toBe(200);
			expect(result.positionUpdates.get(1)?.x).toBe(200);
			expect(result.positionUpdates.get(2)?.x).toBe(200);
		});
	});

	describe("right alignment", () => {
		it("should align all objects to rightmost x", () => {
			const objects = [
				createTestObject(100, 50),
				createTestObject(200, 100),
				createTestObject(300, 150),
			];
			const result = calculateAlignment(objects, [0, 1, 2], "right");

			expect(result.positionUpdates.get(0)?.x).toBe(300);
			expect(result.positionUpdates.get(1)?.x).toBe(300);
			expect(result.positionUpdates.get(2)?.x).toBe(300);
		});
	});

	describe("top alignment", () => {
		it("should align all objects to topmost y", () => {
			const objects = [
				createTestObject(100, 50),
				createTestObject(200, 100),
				createTestObject(300, 150),
			];
			const result = calculateAlignment(objects, [0, 1, 2], "top");

			expect(result.positionUpdates.get(0)?.y).toBe(50);
			expect(result.positionUpdates.get(1)?.y).toBe(50);
			expect(result.positionUpdates.get(2)?.y).toBe(50);

			// X coordinates should remain unchanged
			expect(result.positionUpdates.get(0)?.x).toBe(100);
			expect(result.positionUpdates.get(1)?.x).toBe(200);
			expect(result.positionUpdates.get(2)?.x).toBe(300);
		});
	});

	describe("middle alignment", () => {
		it("should align all objects to vertical center", () => {
			const objects = [
				createTestObject(100, 50),
				createTestObject(200, 100),
				createTestObject(300, 150),
			];
			const result = calculateAlignment(objects, [0, 1, 2], "middle");

			// Center Y = (50 + 150) / 2 = 100
			expect(result.positionUpdates.get(0)?.y).toBe(100);
			expect(result.positionUpdates.get(1)?.y).toBe(100);
			expect(result.positionUpdates.get(2)?.y).toBe(100);
		});
	});

	describe("bottom alignment", () => {
		it("should align all objects to bottommost y", () => {
			const objects = [
				createTestObject(100, 50),
				createTestObject(200, 100),
				createTestObject(300, 150),
			];
			const result = calculateAlignment(objects, [0, 1, 2], "bottom");

			expect(result.positionUpdates.get(0)?.y).toBe(150);
			expect(result.positionUpdates.get(1)?.y).toBe(150);
			expect(result.positionUpdates.get(2)?.y).toBe(150);
		});
	});

	describe("distribute-h alignment", () => {
		it("should distribute objects evenly horizontally", () => {
			const objects = [
				createTestObject(100, 100),
				createTestObject(150, 100),
				createTestObject(300, 100),
			];
			const result = calculateAlignment(objects, [0, 1, 2], "distribute-h");

			// Min X = 100, Max X = 300, step = (300-100) / (3-1) = 100
			// Sorted by X: [0:100, 1:150, 2:300]
			expect(result.positionUpdates.get(0)?.x).toBe(100); // 100 + 0*100
			expect(result.positionUpdates.get(1)?.x).toBe(200); // 100 + 1*100
			expect(result.positionUpdates.get(2)?.x).toBe(300); // 100 + 2*100
		});

		it("should maintain y coordinates", () => {
			const objects = [
				createTestObject(100, 50),
				createTestObject(150, 100),
				createTestObject(300, 150),
			];
			const result = calculateAlignment(objects, [0, 1, 2], "distribute-h");

			expect(result.positionUpdates.get(0)?.y).toBe(50);
			expect(result.positionUpdates.get(1)?.y).toBe(100);
			expect(result.positionUpdates.get(2)?.y).toBe(150);
		});
	});

	describe("distribute-v alignment", () => {
		it("should distribute objects evenly vertically", () => {
			const objects = [
				createTestObject(100, 50),
				createTestObject(100, 100),
				createTestObject(100, 200),
			];
			const result = calculateAlignment(objects, [0, 1, 2], "distribute-v");

			// Min Y = 50, Max Y = 200, step = (200-50) / (3-1) = 75
			// Sorted by Y: [0:50, 1:100, 2:200]
			expect(result.positionUpdates.get(0)?.y).toBe(50); // 50 + 0*75
			expect(result.positionUpdates.get(1)?.y).toBe(125); // 50 + 1*75
			expect(result.positionUpdates.get(2)?.y).toBe(200); // 50 + 2*75
		});

		it("should maintain x coordinates", () => {
			const objects = [
				createTestObject(100, 50),
				createTestObject(200, 100),
				createTestObject(300, 200),
			];
			const result = calculateAlignment(objects, [0, 1, 2], "distribute-v");

			expect(result.positionUpdates.get(0)?.x).toBe(100);
			expect(result.positionUpdates.get(1)?.x).toBe(200);
			expect(result.positionUpdates.get(2)?.x).toBe(300);
		});
	});

	describe("不変性", () => {
		it("should not modify original objects array", () => {
			const objects = [createTestObject(100, 50), createTestObject(200, 100)];
			const originalObjects = structuredClone(objects);

			calculateAlignment(objects, [0, 1], "left");

			expect(objects).toEqual(originalObjects);
		});
	});
});
