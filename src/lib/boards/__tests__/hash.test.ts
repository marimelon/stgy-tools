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
				width: 512,
				height: 384,
				name: "Test",
				backgroundId: 1,
				objects: [],
			};
			const stgyCode = encodeStgy(board, { key: 0 });

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

		it("should produce same hash for same content with different encryption keys", async () => {
			// Create a board
			const board: BoardData = {
				version: 2,
				width: 512,
				height: 384,
				name: "Test Board",
				backgroundId: 2,
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
						color: { r: 255, g: 0, b: 0, opacity: 50 },
					},
				],
			};

			// Encode with different keys
			const stgyCode0 = encodeStgy(board, { key: 0 });
			const stgyCode10 = encodeStgy(board, { key: 10 });
			const stgyCode63 = encodeStgy(board, { key: 63 });

			// The encoded strings should be different
			expect(stgyCode0).not.toBe(stgyCode10);
			expect(stgyCode0).not.toBe(stgyCode63);

			// But the content hashes should be the same
			const hash0 = await generateContentHash(stgyCode0);
			const hash10 = await generateContentHash(stgyCode10);
			const hash63 = await generateContentHash(stgyCode63);

			expect(hash0).toBe(hash10);
			expect(hash0).toBe(hash63);
		});

		it("should produce different hash for different content", async () => {
			const board1: BoardData = {
				version: 2,
				width: 512,
				height: 384,
				name: "Board 1",
				backgroundId: 1,
				objects: [],
			};

			const board2: BoardData = {
				version: 2,
				width: 512,
				height: 384,
				name: "Board 2",
				backgroundId: 1,
				objects: [],
			};

			const stgyCode1 = encodeStgy(board1, { key: 0 });
			const stgyCode2 = encodeStgy(board2, { key: 0 });

			const hash1 = await generateContentHash(stgyCode1);
			const hash2 = await generateContentHash(stgyCode2);

			expect(hash1).not.toBe(hash2);
		});
	});
});
