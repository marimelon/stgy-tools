/**
 * Coordinate utility tests
 */

import { describe, expect, it } from "vitest";
import {
	calculateRotation,
	clampToCanvas,
	distance,
	snapToGrid,
} from "../coordinates";

describe("coordinates", () => {
	describe("calculateRotation", () => {
		it("upward direction is 0 degrees", () => {
			const center = { x: 100, y: 100 };
			const point = { x: 100, y: 50 }; // Directly above
			expect(calculateRotation(center, point)).toBe(0);
		});

		it("rightward direction is 90 degrees", () => {
			const center = { x: 100, y: 100 };
			const point = { x: 150, y: 100 }; // Directly right
			expect(calculateRotation(center, point)).toBe(90);
		});

		it("downward direction is 180 or -180 degrees", () => {
			const center = { x: 100, y: 100 };
			const point = { x: 100, y: 150 }; // Directly below
			const result = calculateRotation(center, point);
			expect(Math.abs(result)).toBe(180);
		});

		it("leftward direction is -90 degrees", () => {
			const center = { x: 100, y: 100 };
			const point = { x: 50, y: 100 }; // Directly left
			expect(calculateRotation(center, point)).toBe(-90);
		});

		it("upper-right 45 degrees direction is 45 degrees", () => {
			const center = { x: 100, y: 100 };
			const point = { x: 150, y: 50 }; // Upper-right 45 degrees
			expect(calculateRotation(center, point)).toBe(45);
		});

		it("same point returns 90 (atan2 specification)", () => {
			const center = { x: 100, y: 100 };
			const result = calculateRotation(center, center);
			expect(result).toBe(90); // atan2(0, 0) = 0, +90 = 90
		});
	});

	describe("clampToCanvas", () => {
		const canvas = { width: 512, height: 384 };

		it("position within canvas is returned as-is", () => {
			const pos = { x: 100, y: 100 };
			expect(clampToCanvas(pos, canvas)).toEqual(pos);
		});

		it("negative coordinates are clamped to 0", () => {
			const pos = { x: -50, y: -30 };
			expect(clampToCanvas(pos, canvas)).toEqual({ x: 0, y: 0 });
		});

		it("coordinates exceeding canvas are clamped to max", () => {
			const pos = { x: 600, y: 500 };
			expect(clampToCanvas(pos, canvas)).toEqual({ x: 512, y: 384 });
		});

		it("only X exceeds canvas", () => {
			const pos = { x: 600, y: 100 };
			expect(clampToCanvas(pos, canvas)).toEqual({ x: 512, y: 100 });
		});

		it("boundary values are preserved", () => {
			expect(clampToCanvas({ x: 0, y: 0 }, canvas)).toEqual({ x: 0, y: 0 });
			expect(clampToCanvas({ x: 512, y: 384 }, canvas)).toEqual({
				x: 512,
				y: 384,
			});
		});
	});

	describe("snapToGrid", () => {
		it("snaps with grid size 16", () => {
			expect(snapToGrid({ x: 10, y: 10 }, 16)).toEqual({ x: 16, y: 16 });
			expect(snapToGrid({ x: 7, y: 7 }, 16)).toEqual({ x: 0, y: 0 });
			expect(snapToGrid({ x: 24, y: 24 }, 16)).toEqual({ x: 32, y: 32 });
		});

		it("snaps with grid size 8", () => {
			expect(snapToGrid({ x: 10, y: 10 }, 8)).toEqual({ x: 8, y: 8 });
			expect(snapToGrid({ x: 12, y: 12 }, 8)).toEqual({ x: 16, y: 16 });
		});

		it("position already on grid remains unchanged", () => {
			expect(snapToGrid({ x: 32, y: 64 }, 16)).toEqual({ x: 32, y: 64 });
		});

		it("negative coordinates also snap", () => {
			expect(snapToGrid({ x: -10, y: -10 }, 16)).toEqual({ x: -16, y: -16 });
		});
	});

	describe("distance", () => {
		it("distance to same point is 0", () => {
			const p = { x: 100, y: 100 };
			expect(distance(p, p)).toBe(0);
		});

		it("horizontal distance", () => {
			const p1 = { x: 0, y: 0 };
			const p2 = { x: 100, y: 0 };
			expect(distance(p1, p2)).toBe(100);
		});

		it("vertical distance", () => {
			const p1 = { x: 0, y: 0 };
			const p2 = { x: 0, y: 50 };
			expect(distance(p1, p2)).toBe(50);
		});

		it("diagonal distance (3-4-5 triangle)", () => {
			const p1 = { x: 0, y: 0 };
			const p2 = { x: 3, y: 4 };
			expect(distance(p1, p2)).toBe(5);
		});

		it("order independent", () => {
			const p1 = { x: 10, y: 20 };
			const p2 = { x: 50, y: 80 };
			expect(distance(p1, p2)).toBe(distance(p2, p1));
		});
	});
});
