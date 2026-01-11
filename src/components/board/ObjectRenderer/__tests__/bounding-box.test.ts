import { describe, expect, it } from "vitest";
import { ObjectIds } from "@/lib/stgy";
import {
	getConeBoundingBox,
	getDonutConeBoundingBox,
	getObjectBoundingBox,
} from "../bounding-box";

describe("bounding-box", () => {
	describe("getConeBoundingBox", () => {
		it("90-degree cone", () => {
			const bbox = getConeBoundingBox(90, 100);
			// From 12 o'clock clockwise 90 degrees = to 3 o'clock
			// Points: (0,0), (0,-100), (100,0)
			expect(bbox.minX).toBeCloseTo(0, 5);
			expect(bbox.minY).toBeCloseTo(-100, 5);
			expect(bbox.width).toBeCloseTo(100, 5);
			expect(bbox.height).toBeCloseTo(100, 5);
		});

		it("180-degree cone", () => {
			const bbox = getConeBoundingBox(180, 100);
			// From 12 o'clock clockwise 180 degrees = to 6 o'clock
			// Points: (0,0), (0,-100), (0,100), 0 degrees (100,0) is in range
			expect(bbox.minX).toBeCloseTo(0, 5);
			expect(bbox.minY).toBeCloseTo(-100, 5);
			expect(bbox.width).toBeCloseTo(100, 5);
			expect(bbox.height).toBeCloseTo(200, 5);
		});

		it("360-degree cone (full circle)", () => {
			const bbox = getConeBoundingBox(360, 100);
			expect(bbox.minX).toBeCloseTo(-100, 5);
			expect(bbox.minY).toBeCloseTo(-100, 5);
			expect(bbox.width).toBeCloseTo(200, 5);
			expect(bbox.height).toBeCloseTo(200, 5);
		});

		it("small angle", () => {
			const bbox = getConeBoundingBox(30, 100);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});
	});

	describe("getDonutConeBoundingBox", () => {
		it("90-degree donut cone", () => {
			const bbox = getDonutConeBoundingBox(90, 100, 50);
			// Only outer and inner arc points (no center point)
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
			expect(bbox.width).toBeLessThanOrEqual(100);
		});

		it("180-degree donut cone", () => {
			const bbox = getDonutConeBoundingBox(180, 100, 50);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("inner radius 0 behaves like regular cone", () => {
			const donut = getDonutConeBoundingBox(90, 100, 0);
			const cone = getConeBoundingBox(90, 100);
			// Donut with inner radius 0 excludes center, but values are close
			expect(donut.width).toBeCloseTo(cone.width, 0);
		});
	});

	describe("getObjectBoundingBox", () => {
		it("ConeAoE", () => {
			const bbox = getObjectBoundingBox(ObjectIds.ConeAoE, 90);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("ConeAoE default angle", () => {
			const bbox = getObjectBoundingBox(ObjectIds.ConeAoE);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("DonutAoE 360 degrees (full circle)", () => {
			const bbox = getObjectBoundingBox(ObjectIds.DonutAoE, 360, 50);
			expect(bbox.width).toBe(512);
			expect(bbox.height).toBe(512);
		});

		it("DonutAoE cone", () => {
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

		it("Text default", () => {
			const bbox = getObjectBoundingBox(ObjectIds.Text);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("Line", () => {
			const position = { x: 100, y: 100 };
			const bbox = getObjectBoundingBox(
				ObjectIds.Line,
				2000,
				1500,
				6,
				undefined,
				position,
			);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});

		it("Line: horizontal line bbox is length x thickness", () => {
			const position = { x: 100, y: 100 };
			const bbox = getObjectBoundingBox(
				ObjectIds.Line,
				2000,
				1000,
				10,
				undefined,
				position,
			);
			expect(bbox.width).toBeCloseTo(100, 5);
			expect(bbox.height).toBe(10);
			expect(bbox.offsetX).toBeCloseTo(50, 5);
			expect(bbox.offsetY).toBe(0);
		});

		it("Line: vertical line bbox is length x thickness", () => {
			const position = { x: 100, y: 100 };
			const bbox = getObjectBoundingBox(
				ObjectIds.Line,
				1000,
				2000,
				10,
				undefined,
				position,
			);
			expect(bbox.width).toBeCloseTo(100, 5);
			expect(bbox.height).toBe(10);
			expect(bbox.offsetX).toBeCloseTo(50, 5);
			expect(bbox.offsetY).toBe(0);
		});

		it("Line: diagonal line bbox is length x thickness", () => {
			const position = { x: 0, y: 0 };
			// Endpoint (30, 40) -> diagonal line length 50 (3-4-5 triangle)
			const bbox = getObjectBoundingBox(
				ObjectIds.Line,
				300,
				400,
				8,
				undefined,
				position,
			);
			expect(bbox.width).toBeCloseTo(50, 5);
			expect(bbox.height).toBe(8);
			expect(bbox.offsetX).toBeCloseTo(25, 5);
			expect(bbox.offsetY).toBe(0);
		});

		it("Line: zero length uses thickness as width", () => {
			const position = { x: 100, y: 100 };
			const bbox = getObjectBoundingBox(
				ObjectIds.Line,
				1000,
				1000,
				20,
				undefined,
				position,
			);
			expect(bbox.width).toBe(20);
			expect(bbox.height).toBe(20);
		});

		it("LineAoE", () => {
			const bbox = getObjectBoundingBox(ObjectIds.LineAoE, 200, 30);
			expect(bbox.width).toBe(200);
			expect(bbox.height).toBe(30);
		});

		it("LineAoE default", () => {
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

		it("unknown object returns default", () => {
			const bbox = getObjectBoundingBox(99999);
			expect(bbox.width).toBeGreaterThan(0);
			expect(bbox.height).toBeGreaterThan(0);
		});
	});
});
