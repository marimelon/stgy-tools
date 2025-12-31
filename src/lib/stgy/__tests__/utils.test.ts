import { describe, expect, it } from "vitest";
import { MAX_TEXT_BYTES } from "../constants";
import {
	getPadding2,
	getPadding4,
	getUtf8ByteLength,
	padTo2Bytes,
	padTo4Bytes,
	truncateToUtf8Bytes,
} from "../utils";

describe("utils", () => {
	describe("padTo4Bytes", () => {
		it("should return same value for already aligned length", () => {
			expect(padTo4Bytes(0)).toBe(0);
			expect(padTo4Bytes(4)).toBe(4);
			expect(padTo4Bytes(8)).toBe(8);
		});

		it("should pad to next 4-byte boundary", () => {
			expect(padTo4Bytes(1)).toBe(4);
			expect(padTo4Bytes(2)).toBe(4);
			expect(padTo4Bytes(3)).toBe(4);
			expect(padTo4Bytes(5)).toBe(8);
		});
	});

	describe("padTo2Bytes", () => {
		it("should return same value for already aligned length", () => {
			expect(padTo2Bytes(0)).toBe(0);
			expect(padTo2Bytes(2)).toBe(2);
			expect(padTo2Bytes(4)).toBe(4);
		});

		it("should pad to next 2-byte boundary", () => {
			expect(padTo2Bytes(1)).toBe(2);
			expect(padTo2Bytes(3)).toBe(4);
			expect(padTo2Bytes(5)).toBe(6);
		});
	});

	describe("getPadding4", () => {
		it("should return 0 for aligned length", () => {
			expect(getPadding4(0)).toBe(0);
			expect(getPadding4(4)).toBe(0);
			expect(getPadding4(8)).toBe(0);
		});

		it("should return padding bytes needed", () => {
			expect(getPadding4(1)).toBe(3);
			expect(getPadding4(2)).toBe(2);
			expect(getPadding4(3)).toBe(1);
			expect(getPadding4(5)).toBe(3);
		});
	});

	describe("getPadding2", () => {
		it("should return 0 for aligned length", () => {
			expect(getPadding2(0)).toBe(0);
			expect(getPadding2(2)).toBe(0);
			expect(getPadding2(4)).toBe(0);
		});

		it("should return padding bytes needed", () => {
			expect(getPadding2(1)).toBe(1);
			expect(getPadding2(3)).toBe(1);
			expect(getPadding2(5)).toBe(1);
		});
	});

	describe("getUtf8ByteLength", () => {
		it("should return correct length for ASCII", () => {
			expect(getUtf8ByteLength("")).toBe(0);
			expect(getUtf8ByteLength("a")).toBe(1);
			expect(getUtf8ByteLength("hello")).toBe(5);
			expect(getUtf8ByteLength("Hello World")).toBe(11);
		});

		it("should return correct length for Japanese characters", () => {
			// 日本語は1文字3バイト (UTF-8)
			expect(getUtf8ByteLength("あ")).toBe(3);
			expect(getUtf8ByteLength("あいう")).toBe(9);
			expect(getUtf8ByteLength("テスト")).toBe(9);
		});

		it("should return correct length for mixed content", () => {
			expect(getUtf8ByteLength("a あ")).toBe(5); // 1 + 1 + 3
			expect(getUtf8ByteLength("test テスト")).toBe(14); // 4 + 1 + 9
		});

		it("should return correct length for emoji", () => {
			// 絵文字は4バイト
			expect(getUtf8ByteLength("😀")).toBe(4);
			expect(getUtf8ByteLength("👍")).toBe(4);
		});
	});

	describe("truncateToUtf8Bytes", () => {
		it("should not truncate if within limit", () => {
			expect(truncateToUtf8Bytes("hello", 10)).toBe("hello");
			expect(truncateToUtf8Bytes("hello", 5)).toBe("hello");
			expect(truncateToUtf8Bytes("", 10)).toBe("");
		});

		it("should truncate ASCII correctly", () => {
			expect(truncateToUtf8Bytes("hello world", 5)).toBe("hello");
			expect(truncateToUtf8Bytes("abcdefghij", 3)).toBe("abc");
		});

		it("should truncate Japanese without breaking characters", () => {
			// "あいう" = 9 bytes, truncate to 6 should give "あい"
			expect(truncateToUtf8Bytes("あいう", 6)).toBe("あい");
			// truncate to 3 should give "あ"
			expect(truncateToUtf8Bytes("あいう", 3)).toBe("あ");
			// truncate to 4 should give "あ" (can't fit partial second char)
			expect(truncateToUtf8Bytes("あいう", 4)).toBe("あ");
			// truncate to 5 should give "あ" (can't fit partial second char)
			expect(truncateToUtf8Bytes("あいう", 5)).toBe("あ");
		});

		it("should handle mixed content correctly", () => {
			// "aあb" = 1 + 3 + 1 = 5 bytes
			expect(truncateToUtf8Bytes("aあb", 5)).toBe("aあb");
			expect(truncateToUtf8Bytes("aあb", 4)).toBe("aあ");
			expect(truncateToUtf8Bytes("aあb", 3)).toBe("a"); // can't fit "あ" in 2 bytes
			expect(truncateToUtf8Bytes("aあb", 1)).toBe("a");
		});

		it("should handle emoji correctly", () => {
			// 😀 = 4 bytes
			expect(truncateToUtf8Bytes("😀", 4)).toBe("😀");
			expect(truncateToUtf8Bytes("😀", 3)).toBe(""); // can't fit partial emoji
			expect(truncateToUtf8Bytes("a😀", 5)).toBe("a😀");
			expect(truncateToUtf8Bytes("a😀", 4)).toBe("a"); // can't fit emoji in 3 bytes
		});

		it("should work with MAX_TEXT_BYTES limit", () => {
			// 30 bytes = 10 Japanese characters
			const tenChars = "あいうえおかきくけこ";
			expect(getUtf8ByteLength(tenChars)).toBe(30);
			expect(truncateToUtf8Bytes(tenChars, MAX_TEXT_BYTES)).toBe(tenChars);

			// 11 Japanese characters should be truncated to 10
			const elevenChars = "あいうえおかきくけこさ";
			expect(truncateToUtf8Bytes(elevenChars, MAX_TEXT_BYTES)).toBe(tenChars);

			// 30 ASCII characters should fit exactly
			const thirtyAscii = "abcdefghijklmnopqrstuvwxyz1234";
			expect(getUtf8ByteLength(thirtyAscii)).toBe(30);
			expect(truncateToUtf8Bytes(thirtyAscii, MAX_TEXT_BYTES)).toBe(
				thirtyAscii,
			);

			// 31 ASCII characters should be truncated
			const thirtyOneAscii = "abcdefghijklmnopqrstuvwxyz12345";
			expect(truncateToUtf8Bytes(thirtyOneAscii, MAX_TEXT_BYTES)).toBe(
				thirtyAscii,
			);
		});

		it("should return empty string for 0 maxBytes", () => {
			expect(truncateToUtf8Bytes("hello", 0)).toBe("");
			expect(truncateToUtf8Bytes("あ", 0)).toBe("");
		});
	});
});
