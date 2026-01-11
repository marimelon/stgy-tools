import { describe, expect, it } from "vitest";
import { calculateTextWidth, isFullWidthChar, TEXT } from "../constants";

describe("text-width", () => {
	describe("isFullWidthChar", () => {
		describe("half-width characters", () => {
			it("ASCII letters", () => {
				expect(isFullWidthChar("A")).toBe(false);
				expect(isFullWidthChar("z")).toBe(false);
			});

			it("ASCII digits", () => {
				expect(isFullWidthChar("0")).toBe(false);
				expect(isFullWidthChar("9")).toBe(false);
			});

			it("ASCII symbols", () => {
				expect(isFullWidthChar("!")).toBe(false);
				expect(isFullWidthChar("@")).toBe(false);
				expect(isFullWidthChar(" ")).toBe(false);
			});

			it("half-width katakana", () => {
				expect(isFullWidthChar("ｱ")).toBe(false); // U+FF71
				expect(isFullWidthChar("ｶ")).toBe(false); // U+FF76
				expect(isFullWidthChar("ﾝ")).toBe(false); // U+FF9D
				expect(isFullWidthChar("ﾞ")).toBe(false); // U+FF9E (dakuten)
				expect(isFullWidthChar("ﾟ")).toBe(false); // U+FF9F (handakuten)
			});
		});

		describe("full-width characters", () => {
			it("hiragana", () => {
				expect(isFullWidthChar("あ")).toBe(true);
				expect(isFullWidthChar("ん")).toBe(true);
			});

			it("katakana", () => {
				expect(isFullWidthChar("ア")).toBe(true);
				expect(isFullWidthChar("ン")).toBe(true);
			});

			it("kanji (CJK Unified Ideographs)", () => {
				expect(isFullWidthChar("漢")).toBe(true);
				expect(isFullWidthChar("字")).toBe(true);
			});

			it("full-width alphanumerics", () => {
				expect(isFullWidthChar("Ａ")).toBe(true); // U+FF21
				expect(isFullWidthChar("０")).toBe(true); // U+FF10
			});

			it("full-width symbols", () => {
				expect(isFullWidthChar("。")).toBe(true); // U+3002
				expect(isFullWidthChar("、")).toBe(true); // U+3001
				expect(isFullWidthChar("　")).toBe(true); // U+3000 (full-width space)
			});

			it("CJK Unified Ideographs Extension A", () => {
				expect(isFullWidthChar("㐀")).toBe(true); // U+3400
			});

			it("CJK Unified Ideographs Extension B (surrogate pair)", () => {
				expect(isFullWidthChar("𠀀")).toBe(true); // U+20000
				expect(isFullWidthChar("𪜀")).toBe(true); // U+2A700
			});
		});

		describe("edge cases", () => {
			it("empty string", () => {
				expect(isFullWidthChar("")).toBe(false);
			});

			it("only evaluates first character for multi-char strings", () => {
				expect(isFullWidthChar("abc")).toBe(false);
				expect(isFullWidthChar("あbc")).toBe(true);
			});
		});
	});

	describe("calculateTextWidth", () => {
		it("empty string", () => {
			expect(calculateTextWidth("")).toBe(0);
		});

		it("half-width only", () => {
			expect(calculateTextWidth("Hello")).toBe(5 * TEXT.HALF_WIDTH_CHAR);
			expect(calculateTextWidth("12345")).toBe(5 * TEXT.HALF_WIDTH_CHAR);
		});

		it("full-width only", () => {
			expect(calculateTextWidth("テスト")).toBe(3 * TEXT.FULL_WIDTH_CHAR);
			expect(calculateTextWidth("漢字")).toBe(2 * TEXT.FULL_WIDTH_CHAR);
		});

		it("mixed half-width and full-width", () => {
			const expected = 5 * TEXT.HALF_WIDTH_CHAR + 3 * TEXT.FULL_WIDTH_CHAR;
			expect(calculateTextWidth("Helloテスト")).toBe(expected);
		});

		it("half-width katakana", () => {
			expect(calculateTextWidth("ｱｲｳ")).toBe(3 * TEXT.HALF_WIDTH_CHAR);
		});

		it("surrogate pair characters", () => {
			expect(calculateTextWidth("𠀀𠀁")).toBe(2 * TEXT.FULL_WIDTH_CHAR);
		});

		it("complex case", () => {
			const expected = 4 * TEXT.HALF_WIDTH_CHAR + 3 * TEXT.FULL_WIDTH_CHAR;
			expect(calculateTextWidth("MT1 タンク")).toBe(expected);
		});
	});
});
