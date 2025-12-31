/**
 * テキスト幅計算関数のテスト
 */

import { describe, expect, it } from "vitest";
import { calculateTextWidth, isFullWidthChar, TEXT } from "../constants";

describe("text-width", () => {
	describe("isFullWidthChar", () => {
		describe("半角文字", () => {
			it("ASCII英字", () => {
				expect(isFullWidthChar("A")).toBe(false);
				expect(isFullWidthChar("z")).toBe(false);
			});

			it("ASCII数字", () => {
				expect(isFullWidthChar("0")).toBe(false);
				expect(isFullWidthChar("9")).toBe(false);
			});

			it("ASCII記号", () => {
				expect(isFullWidthChar("!")).toBe(false);
				expect(isFullWidthChar("@")).toBe(false);
				expect(isFullWidthChar(" ")).toBe(false);
			});

			it("半角カタカナ", () => {
				expect(isFullWidthChar("ｱ")).toBe(false); // U+FF71
				expect(isFullWidthChar("ｶ")).toBe(false); // U+FF76
				expect(isFullWidthChar("ﾝ")).toBe(false); // U+FF9D
				expect(isFullWidthChar("ﾞ")).toBe(false); // U+FF9E (濁点)
				expect(isFullWidthChar("ﾟ")).toBe(false); // U+FF9F (半濁点)
			});
		});

		describe("全角文字", () => {
			it("ひらがな", () => {
				expect(isFullWidthChar("あ")).toBe(true);
				expect(isFullWidthChar("ん")).toBe(true);
			});

			it("カタカナ", () => {
				expect(isFullWidthChar("ア")).toBe(true);
				expect(isFullWidthChar("ン")).toBe(true);
			});

			it("漢字 (CJK統合漢字)", () => {
				expect(isFullWidthChar("漢")).toBe(true);
				expect(isFullWidthChar("字")).toBe(true);
			});

			it("全角英数字", () => {
				expect(isFullWidthChar("Ａ")).toBe(true); // U+FF21
				expect(isFullWidthChar("０")).toBe(true); // U+FF10
			});

			it("全角記号", () => {
				expect(isFullWidthChar("。")).toBe(true); // U+3002
				expect(isFullWidthChar("、")).toBe(true); // U+3001
				expect(isFullWidthChar("　")).toBe(true); // U+3000 (全角スペース)
			});

			it("CJK統合漢字拡張A", () => {
				expect(isFullWidthChar("㐀")).toBe(true); // U+3400
			});

			it("CJK統合漢字拡張B (サロゲートペア)", () => {
				expect(isFullWidthChar("𠀀")).toBe(true); // U+20000
				expect(isFullWidthChar("𪜀")).toBe(true); // U+2A700
			});
		});

		describe("エッジケース", () => {
			it("空文字列", () => {
				expect(isFullWidthChar("")).toBe(false);
			});

			it("複数文字の場合は最初の文字のみ判定", () => {
				expect(isFullWidthChar("abc")).toBe(false);
				expect(isFullWidthChar("あbc")).toBe(true);
			});
		});
	});

	describe("calculateTextWidth", () => {
		it("空文字列", () => {
			expect(calculateTextWidth("")).toBe(0);
		});

		it("半角文字のみ", () => {
			expect(calculateTextWidth("Hello")).toBe(5 * TEXT.HALF_WIDTH_CHAR);
			expect(calculateTextWidth("12345")).toBe(5 * TEXT.HALF_WIDTH_CHAR);
		});

		it("全角文字のみ", () => {
			expect(calculateTextWidth("テスト")).toBe(3 * TEXT.FULL_WIDTH_CHAR);
			expect(calculateTextWidth("漢字")).toBe(2 * TEXT.FULL_WIDTH_CHAR);
		});

		it("半角・全角混在", () => {
			// "Helloテスト" = 5半角 + 3全角
			const expected = 5 * TEXT.HALF_WIDTH_CHAR + 3 * TEXT.FULL_WIDTH_CHAR;
			expect(calculateTextWidth("Helloテスト")).toBe(expected);
		});

		it("半角カタカナ", () => {
			// "ｱｲｳ" = 3半角
			expect(calculateTextWidth("ｱｲｳ")).toBe(3 * TEXT.HALF_WIDTH_CHAR);
		});

		it("サロゲートペア文字", () => {
			// "𠀀𠀁" = 2全角 (CJK拡張B)
			expect(calculateTextWidth("𠀀𠀁")).toBe(2 * TEXT.FULL_WIDTH_CHAR);
		});

		it("複合ケース", () => {
			// "MT1 タンク" = M(半) T(半) 1(半) 空白(半) タ(全) ン(全) ク(全)
			const expected = 4 * TEXT.HALF_WIDTH_CHAR + 3 * TEXT.FULL_WIDTH_CHAR;
			expect(calculateTextWidth("MT1 タンク")).toBe(expected);
		});
	});
});
