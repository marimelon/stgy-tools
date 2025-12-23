/**
 * バウンディングボックス計算のテスト
 */

import { describe, it, expect } from "vitest";
import {
	getConeBoundingBox,
	getDonutConeBoundingBox,
	getObjectBoundingBox,
} from "../bounding-box";
import { ObjectIds } from "@/lib/stgy";

describe("bounding-box", () => {
	describe("getConeBoundingBox", () => {
		it("90度扇形", () => {
			const bbox = getConeBoundingBox(90, 100);
			// 12時方向から時計回りに90度 = 3時方向まで
			// 点: (0,0), (0,-100), (100,0)
			expect(bbox.minX).toBeCloseTo(0, 5);
			expect(bbox.minY).toBeCloseTo(-100, 5);
			expect(bbox.width).toBeCloseTo(100, 5);
			expect(bbox.height).toBeCloseTo(100, 5);
		});

		it("180度扇形", () => {
			const bbox = getConeBoundingBox(180, 100);
			// 12時方向から時計回りに180度 = 6時方向まで
			// 点: (0,0), (0,-100), (0,100), 0度(100,0)が範囲内
			expect(bbox.minX).toBeCloseTo(0, 5);
			expect(bbox.minY).toBeCloseTo(-100, 5);
			expect(bbox.width).toBeCloseTo(100, 5);
			expect(bbox.height).toBeCloseTo(200, 5);
		});

		it("360度扇形（完全な円）", () => {
			const bbox = getConeBoundingBox(360, 100);
			// 全方向をカバー
			expect(bbox.minX).toBeCloseTo(-100, 5);
			expect(bbox.minY).toBeCloseTo(-100, 5);
			expect(bbox.width).toBeCloseTo(200, 5);
			expect(bbox.height).toBeCloseTo(200, 5);
		});

		it("小さい角度", () => {
			const bbox = getConeBoundingBox(30, 100);
			// 12時方向から30度だけ
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});
	});

	describe("getDonutConeBoundingBox", () => {
		it("90度ドーナツ扇形", () => {
			const bbox = getDonutConeBoundingBox(90, 100, 50);
			// 外弧と内弧の点のみ（中心点を含まない）
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
			// 外半径より小さいはず
			expect(bbox.width).toBeLessThanOrEqual(100);
		});

		it("180度ドーナツ扇形", () => {
			const bbox = getDonutConeBoundingBox(180, 100, 50);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("内径0は扇形と同じ挙動", () => {
			const donut = getDonutConeBoundingBox(90, 100, 0);
			const cone = getConeBoundingBox(90, 100);
			// ドーナツの内径0は中心点を含まないが、近い値になる
			expect(donut.width).toBeCloseTo(cone.width, 0);
		});
	});

	describe("getObjectBoundingBox", () => {
		it("ConeAoE", () => {
			const bbox = getObjectBoundingBox(ObjectIds.ConeAoE, 90);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("ConeAoEのデフォルト角度", () => {
			const bbox = getObjectBoundingBox(ObjectIds.ConeAoE);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("DonutAoE 360度（完全な円）", () => {
			const bbox = getObjectBoundingBox(ObjectIds.DonutAoE, 360, 50);
			expect(bbox.width).toBe(512); // outerRadius * 2
			expect(bbox.height).toBe(512);
		});

		it("DonutAoE 扇形", () => {
			const bbox = getObjectBoundingBox(ObjectIds.DonutAoE, 90, 50);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("Text", () => {
			const bbox = getObjectBoundingBox(
				ObjectIds.Text,
				undefined,
				undefined,
				undefined,
				"Hello",
			);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("Textのデフォルト", () => {
			const bbox = getObjectBoundingBox(ObjectIds.Text);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("Line", () => {
			const position = { x: 100, y: 100 };
			const bbox = getObjectBoundingBox(
				ObjectIds.Line,
				2000, // endX * 10
				1500, // endY * 10
				6, // thickness
				undefined,
				position,
			);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("LineAoE", () => {
			const bbox = getObjectBoundingBox(ObjectIds.LineAoE, 200, 30);
			expect(bbox.width).toBe(200); // length
			expect(bbox.height).toBe(30); // thickness
		});

		it("LineAoEのデフォルト", () => {
			const bbox = getObjectBoundingBox(ObjectIds.LineAoE);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("CircleAoE", () => {
			const bbox = getObjectBoundingBox(ObjectIds.CircleAoE);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("Tank icon", () => {
			const bbox = getObjectBoundingBox(ObjectIds.Tank);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("未知のオブジェクトはデフォルト値", () => {
			const bbox = getObjectBoundingBox(99999);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});
	});
});
