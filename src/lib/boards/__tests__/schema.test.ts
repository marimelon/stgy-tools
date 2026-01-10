/**
 * Schema tests for board and folder storage
 */

import { describe, expect, it } from "vitest";
import { storedBoardSchema, storedFolderSchema } from "../schema";

describe("storedFolderSchema", () => {
	it("should validate a valid folder", () => {
		const folder = {
			id: "test-id",
			name: "Test Folder",
			parentId: null,
			order: 0,
			collapsed: false,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		const result = storedFolderSchema.safeParse(folder);
		expect(result.success).toBe(true);
	});

	it("should apply default values for optional fields", () => {
		const folder = {
			id: "test-id",
			name: "Test Folder",
			order: 0,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		const result = storedFolderSchema.safeParse(folder);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.parentId).toBe(null);
			expect(result.data.collapsed).toBe(false);
		}
	});

	it("should allow parentId for future hierarchy support", () => {
		const folder = {
			id: "child-id",
			name: "Child Folder",
			parentId: "parent-id",
			order: 1,
			collapsed: true,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		const result = storedFolderSchema.safeParse(folder);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.parentId).toBe("parent-id");
		}
	});

	it("should reject invalid folder without required fields", () => {
		const invalidFolder = {
			id: "test-id",
			// missing name, order, createdAt, updatedAt
		};

		const result = storedFolderSchema.safeParse(invalidFolder);
		expect(result.success).toBe(false);
	});

	it("should reject folder with invalid types", () => {
		const invalidFolder = {
			id: 123, // should be string
			name: "Test",
			order: "not-a-number", // should be number
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		const result = storedFolderSchema.safeParse(invalidFolder);
		expect(result.success).toBe(false);
	});

	it("should handle collapsed as true", () => {
		const folder = {
			id: "test-id",
			name: "Collapsed Folder",
			order: 0,
			collapsed: true,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		const result = storedFolderSchema.safeParse(folder);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.collapsed).toBe(true);
		}
	});
});

describe("storedBoardSchema", () => {
	const validBoard = {
		id: "board-id",
		name: "Test Board",
		stgyCode: "[stgy:atest]",
		groups: [],
		gridSettings: {
			enabled: false,
			size: 16,
			showGrid: false,
		},
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	};

	it("should validate a board with folderId", () => {
		const board = {
			...validBoard,
			folderId: "folder-id",
		};

		const result = storedBoardSchema.safeParse(board);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.folderId).toBe("folder-id");
		}
	});

	it("should validate a board with folderId as null (root)", () => {
		const board = {
			...validBoard,
			folderId: null,
		};

		const result = storedBoardSchema.safeParse(board);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.folderId).toBe(null);
		}
	});

	it("should apply default folderId as null for backward compatibility", () => {
		// Old boards without folderId field should default to null (root)
		const result = storedBoardSchema.safeParse(validBoard);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.folderId).toBe(null);
		}
	});

	it("should validate board with all optional fields", () => {
		const board = {
			...validBoard,
			folderId: "folder-id",
			encodeKey: 42,
			contentHash: "abc123",
		};

		const result = storedBoardSchema.safeParse(board);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.encodeKey).toBe(42);
			expect(result.data.contentHash).toBe("abc123");
			expect(result.data.folderId).toBe("folder-id");
		}
	});

	it("should reject board with invalid folderId type", () => {
		const board = {
			...validBoard,
			folderId: 123, // should be string or null
		};

		const result = storedBoardSchema.safeParse(board);
		expect(result.success).toBe(false);
	});

	it("should reject board without required fields", () => {
		const invalidBoard = {
			id: "board-id",
			name: "Test Board",
			// missing stgyCode, groups, gridSettings, createdAt, updatedAt
		};

		const result = storedBoardSchema.safeParse(invalidBoard);
		expect(result.success).toBe(false);
	});
});
