/**
 * ファクトリー関数のテスト
 */

import { describe, it, expect } from "vitest";
import {
	createEmptyBoard,
	createDefaultObject,
	duplicateObject,
	calculateTextBoardSize,
	recalculateBoardSize,
} from "../factory";
import { BackgroundId, ObjectIds } from "@/lib/stgy";
import i18n from "@/lib/i18n";

describe("factory", () => {
	describe("createEmptyBoard", () => {
		it("デフォルト値で空のボードを生成", () => {
			const board = createEmptyBoard();
			expect(board.version).toBe(2);
			expect(board.width).toBe(512);
			expect(board.height).toBe(384);
			expect(board.name).toBe("");
			expect(board.backgroundId).toBe(BackgroundId.None);
			expect(board.objects).toEqual([]);
		});

		it("名前を指定して生成", () => {
			const board = createEmptyBoard("テストボード");
			expect(board.name).toBe("テストボード");
		});
	});

	describe("createDefaultObject", () => {
		it("ロールアイコンのデフォルト値", () => {
			const obj = createDefaultObject(ObjectIds.Tank);
			expect(obj.objectId).toBe(ObjectIds.Tank);
			expect(obj.flags.visible).toBe(true);
			expect(obj.flags.flipHorizontal).toBe(false);
			expect(obj.flags.flipVertical).toBe(false);
			expect(obj.flags.locked).toBe(false);
			expect(obj.position).toEqual({ x: 256, y: 192 });
			expect(obj.rotation).toBe(0);
			expect(obj.color).toEqual({ r: 255, g: 100, b: 0, opacity: 0 });
		});

		it("位置を指定して生成", () => {
			const obj = createDefaultObject(ObjectIds.Tank, { x: 100, y: 50 });
			expect(obj.position).toEqual({ x: 100, y: 50 });
		});

		it("テキストオブジェクトはtextプロパティを持つ", () => {
			const obj = createDefaultObject(ObjectIds.Text);
			expect(obj.text).toBe(i18n.t("common.defaultText"));
		});

		it("ConeAoEはparam1（角度）を持つ", () => {
			const obj = createDefaultObject(ObjectIds.ConeAoE);
			expect(obj.param1).toBeDefined();
		});

		it("DonutAoEは初期角度360度", () => {
			const obj = createDefaultObject(ObjectIds.DonutAoE);
			expect(obj.param1).toBe(360);
		});

		it("LineAoEはparam1（縦幅）とparam2（横幅）を持つ", () => {
			const obj = createDefaultObject(ObjectIds.LineAoE);
			expect(obj.param1).toBe(128); // デフォルト縦幅
			expect(obj.param2).toBe(128); // デフォルト横幅
		});
	});

	describe("duplicateObject", () => {
		it("オブジェクトを複製（デフォルトオフセット）", () => {
			const original = createDefaultObject(ObjectIds.Tank, { x: 100, y: 100 });
			const copy = duplicateObject(original);

			expect(copy.objectId).toBe(original.objectId);
			expect(copy.position).toEqual({ x: 110, y: 110 }); // +10, +10
			expect(copy.rotation).toBe(original.rotation);
			expect(copy.size).toBe(original.size);
		});

		it("カスタムオフセットで複製", () => {
			const original = createDefaultObject(ObjectIds.Healer, { x: 50, y: 50 });
			const copy = duplicateObject(original, { x: 20, y: 30 });

			expect(copy.position).toEqual({ x: 70, y: 80 });
		});

		it("複製は元のオブジェクトと独立（深いコピー）", () => {
			const original = createDefaultObject(ObjectIds.DPS);
			const copy = duplicateObject(original);

			// flagsを変更しても元に影響しない
			copy.flags.visible = false;
			expect(original.flags.visible).toBe(true);

			// colorを変更しても元に影響しない
			copy.color.r = 0;
			expect(original.color.r).toBe(255);
		});
	});

	describe("calculateTextBoardSize", () => {
		it("空のテキスト", () => {
			const size = calculateTextBoardSize(0);
			expect(size.width).toBe(104);
			expect(size.height).toBe(92);
		});

		it("10文字のテキスト", () => {
			const size = calculateTextBoardSize(10);
			expect(size.width).toBe(144); // 104 + 10*4
			expect(size.height).toBe(132); // 92 + 10*4
		});

		it("100文字のテキスト", () => {
			const size = calculateTextBoardSize(100);
			expect(size.width).toBe(504); // 104 + 100*4
			expect(size.height).toBe(492); // 92 + 100*4
		});
	});

	describe("recalculateBoardSize", () => {
		it("オブジェクトがない場合は現在のサイズを維持", () => {
			const board = createEmptyBoard();
			const size = recalculateBoardSize(board);
			expect(size).toEqual({ width: 512, height: 384 });
		});

		it("単一のテキストオブジェクトの場合はテキスト長から計算", () => {
			const board = createEmptyBoard();
			const textObj = createDefaultObject(ObjectIds.Text);
			textObj.text = "Hello"; // 5文字
			board.objects = [textObj];

			const size = recalculateBoardSize(board);
			expect(size.width).toBe(124); // 104 + 5*4
			expect(size.height).toBe(112); // 92 + 5*4
		});

		it("非表示オブジェクトは無視", () => {
			const board = createEmptyBoard();
			const textObj = createDefaultObject(ObjectIds.Text);
			textObj.text = "Hidden";
			textObj.flags.visible = false;
			board.objects = [textObj];

			const size = recalculateBoardSize(board);
			expect(size).toEqual({ width: 512, height: 384 });
		});

		it("複数オブジェクトの場合は現在のサイズを維持", () => {
			const board = createEmptyBoard();
			board.objects = [
				createDefaultObject(ObjectIds.Tank),
				createDefaultObject(ObjectIds.Healer),
			];

			const size = recalculateBoardSize(board);
			expect(size).toEqual({ width: 512, height: 384 });
		});
	});
});
