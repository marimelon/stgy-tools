/**
 * 座標ユーティリティのテスト
 */

import { describe, it, expect } from "vitest";
import {
	calculateRotation,
	clampToCanvas,
	snapToGrid,
	distance,
} from "../coordinates";

describe("coordinates", () => {
	describe("calculateRotation", () => {
		it("上方向は0度", () => {
			const center = { x: 100, y: 100 };
			const point = { x: 100, y: 50 }; // 真上
			expect(calculateRotation(center, point)).toBe(0);
		});

		it("右方向は90度", () => {
			const center = { x: 100, y: 100 };
			const point = { x: 150, y: 100 }; // 真右
			expect(calculateRotation(center, point)).toBe(90);
		});

		it("下方向は180度または-180度", () => {
			const center = { x: 100, y: 100 };
			const point = { x: 100, y: 150 }; // 真下
			const result = calculateRotation(center, point);
			expect(Math.abs(result)).toBe(180);
		});

		it("左方向は-90度", () => {
			const center = { x: 100, y: 100 };
			const point = { x: 50, y: 100 }; // 真左
			expect(calculateRotation(center, point)).toBe(-90);
		});

		it("右上45度方向は45度", () => {
			const center = { x: 100, y: 100 };
			const point = { x: 150, y: 50 }; // 右上45度
			expect(calculateRotation(center, point)).toBe(45);
		});

		it("同じ点では90度（atan2の仕様）", () => {
			const center = { x: 100, y: 100 };
			const result = calculateRotation(center, center);
			expect(result).toBe(90); // atan2(0, 0) = 0, +90 = 90
		});
	});

	describe("clampToCanvas", () => {
		const canvas = { width: 512, height: 384 };

		it("キャンバス内の位置はそのまま返す", () => {
			const pos = { x: 100, y: 100 };
			expect(clampToCanvas(pos, canvas)).toEqual(pos);
		});

		it("負の座標は0にクランプ", () => {
			const pos = { x: -50, y: -30 };
			expect(clampToCanvas(pos, canvas)).toEqual({ x: 0, y: 0 });
		});

		it("キャンバスを超える座標は最大値にクランプ", () => {
			const pos = { x: 600, y: 500 };
			expect(clampToCanvas(pos, canvas)).toEqual({ x: 512, y: 384 });
		});

		it("X軸のみ超過した場合", () => {
			const pos = { x: 600, y: 100 };
			expect(clampToCanvas(pos, canvas)).toEqual({ x: 512, y: 100 });
		});

		it("境界値は維持", () => {
			expect(clampToCanvas({ x: 0, y: 0 }, canvas)).toEqual({ x: 0, y: 0 });
			expect(clampToCanvas({ x: 512, y: 384 }, canvas)).toEqual({
				x: 512,
				y: 384,
			});
		});
	});

	describe("snapToGrid", () => {
		it("グリッドサイズ16でスナップ", () => {
			expect(snapToGrid({ x: 10, y: 10 }, 16)).toEqual({ x: 16, y: 16 });
			expect(snapToGrid({ x: 7, y: 7 }, 16)).toEqual({ x: 0, y: 0 });
			expect(snapToGrid({ x: 24, y: 24 }, 16)).toEqual({ x: 32, y: 32 });
		});

		it("グリッドサイズ8でスナップ", () => {
			expect(snapToGrid({ x: 10, y: 10 }, 8)).toEqual({ x: 8, y: 8 });
			expect(snapToGrid({ x: 12, y: 12 }, 8)).toEqual({ x: 16, y: 16 });
		});

		it("既にグリッド上の位置は変化しない", () => {
			expect(snapToGrid({ x: 32, y: 64 }, 16)).toEqual({ x: 32, y: 64 });
		});

		it("負の座標もスナップ", () => {
			expect(snapToGrid({ x: -10, y: -10 }, 16)).toEqual({ x: -16, y: -16 });
		});
	});

	describe("distance", () => {
		it("同じ点の距離は0", () => {
			const p = { x: 100, y: 100 };
			expect(distance(p, p)).toBe(0);
		});

		it("水平距離", () => {
			const p1 = { x: 0, y: 0 };
			const p2 = { x: 100, y: 0 };
			expect(distance(p1, p2)).toBe(100);
		});

		it("垂直距離", () => {
			const p1 = { x: 0, y: 0 };
			const p2 = { x: 0, y: 50 };
			expect(distance(p1, p2)).toBe(50);
		});

		it("斜め距離（3-4-5三角形）", () => {
			const p1 = { x: 0, y: 0 };
			const p2 = { x: 3, y: 4 };
			expect(distance(p1, p2)).toBe(5);
		});

		it("順序に依存しない", () => {
			const p1 = { x: 10, y: 20 };
			const p2 = { x: 50, y: 80 };
			expect(distance(p1, p2)).toBe(distance(p2, p1));
		});
	});
});
