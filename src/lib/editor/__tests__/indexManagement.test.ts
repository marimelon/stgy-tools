import { describe, expect, it } from "vitest";
import {
	removeIndices,
	shiftIndicesDown,
	updateForGroupMove,
	updateForLayerMove,
} from "../reducerHandlers/businessLogic/indexManagement";
import type { ObjectGroup } from "../types";

describe("indexManagement", () => {
	describe("shiftIndicesDown", () => {
		it("should shift all indices down by count", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [0, 1, 2] },
				{ id: "g2", name: "Group 2", objectIndices: [3, 4] },
			];
			const result = shiftIndicesDown(groups, 2);
			expect(result[0].objectIndices).toEqual([2, 3, 4]);
			expect(result[1].objectIndices).toEqual([5, 6]);
		});

		it("should handle empty groups", () => {
			const groups: ObjectGroup[] = [];
			const result = shiftIndicesDown(groups, 5);
			expect(result).toEqual([]);
		});

		it("should not mutate original groups", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [0, 1] },
			];
			const original = structuredClone(groups);
			shiftIndicesDown(groups, 3);
			expect(groups).toEqual(original);
		});
	});

	describe("removeIndices", () => {
		it("should remove deleted indices and shift remaining", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [0, 2, 4, 5] },
			];
			const result = removeIndices(groups, [2, 4]);
			expect(result[0].objectIndices).toEqual([0, 3]);
		});

		it("should remove empty groups", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [2, 4] },
				{ id: "g2", name: "Group 2", objectIndices: [0, 1] },
			];
			const result = removeIndices(groups, [2, 4]);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("g2");
			expect(result[0].objectIndices).toEqual([0, 1]);
		});

		it("should handle complex deletion patterns", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [1, 3, 5, 7, 9] },
			];
			const result = removeIndices(groups, [3, 7]);
			// [1,3,5,7,9] -> [1,5,9] after removal
			// After shift: [1,4,7] (indices 3,7 removed, so 5->4, 9->7)
			expect(result[0].objectIndices).toEqual([1, 4, 7]);
		});

		it("should not mutate original groups", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [0, 2, 4] },
			];
			const original = structuredClone(groups);
			removeIndices(groups, [2]);
			expect(groups).toEqual(original);
		});
	});

	describe("updateForLayerMove", () => {
		it("should update indices when moving layer down", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [1, 2, 3] },
			];
			// Move index 1 to position 3 (down)
			const result = updateForLayerMove(groups, 1, 3);
			// [1,2,3] -> index 1 moves to 3, so indices 2,3 shift left: [3,1,2]
			expect(result[0].objectIndices).toEqual([3, 1, 2]);
		});

		it("should update indices when moving layer up", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [1, 2, 3] },
			];
			// Move index 3 to position 1 (up)
			const result = updateForLayerMove(groups, 3, 1);
			// [1,2,3] -> index 3 moves to 1, so indices 1,2 shift right: [2,3,1]
			expect(result[0].objectIndices).toEqual([2, 3, 1]);
		});

		it("should handle moving to same position", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [1, 2, 3] },
			];
			const result = updateForLayerMove(groups, 2, 2);
			expect(result[0].objectIndices).toEqual([1, 2, 3]);
		});

		it("should not mutate original groups", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [1, 2, 3] },
			];
			const original = structuredClone(groups);
			updateForLayerMove(groups, 1, 3);
			expect(groups).toEqual(original);
		});
	});

	describe("updateForGroupMove", () => {
		it("should update group and other groups when moving group down", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [0, 1, 2] },
				{ id: "g2", name: "Group 2", objectIndices: [3, 4] },
			];
			// Move g1 (indices [0,1,2]) to position 3
			const result = updateForGroupMove(groups, "g1", [0, 1, 2], 3, 3);

			// g1 should now be at [3,4,5]
			const g1 = result.find((g) => g.id === "g1");
			expect(g1?.objectIndices).toEqual([3, 4, 5]);

			// g2 indices [3,4] should shift up to [0,1]
			const g2 = result.find((g) => g.id === "g2");
			expect(g2?.objectIndices).toEqual([0, 1]);
		});

		it("should update group and other groups when moving group up", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [0, 1] },
				{ id: "g2", name: "Group 2", objectIndices: [2, 3, 4] },
			];
			// Move g2 (indices [2,3,4]) to position 0
			const result = updateForGroupMove(groups, "g2", [2, 3, 4], 0, 3);

			// g2 should now be at [0,1,2]
			const g2 = result.find((g) => g.id === "g2");
			expect(g2?.objectIndices).toEqual([0, 1, 2]);

			// g1 indices [0,1] should shift down to [3,4]
			const g1 = result.find((g) => g.id === "g1");
			expect(g1?.objectIndices).toEqual([3, 4]);
		});

		it("should not mutate original groups", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIndices: [0, 1, 2] },
				{ id: "g2", name: "Group 2", objectIndices: [3, 4] },
			];
			const original = structuredClone(groups);
			updateForGroupMove(groups, "g1", [0, 1, 2], 3, 3);
			expect(groups).toEqual(original);
		});
	});
});
