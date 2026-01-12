import { describe, expect, it } from "vitest";
import {
	type BoardGroupData,
	type BoardGroupVersion,
	safeParseBoardGroupData,
	safeParseBoardGroupHistory,
} from "../types";

describe("types", () => {
	describe("safeParseBoardGroupData", () => {
		it("should parse valid group data", () => {
			const validData: BoardGroupData = {
				name: "Test Group",
				stgyCodes: ["[stgy:aTest1]", "[stgy:aTest2]"],
				createdAt: "2024-01-15T12:00:00.000Z",
				version: 1,
			};

			const result = safeParseBoardGroupData(JSON.stringify(validData));

			expect(result).not.toBeNull();
			expect(result?.name).toBe("Test Group");
			expect(result?.stgyCodes).toHaveLength(2);
			expect(result?.version).toBe(1);
		});

		it("should parse group data with all optional fields", () => {
			const fullData: BoardGroupData = {
				name: "Full Group",
				description: "A test description",
				stgyCodes: ["[stgy:aTest]"],
				createdAt: "2024-01-15T12:00:00.000Z",
				accessCount: 42,
				editKeyHash: "abc123hash",
				version: 3,
				updatedAt: "2024-01-16T10:00:00.000Z",
			};

			const result = safeParseBoardGroupData(JSON.stringify(fullData));

			expect(result).not.toBeNull();
			expect(result?.description).toBe("A test description");
			expect(result?.accessCount).toBe(42);
			expect(result?.editKeyHash).toBe("abc123hash");
			expect(result?.updatedAt).toBe("2024-01-16T10:00:00.000Z");
		});

		it("should return null for missing required field: name", () => {
			const invalidData = {
				stgyCodes: ["[stgy:aTest]"],
				createdAt: "2024-01-15T12:00:00.000Z",
				version: 1,
			};

			const result = safeParseBoardGroupData(JSON.stringify(invalidData));

			expect(result).toBeNull();
		});

		it("should return null for missing required field: stgyCodes", () => {
			const invalidData = {
				name: "Test Group",
				createdAt: "2024-01-15T12:00:00.000Z",
				version: 1,
			};

			const result = safeParseBoardGroupData(JSON.stringify(invalidData));

			expect(result).toBeNull();
		});

		it("should return null for missing required field: createdAt", () => {
			const invalidData = {
				name: "Test Group",
				stgyCodes: ["[stgy:aTest]"],
				version: 1,
			};

			const result = safeParseBoardGroupData(JSON.stringify(invalidData));

			expect(result).toBeNull();
		});

		it("should return null for missing required field: version", () => {
			const invalidData = {
				name: "Test Group",
				stgyCodes: ["[stgy:aTest]"],
				createdAt: "2024-01-15T12:00:00.000Z",
			};

			const result = safeParseBoardGroupData(JSON.stringify(invalidData));

			expect(result).toBeNull();
		});

		it("should return null for invalid JSON", () => {
			const result = safeParseBoardGroupData("not valid json");

			expect(result).toBeNull();
		});

		it("should return null for wrong type in stgyCodes", () => {
			const invalidData = {
				name: "Test Group",
				stgyCodes: "not an array",
				createdAt: "2024-01-15T12:00:00.000Z",
				version: 1,
			};

			const result = safeParseBoardGroupData(JSON.stringify(invalidData));

			expect(result).toBeNull();
		});

		it("should return null for wrong type in version", () => {
			const invalidData = {
				name: "Test Group",
				stgyCodes: ["[stgy:aTest]"],
				createdAt: "2024-01-15T12:00:00.000Z",
				version: "not a number",
			};

			const result = safeParseBoardGroupData(JSON.stringify(invalidData));

			expect(result).toBeNull();
		});

		it("should handle empty stgyCodes array", () => {
			const validData: BoardGroupData = {
				name: "Empty Group",
				stgyCodes: [],
				createdAt: "2024-01-15T12:00:00.000Z",
				version: 1,
			};

			const result = safeParseBoardGroupData(JSON.stringify(validData));

			expect(result).not.toBeNull();
			expect(result?.stgyCodes).toHaveLength(0);
		});
	});

	describe("safeParseBoardGroupHistory", () => {
		it("should parse valid history array", () => {
			const validHistory: BoardGroupVersion[] = [
				{
					version: 1,
					name: "Initial Version",
					stgyCodes: ["[stgy:aTest]"],
					updatedAt: "2024-01-15T12:00:00.000Z",
				},
				{
					version: 2,
					name: "Updated Version",
					description: "Added description",
					stgyCodes: ["[stgy:aTest1]", "[stgy:aTest2]"],
					updatedAt: "2024-01-16T10:00:00.000Z",
				},
			];

			const result = safeParseBoardGroupHistory(JSON.stringify(validHistory));

			expect(result).not.toBeNull();
			expect(result).toHaveLength(2);
			expect(result?.[0].version).toBe(1);
			expect(result?.[1].version).toBe(2);
		});

		it("should parse empty history array", () => {
			const result = safeParseBoardGroupHistory(JSON.stringify([]));

			expect(result).not.toBeNull();
			expect(result).toHaveLength(0);
		});

		it("should parse history item with optional description", () => {
			const history: BoardGroupVersion[] = [
				{
					version: 1,
					name: "With Description",
					description: "Test description",
					stgyCodes: ["[stgy:aTest]"],
					updatedAt: "2024-01-15T12:00:00.000Z",
				},
			];

			const result = safeParseBoardGroupHistory(JSON.stringify(history));

			expect(result).not.toBeNull();
			expect(result?.[0].description).toBe("Test description");
		});

		it("should return null for invalid JSON", () => {
			const result = safeParseBoardGroupHistory("not valid json");

			expect(result).toBeNull();
		});

		it("should return null for non-array", () => {
			const result = safeParseBoardGroupHistory(JSON.stringify({ version: 1 }));

			expect(result).toBeNull();
		});

		it("should return null for missing required field in item: version", () => {
			const invalidHistory = [
				{
					name: "Missing Version",
					stgyCodes: ["[stgy:aTest]"],
					updatedAt: "2024-01-15T12:00:00.000Z",
				},
			];

			const result = safeParseBoardGroupHistory(JSON.stringify(invalidHistory));

			expect(result).toBeNull();
		});

		it("should return null for missing required field in item: name", () => {
			const invalidHistory = [
				{
					version: 1,
					stgyCodes: ["[stgy:aTest]"],
					updatedAt: "2024-01-15T12:00:00.000Z",
				},
			];

			const result = safeParseBoardGroupHistory(JSON.stringify(invalidHistory));

			expect(result).toBeNull();
		});

		it("should return null for missing required field in item: stgyCodes", () => {
			const invalidHistory = [
				{
					version: 1,
					name: "Missing stgyCodes",
					updatedAt: "2024-01-15T12:00:00.000Z",
				},
			];

			const result = safeParseBoardGroupHistory(JSON.stringify(invalidHistory));

			expect(result).toBeNull();
		});

		it("should return null for missing required field in item: updatedAt", () => {
			const invalidHistory = [
				{
					version: 1,
					name: "Missing updatedAt",
					stgyCodes: ["[stgy:aTest]"],
				},
			];

			const result = safeParseBoardGroupHistory(JSON.stringify(invalidHistory));

			expect(result).toBeNull();
		});

		it("should return null if any item in the array is invalid", () => {
			const mixedHistory = [
				{
					version: 1,
					name: "Valid Item",
					stgyCodes: ["[stgy:aTest]"],
					updatedAt: "2024-01-15T12:00:00.000Z",
				},
				{
					version: 2,
					// Missing name
					stgyCodes: ["[stgy:aTest]"],
					updatedAt: "2024-01-16T10:00:00.000Z",
				},
			];

			const result = safeParseBoardGroupHistory(JSON.stringify(mixedHistory));

			expect(result).toBeNull();
		});
	});
});
