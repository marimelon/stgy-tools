import { describe, expect, it } from "vitest";
import {
	generateEditKey,
	generateGroupId,
	generateShortId,
	hashEditKey,
	isValidCustomEditKey,
	isValidEditKey,
	isValidGroupId,
	isValidShortId,
	isValidStgyCode,
	verifyEditKey,
} from "../idGenerator";

describe("idGenerator", () => {
	describe("generateShortId", () => {
		it("should generate a 7-character Base62 ID", async () => {
			const id = await generateShortId("[stgy:aTestContent]");

			expect(id).toHaveLength(7);
			expect(id).toMatch(/^[0-9A-Za-z]+$/);
		});

		it("should be deterministic for the same input", async () => {
			const stgy = "[stgy:aTestContent]";
			const id1 = await generateShortId(stgy);
			const id2 = await generateShortId(stgy);

			expect(id1).toBe(id2);
		});

		it("should produce different IDs for different inputs", async () => {
			const id1 = await generateShortId("[stgy:aContent1]");
			const id2 = await generateShortId("[stgy:aContent2]");

			expect(id1).not.toBe(id2);
		});

		it("should produce different IDs with different attempt values", async () => {
			const stgy = "[stgy:aTestContent]";
			const id0 = await generateShortId(stgy, 0);
			const id1 = await generateShortId(stgy, 1);
			const id2 = await generateShortId(stgy, 2);

			expect(id0).not.toBe(id1);
			expect(id1).not.toBe(id2);
			expect(id0).not.toBe(id2);
		});
	});

	describe("isValidShortId", () => {
		it("should return true for valid 7-character Base62 ID", () => {
			expect(isValidShortId("AbCd123")).toBe(true);
			expect(isValidShortId("0000000")).toBe(true);
			expect(isValidShortId("zzzzzzz")).toBe(true);
		});

		it("should return false for invalid length", () => {
			expect(isValidShortId("AbCd12")).toBe(false); // Too short
			expect(isValidShortId("AbCd1234")).toBe(false); // Too long
			expect(isValidShortId("")).toBe(false);
		});

		it("should return false for invalid characters", () => {
			expect(isValidShortId("AbCd12!")).toBe(false);
			expect(isValidShortId("AbCd12_")).toBe(false);
			expect(isValidShortId("AbCd12-")).toBe(false);
		});
	});

	describe("isValidStgyCode", () => {
		it("should return true for valid stgy codes", () => {
			expect(isValidStgyCode("[stgy:aTestContent]")).toBe(true);
			expect(isValidStgyCode("[stgy:a0OcAwAYAfwgAFYAFBAAZYTLd]")).toBe(true);
		});

		it("should return false for invalid format", () => {
			expect(isValidStgyCode("stgy:aTest")).toBe(false); // Missing brackets
			expect(isValidStgyCode("[stgy:a]")).toBe(false); // Too short
			expect(isValidStgyCode("[other:aTest]")).toBe(false); // Wrong prefix
			expect(isValidStgyCode("")).toBe(false);
			expect(isValidStgyCode("[stgy:aTest")).toBe(false); // Missing closing bracket
		});
	});

	describe("generateGroupId", () => {
		it("should generate a 7-character Base62 ID", async () => {
			const id = await generateGroupId();

			expect(id).toHaveLength(7);
			expect(id).toMatch(/^[0-9A-Za-z]+$/);
		});

		it("should generate unique IDs on each call", async () => {
			const ids = new Set<string>();

			for (let i = 0; i < 100; i++) {
				ids.add(await generateGroupId());
			}

			// With 62^7 possible values, collisions are extremely unlikely
			expect(ids.size).toBe(100);
		});
	});

	describe("isValidGroupId", () => {
		it("should return true for valid group IDs", () => {
			expect(isValidGroupId("AbCd123")).toBe(true);
		});

		it("should return false for invalid group IDs", () => {
			expect(isValidGroupId("AbCd12")).toBe(false);
			expect(isValidGroupId("AbCd12!")).toBe(false);
		});
	});

	describe("generateEditKey", () => {
		it("should generate a 16-character Base62 key", async () => {
			const key = await generateEditKey();

			expect(key).toHaveLength(16);
			expect(key).toMatch(/^[0-9A-Za-z]+$/);
		});

		it("should generate unique keys on each call", async () => {
			const keys = new Set<string>();

			for (let i = 0; i < 100; i++) {
				keys.add(await generateEditKey());
			}

			expect(keys.size).toBe(100);
		});
	});

	describe("hashEditKey", () => {
		it("should generate a 64-character hex hash", async () => {
			const hash = await hashEditKey("testEditKey12345");

			expect(hash).toHaveLength(64);
			expect(hash).toMatch(/^[0-9a-f]+$/);
		});

		it("should be deterministic", async () => {
			const key = "testEditKey12345";
			const hash1 = await hashEditKey(key);
			const hash2 = await hashEditKey(key);

			expect(hash1).toBe(hash2);
		});

		it("should produce different hashes for different keys", async () => {
			const hash1 = await hashEditKey("testKey1");
			const hash2 = await hashEditKey("testKey2");

			expect(hash1).not.toBe(hash2);
		});
	});

	describe("verifyEditKey", () => {
		it("should return true for matching key and hash", async () => {
			const key = "testEditKey12345";
			const hash = await hashEditKey(key);

			const result = await verifyEditKey(key, hash);

			expect(result).toBe(true);
		});

		it("should return false for non-matching key", async () => {
			const key = "testEditKey12345";
			const hash = await hashEditKey(key);

			const result = await verifyEditKey("wrongKey12345678", hash);

			expect(result).toBe(false);
		});

		it("should return false for tampered hash", async () => {
			const key = "testEditKey12345";
			const hash = await hashEditKey(key);
			const tamperedHash = `${hash.slice(0, -1)}0`; // Change last character

			const result = await verifyEditKey(key, tamperedHash);

			expect(result).toBe(false);
		});

		it("should return false for different length hashes", async () => {
			const key = "testEditKey12345";

			const result = await verifyEditKey(key, "shorthash");

			expect(result).toBe(false);
		});
	});

	describe("isValidEditKey", () => {
		it("should return true for valid 16-character Base62 keys", () => {
			expect(isValidEditKey("AbCdEfGh12345678")).toBe(true);
			expect(isValidEditKey("0000000000000000")).toBe(true);
			expect(isValidEditKey("zzzzzzzzzzzzzzzz")).toBe(true);
		});

		it("should return false for invalid length", () => {
			expect(isValidEditKey("AbCdEfGh1234567")).toBe(false); // 15 chars
			expect(isValidEditKey("AbCdEfGh123456789")).toBe(false); // 17 chars
			expect(isValidEditKey("")).toBe(false);
		});

		it("should return false for invalid characters", () => {
			expect(isValidEditKey("AbCdEfGh1234567!")).toBe(false);
			expect(isValidEditKey("AbCdEfGh1234567_")).toBe(false);
			expect(isValidEditKey("AbCdEfGh1234567-")).toBe(false);
			expect(isValidEditKey("AbCdEfGh1234567 ")).toBe(false);
		});
	});

	describe("isValidCustomEditKey", () => {
		it("should return true for valid custom keys (4-64 chars)", () => {
			expect(isValidCustomEditKey("test")).toBe(true); // 4 chars (minimum)
			expect(isValidCustomEditKey("myPassword123")).toBe(true);
			expect(isValidCustomEditKey("a".repeat(64))).toBe(true); // 64 chars (maximum)
		});

		it("should return true for keys with special characters", () => {
			expect(isValidCustomEditKey("test@123!")).toBe(true);
			expect(isValidCustomEditKey("my password")).toBe(true);
			expect(isValidCustomEditKey("key-with-dashes")).toBe(true);
			expect(isValidCustomEditKey("key_with_underscores")).toBe(true);
		});

		it("should return false for keys that are too short", () => {
			expect(isValidCustomEditKey("abc")).toBe(false); // 3 chars
			expect(isValidCustomEditKey("ab")).toBe(false);
			expect(isValidCustomEditKey("a")).toBe(false);
			expect(isValidCustomEditKey("")).toBe(false);
		});

		it("should return false for keys that are too long", () => {
			expect(isValidCustomEditKey("a".repeat(65))).toBe(false);
			expect(isValidCustomEditKey("a".repeat(100))).toBe(false);
		});

		it("should return false for keys with non-printable characters", () => {
			expect(isValidCustomEditKey("test\x00key")).toBe(false); // NULL
			expect(isValidCustomEditKey("test\nkey")).toBe(false); // Newline
			expect(isValidCustomEditKey("test\tkey")).toBe(false); // Tab
		});
	});
});
