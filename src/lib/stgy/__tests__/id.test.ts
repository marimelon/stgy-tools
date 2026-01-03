import { describe, expect, it } from "vitest";
import {
	assignBoardObjectIdsDeterministic,
	generateDeterministicObjectId,
	generateObjectId,
} from "../id";
import type { ParsedBoardData } from "../types";
import { BackgroundId } from "../types";

describe("ID Generation", () => {
	describe("generateObjectId", () => {
		it("should generate unique IDs", () => {
			const id1 = generateObjectId();
			const id2 = generateObjectId();
			expect(id1).not.toBe(id2);
			expect(id1.length).toBeGreaterThan(0);
			expect(id2.length).toBeGreaterThan(0);
		});
	});

	describe("generateDeterministicObjectId", () => {
		it("should generate deterministic IDs for same input", () => {
			const id1 = generateDeterministicObjectId(0);
			const id2 = generateDeterministicObjectId(0);
			expect(id1).toBe(id2);
			expect(id1).toBe("obj-0");
			console.log("Deterministic ID (index=0):", id1);
		});

		it("should generate different IDs for different indices", () => {
			const id0 = generateDeterministicObjectId(0);
			const id1 = generateDeterministicObjectId(1);
			const id2 = generateDeterministicObjectId(2);
			expect(id0).toBe("obj-0");
			expect(id1).toBe("obj-1");
			expect(id2).toBe("obj-2");
			expect(id0).not.toBe(id1);
			expect(id1).not.toBe(id2);
			console.log("IDs for different indices:", { id0, id1, id2 });
		});

		it("should generate simple sequential IDs", () => {
			expect(generateDeterministicObjectId(0)).toBe("obj-0");
			expect(generateDeterministicObjectId(1)).toBe("obj-1");
			expect(generateDeterministicObjectId(99)).toBe("obj-99");
		});
	});

	describe("assignBoardObjectIdsDeterministic", () => {
		it("should assign deterministic IDs to board objects", () => {
			const parsed: ParsedBoardData = {
				version: 2,
				name: "Test",
				backgroundId: BackgroundId.None,
				objects: [
					{
						objectId: 47,
						flags: {
							visible: true,
							flipHorizontal: false,
							flipVertical: false,
							locked: false,
						},
						position: { x: 100, y: 100 },
						rotation: 0,
						size: 100,
						color: { r: 255, g: 100, b: 0, opacity: 0 },
					},
					{
						objectId: 48,
						flags: {
							visible: true,
							flipHorizontal: false,
							flipVertical: false,
							locked: false,
						},
						position: { x: 200, y: 200 },
						rotation: 0,
						size: 100,
						color: { r: 255, g: 100, b: 0, opacity: 0 },
					},
				],
			};

			const board1 = assignBoardObjectIdsDeterministic(parsed);
			const board2 = assignBoardObjectIdsDeterministic(parsed);

			expect(board1.objects[0].id).toBe("obj-0");
			expect(board1.objects[1].id).toBe("obj-1");
			expect(board1.objects[0].id).toBe(board2.objects[0].id);
			expect(board1.objects[1].id).toBe(board2.objects[1].id);

			console.log("Object IDs:", {
				obj0: board1.objects[0].id,
				obj1: board1.objects[1].id,
			});
		});
	});
});
