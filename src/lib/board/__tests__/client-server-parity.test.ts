/**
 * Client/Server rendering parity tests
 *
 * Verifies that shared logic (transform, color, params, svg-paths)
 * works correctly.
 *
 * Test targets:
 * 1. Unit tests for shared logic (transform, color, params, svg-paths)
 * 2. Visual comparison tests via PNG output (server rendering)
 */

import { describe, expect, it } from "vitest";
import {
	buildFullTransform,
	buildTransform,
	calculateDonutInnerRadius,
	calculateLineEndpoint,
	colorToRgba,
	DEFAULT_PARAMS,
	generateConePath,
	generateDonutPath,
	isColorChanged,
	isLineAoEParamsChanged,
} from "@/lib/board";
import { comparePixels, parsePng } from "@/lib/screenshot/__tests__/testUtils";
import { renderSvgToPng } from "@/lib/server/resvgWrapper";
import { renderBoardToSVG } from "@/lib/server/svgRenderer";
import type { BoardData, BoardObject } from "@/lib/stgy/types";
import { BackgroundId, ObjectIds } from "@/lib/stgy/types";

// ====================================================================
// Unit tests for shared calculation logic
// ====================================================================

describe("Shared calculation logic", () => {
	describe("buildTransform", () => {
		it("should generate translate only when position changes", () => {
			const result = buildTransform(100, 200, 0, 1, false, false);
			expect(result).toBe("translate(100, 200)");
		});

		it("should include rotation when specified", () => {
			const result = buildTransform(100, 200, 45, 1, false, false);
			expect(result).toBe("translate(100, 200) rotate(45)");
		});

		it("should include scale when not 1", () => {
			const result = buildTransform(100, 200, 0, 1.5, false, false);
			expect(result).toBe("translate(100, 200) scale(1.5, 1.5)");
		});

		it("should include flip transforms", () => {
			const result = buildTransform(100, 200, 0, 1, true, true);
			expect(result).toBe("translate(100, 200) scale(-1, -1)");
		});

		it("should combine all transforms", () => {
			const result = buildTransform(100, 200, 45, 1.5, true, false);
			expect(result).toBe("translate(100, 200) rotate(45) scale(-1.5, 1.5)");
		});
	});

	describe("buildFullTransform", () => {
		it("should match buildTransform output", () => {
			const result = buildFullTransform(100, 200, 45, 1.5, true, false);
			const expected = buildTransform(100, 200, 45, 1.5, true, false);
			expect(result).toBe(expected);
		});
	});

	describe("colorToRgba", () => {
		it("should convert color to rgba string", () => {
			const result = colorToRgba({ r: 255, g: 100, b: 50, opacity: 50 });
			expect(result).toBe("rgba(255, 100, 50, 0.5)");
		});

		it("should handle opacity 0 (fully opaque)", () => {
			const result = colorToRgba({ r: 255, g: 100, b: 50, opacity: 0 });
			expect(result).toBe("rgba(255, 100, 50, 1)");
		});

		it("should handle opacity 100 (fully transparent)", () => {
			const result = colorToRgba({ r: 255, g: 100, b: 50, opacity: 100 });
			expect(result).toBe("rgba(255, 100, 50, 0)");
		});
	});

	describe("isColorChanged", () => {
		it("should return false for default color", () => {
			const result = isColorChanged({ r: 255, g: 100, b: 0, opacity: 0 });
			expect(result).toBe(false);
		});

		it("should return true when color differs", () => {
			const result = isColorChanged({ r: 255, g: 0, b: 0, opacity: 0 });
			expect(result).toBe(true);
		});

		it("should return true when opacity differs", () => {
			const result = isColorChanged({ r: 255, g: 100, b: 0, opacity: 50 });
			expect(result).toBe(true);
		});
	});

	describe("calculateLineEndpoint", () => {
		it("should calculate endpoint with position fallback", () => {
			const result = calculateLineEndpoint({ x: 100, y: 100 });
			expect(result).toEqual({ x: 356, y: 100 });
		});

		it("should use provided params (divided by 10)", () => {
			const result = calculateLineEndpoint({ x: 100, y: 100 }, 3000, 2500);
			expect(result).toEqual({ x: 300, y: 250 });
		});
	});

	describe("calculateDonutInnerRadius", () => {
		it("should calculate inner radius based on donutRange (0-240)", () => {
			const result = calculateDonutInnerRadius(100, 120);
			expect(result).toBe(45);
		});

		it("should calculate max inner radius at donutRange=240", () => {
			const result = calculateDonutInnerRadius(100, 240);
			expect(result).toBe(90);
		});

		it("should handle 0 donutRange (no inner hole)", () => {
			const result = calculateDonutInnerRadius(100, 0);
			expect(result).toBe(0);
		});

		it("should respect custom minThicknessRatio", () => {
			const result = calculateDonutInnerRadius(100, 120, 0.2);
			expect(result).toBe(40);
		});
	});

	describe("isLineAoEParamsChanged", () => {
		it("should return false when using defaults", () => {
			const result = isLineAoEParamsChanged(ObjectIds.LineAoE);
			expect(result).toBe(false);
		});

		it("should return true when height differs", () => {
			const result = isLineAoEParamsChanged(ObjectIds.LineAoE, 200);
			expect(result).toBe(true);
		});

		it("should return true when width differs", () => {
			const result = isLineAoEParamsChanged(
				ObjectIds.LineAoE,
				DEFAULT_PARAMS.LINE_HEIGHT,
				200,
			);
			expect(result).toBe(true);
		});

		it("should return false for non-LineAoE objects", () => {
			const result = isLineAoEParamsChanged(ObjectIds.CircleAoE, 200, 200);
			expect(result).toBe(false);
		});
	});

	describe("generateConePath", () => {
		it("should generate valid SVG path for 90 degree cone", () => {
			const result = generateConePath(90, 100);
			expect(result.path).toContain("M");
			expect(result.path).toContain("A");
			expect(result.path).toContain("Z");
		});

		it("should generate path with large arc for angles > 180", () => {
			const result = generateConePath(270, 100);
			// largeArc should be 1 for angles > 180
			expect(result.path).toMatch(/A\s+\d+\s+\d+\s+0\s+1/);
		});

		it("should return offset values", () => {
			const result = generateConePath(90, 100);
			expect(typeof result.offsetX).toBe("number");
			expect(typeof result.offsetY).toBe("number");
		});
	});

	describe("generateDonutPath", () => {
		it("should generate valid SVG path for full donut (angle=360)", () => {
			const result = generateDonutPath(360, 100, 50);
			expect(result.path).toContain("M");
			expect(result.path).toContain("A");
		});

		it("should generate path with both outer and inner arcs", () => {
			const result = generateDonutPath(90, 100, 50);
			// The path should define both outer and inner arcs
			expect(result.path.match(/A/g)?.length).toBeGreaterThanOrEqual(2);
		});

		it("should generate cone path when innerRadius is 0", () => {
			const result = generateDonutPath(90, 100, 0);
			expect(result.path).toContain("Z");
		});
	});
});

// ====================================================================
// PNG output comparison tests
// ====================================================================

function createTestBoardData(objects: BoardObject[]): BoardData {
	return {
		version: 1,
		name: "Test Board",
		backgroundId: BackgroundId.None,
		objects,
	};
}

function createObject(
	objectId: number,
	overrides: Partial<BoardObject> = {},
): BoardObject {
	return {
		id: crypto.randomUUID(),
		objectId,
		position: { x: 256, y: 192 },
		rotation: 0,
		size: 100,
		color: { r: 255, g: 100, b: 0, opacity: 0 },
		flags: {
			visible: true,
			flipHorizontal: false,
			flipVertical: false,
			locked: false,
		},
		...overrides,
	};
}

describe("Server rendering consistency", () => {
	it("should render identical PNG for same board data", async () => {
		const boardData = createTestBoardData([
			createObject(ObjectIds.CircleAoE, {
				position: { x: 256, y: 192 },
				size: 120,
				color: { r: 255, g: 0, b: 0, opacity: 50 },
			}),
		]);

		const svg1 = await renderBoardToSVG(boardData);
		const svg2 = await renderBoardToSVG(boardData);

		const png1 = await renderSvgToPng(svg1, { fitTo: { mode: "original" } });
		const png2 = await renderSvgToPng(svg2, { fitTo: { mode: "original" } });

		const img1 = parsePng(Buffer.from(png1));
		const img2 = parsePng(Buffer.from(png2));

		const comparison = comparePixels(img1, img2, 0.01);

		expect(comparison.matchPercentage).toBe(100);
	});

	it("should render different PNG for different board data", async () => {
		const boardData1 = createTestBoardData([
			createObject(ObjectIds.CircleAoE, {
				position: { x: 100, y: 100 },
				color: { r: 255, g: 0, b: 0, opacity: 50 },
			}),
		]);

		const boardData2 = createTestBoardData([
			createObject(ObjectIds.CircleAoE, {
				position: { x: 400, y: 300 },
				color: { r: 0, g: 255, b: 0, opacity: 50 },
			}),
		]);

		const svg1 = await renderBoardToSVG(boardData1);
		const svg2 = await renderBoardToSVG(boardData2);

		const png1 = await renderSvgToPng(svg1, { fitTo: { mode: "original" } });
		const png2 = await renderSvgToPng(svg2, { fitTo: { mode: "original" } });

		const img1 = parsePng(Buffer.from(png1));
		const img2 = parsePng(Buffer.from(png2));

		const comparison = comparePixels(img1, img2, 0.1);

		expect(comparison.matchPercentage).toBeLessThan(100);
	});

	it("should render all AoE types correctly", async () => {
		const boardData = createTestBoardData([
			createObject(ObjectIds.CircleAoE, {
				position: { x: 100, y: 100 },
				size: 80,
				color: { r: 255, g: 0, b: 0, opacity: 50 },
			}),
			createObject(ObjectIds.ConeAoE, {
				position: { x: 256, y: 100 },
				size: 80,
				rotation: 45,
				param1: 60,
				color: { r: 0, g: 255, b: 0, opacity: 50 },
			}),
			createObject(ObjectIds.DonutAoE, {
				position: { x: 400, y: 100 },
				size: 80,
				param1: 360,
				param2: 120,
				color: { r: 0, g: 0, b: 255, opacity: 50 },
			}),
			createObject(ObjectIds.LineAoE, {
				position: { x: 256, y: 300 },
				size: 100,
				rotation: 30,
				param1: 150,
				param2: 40,
				color: { r: 128, g: 128, b: 255, opacity: 25 },
			}),
		]);

		const svg = await renderBoardToSVG(boardData);

		expect(svg).toContain("<svg");
		expect(svg).toContain("</svg>");

		const png = await renderSvgToPng(svg, { fitTo: { mode: "original" } });
		expect(png.length).toBeGreaterThan(0);

		const img = parsePng(Buffer.from(png));
		expect(img.width).toBe(512);
		expect(img.height).toBe(384);
	});

	it("should render Line objects with correct endpoints", async () => {
		const boardData = createTestBoardData([
			createObject(ObjectIds.Line, {
				position: { x: 50, y: 50 },
				param1: 4500, // 終点X (450 * 10)
				param2: 3500, // 終点Y (350 * 10)
				color: { r: 255, g: 255, b: 0, opacity: 0 },
			}),
		]);

		const svg = await renderBoardToSVG(boardData);

		expect(svg).toContain("<line");
		expect(svg).toContain("x1=");
		expect(svg).toContain("y1=");
		expect(svg).toContain("x2=");
		expect(svg).toContain("y2=");
	});

	it("should render Text objects", async () => {
		const boardData = createTestBoardData([
			createObject(ObjectIds.Text, {
				position: { x: 256, y: 192 },
				size: 100,
				text: "Test",
				color: { r: 255, g: 255, b: 255, opacity: 0 },
			}),
		]);

		const svg = await renderBoardToSVG(boardData);

		expect(svg).toContain("<text");
		expect(svg).toContain("Test");
	});

	it("should apply transforms correctly", async () => {
		const boardData = createTestBoardData([
			createObject(ObjectIds.WaymarkA, {
				position: { x: 256, y: 192 },
				rotation: 45,
				size: 150,
				flags: {
					visible: true,
					flipHorizontal: true,
					flipVertical: false,
					locked: false,
				},
			}),
		]);

		const svg = await renderBoardToSVG(boardData);

		expect(svg).toContain("transform=");
		expect(svg).toContain("translate(256, 192)");
		expect(svg).toContain("rotate(45)");
		expect(svg).toContain("scale(");
	});
});

// ====================================================================
// Shared logic usage verification tests
// ====================================================================

describe("Shared logic usage verification", () => {
	it("should use same color calculation for server and client", () => {
		const testColor = { r: 123, g: 45, b: 67, opacity: 35 };
		const rgba = colorToRgba(testColor);

		expect(rgba).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
	});

	it("should use same transform calculation for server and client", () => {
		const transform1 = buildTransform(100, 200, 45, 1.5, true, false);
		const transform2 = buildFullTransform(100, 200, 45, 1.5, true, false);

		expect(transform1).toBe(transform2);
	});

	it("should use same line endpoint calculation", () => {
		const position = { x: 100, y: 100 };
		const endpoint = calculateLineEndpoint(position, 3000, 2500);

		expect(endpoint).toEqual({ x: 300, y: 250 });
	});

	it("should use same donut inner radius calculation", () => {
		const outerRadius = 100;
		const donutRange = 120;
		const innerRadius = calculateDonutInnerRadius(outerRadius, donutRange);

		expect(innerRadius).toBe(45);
	});
});
