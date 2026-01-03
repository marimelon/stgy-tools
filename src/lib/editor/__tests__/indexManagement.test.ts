import { describe, expect, it } from "vitest";
import { removeIdsFromGroups } from "../reducerHandlers/businessLogic/indexManagement";
import type { ObjectGroup } from "../types";

describe("indexManagement", () => {
	describe("removeIdsFromGroups", () => {
		it("should remove deleted IDs from groups", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIds: ["obj-1", "obj-2", "obj-3"] },
				{ id: "g2", name: "Group 2", objectIds: ["obj-4", "obj-5"] },
			];
			const result = removeIdsFromGroups(groups, ["obj-2"]);

			expect(result[0].objectIds).toEqual(["obj-1", "obj-3"]);
			expect(result[1].objectIds).toEqual(["obj-4", "obj-5"]);
		});

		it("should remove groups with fewer than 2 objects", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIds: ["obj-1", "obj-2"] },
				{ id: "g2", name: "Group 2", objectIds: ["obj-3", "obj-4"] },
			];
			const result = removeIdsFromGroups(groups, ["obj-1"]);

			// Group 1 now has only 1 object, so it should be removed
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("g2");
			expect(result[0].objectIds).toEqual(["obj-3", "obj-4"]);
		});

		it("should handle deleting all objects from a group", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIds: ["obj-1", "obj-2"] },
			];
			const result = removeIdsFromGroups(groups, ["obj-1", "obj-2"]);

			expect(result).toHaveLength(0);
		});

		it("should handle multiple deletions across groups", () => {
			const groups: ObjectGroup[] = [
				{
					id: "g1",
					name: "Group 1",
					objectIds: ["obj-1", "obj-2", "obj-3", "obj-4"],
				},
				{ id: "g2", name: "Group 2", objectIds: ["obj-5", "obj-6", "obj-7"] },
			];
			const result = removeIdsFromGroups(groups, ["obj-2", "obj-4", "obj-6"]);

			expect(result[0].objectIds).toEqual(["obj-1", "obj-3"]);
			expect(result[1].objectIds).toEqual(["obj-5", "obj-7"]);
		});

		it("should handle empty groups array", () => {
			const groups: ObjectGroup[] = [];
			const result = removeIdsFromGroups(groups, ["obj-1"]);
			expect(result).toEqual([]);
		});

		it("should handle deleting non-existent IDs", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIds: ["obj-1", "obj-2"] },
			];
			const result = removeIdsFromGroups(groups, ["obj-999"]);

			// No change since obj-999 doesn't exist
			expect(result).toHaveLength(1);
			expect(result[0].objectIds).toEqual(["obj-1", "obj-2"]);
		});

		it("should not mutate original groups", () => {
			const groups: ObjectGroup[] = [
				{ id: "g1", name: "Group 1", objectIds: ["obj-1", "obj-2", "obj-3"] },
			];
			const original = structuredClone(groups);
			removeIdsFromGroups(groups, ["obj-2"]);
			expect(groups).toEqual(original);
		});

		it("should preserve group properties other than objectIds", () => {
			const groups: ObjectGroup[] = [
				{
					id: "g1",
					name: "My Custom Group",
					objectIds: ["obj-1", "obj-2", "obj-3"],
				},
			];
			const result = removeIdsFromGroups(groups, ["obj-2"]);

			expect(result[0].id).toBe("g1");
			expect(result[0].name).toBe("My Custom Group");
		});
	});
});
