import { describe, expect, it } from "vitest";
import type { BoardData } from "@/lib/stgy";
import { encodeStgy } from "@/lib/stgy";
import { generateContentHash, generateHashFromBinary } from "../hash";

describe("hash", () => {
	describe("generateHashFromBinary", () => {
		it("should generate SHA-256 hash from binary data", async () => {
			const binary = new Uint8Array([1, 2, 3, 4, 5]);
			const hash = await generateHashFromBinary(binary);

			// SHA-256 produces 64 hex characters (256 bits = 32 bytes = 64 hex chars)
			expect(hash).toHaveLength(64);
			expect(hash).toMatch(/^[0-9a-f]+$/);
		});

		it("should produce consistent hash for same input", async () => {
			const binary = new Uint8Array([10, 20, 30]);
			const hash1 = await generateHashFromBinary(binary);
			const hash2 = await generateHashFromBinary(binary);

			expect(hash1).toBe(hash2);
		});

		it("should produce different hash for different input", async () => {
			const binary1 = new Uint8Array([1, 2, 3]);
			const binary2 = new Uint8Array([1, 2, 4]);
			const hash1 = await generateHashFromBinary(binary1);
			const hash2 = await generateHashFromBinary(binary2);

			expect(hash1).not.toBe(hash2);
		});

		it("should handle empty binary", async () => {
			const binary = new Uint8Array([]);
			const hash = await generateHashFromBinary(binary);

			expect(hash).toHaveLength(64);
			// SHA-256 of empty input is a known value
			expect(hash).toBe(
				"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			);
		});
	});

	describe("generateContentHash", () => {
		it("should generate hash from valid stgy code", async () => {
			// Create a simple board and encode it
			const board: BoardData = {
				version: 2,
				name: "Test",
				backgroundId: 1,
				objects: [],
			};
			const stgyCode = encodeStgy(board);

			const hash = await generateContentHash(stgyCode);

			expect(hash).not.toBeNull();
			expect(hash).toHaveLength(64);
			expect(hash).toMatch(/^[0-9a-f]+$/);
		});

		it("should return null for invalid stgy code", async () => {
			const invalidCode = "invalid-stgy-code";
			const hash = await generateContentHash(invalidCode);

			expect(hash).toBeNull();
		});

		it("should produce different hash for different content", async () => {
			const board1: BoardData = {
				version: 2,
				name: "Board 1",
				backgroundId: 1,
				objects: [],
			};

			const board2: BoardData = {
				version: 2,
				name: "Board 2",
				backgroundId: 1,
				objects: [],
			};

			const stgyCode1 = encodeStgy(board1);
			const stgyCode2 = encodeStgy(board2);

			const hash1 = await generateContentHash(stgyCode1);
			const hash2 = await generateContentHash(stgyCode2);

			expect(hash1).not.toBe(hash2);
		});
	});
});
