/**
 * ファクトリー関数のテスト
 */

import { describe, expect, it } from "vitest";
import i18n from "@/lib/i18n";
import { BackgroundId, ObjectIds } from "@/lib/stgy";
import {
	calculateTextBoardSize,
	createDefaultObject,
	createEmptyBoard,
	duplicateObject,
	recalculateBoardSize,
} from "../factory";

describe("factory", () => {
	describe("createEmptyBoard", () => {
		it("デフォルト値で空のボードを生成", () => {
			const board = createEmptyBoard();
			expect(board.version).toBe(2);
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
			expect(obj.color).toEqual({ r: 255, g: 128, b: 0, opacity: 0 });
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

	describe("calculateTextBoardSize (deprecated)", () => {
		it("常にデフォルトキャンバスサイズを返す", () => {
			// @deprecated: stgyバイナリフォーマットにはボードサイズは含まれない
			expect(calculateTextBoardSize(0)).toEqual({ width: 512, height: 384 });
			expect(calculateTextBoardSize(10)).toEqual({ width: 512, height: 384 });
			expect(calculateTextBoardSize(100)).toEqual({ width: 512, height: 384 });
		});
	});

	describe("recalculateBoardSize (deprecated)", () => {
		it("常にデフォルトキャンバスサイズを返す", () => {
			// @deprecated: stgyバイナリフォーマットにはボードサイズは含まれない
			const board = createEmptyBoard();
			const size = recalculateBoardSize(board);
			expect(size).toEqual({ width: 512, height: 384 });
		});
	});
});
