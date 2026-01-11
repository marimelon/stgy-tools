/**
 * Board region auto-detection algorithm
 *
 * FFXIV strategy board characteristics:
 * - Gray background (~#505050, HSL: 0% saturation, 31% lightness)
 * - Fixed aspect ratio (512:384 = 4:3)
 * - Clear rectangular boundary
 */

import { rgbToHsl } from "./imageUtils";
import {
	DEFAULT_DETECTION_OPTIONS,
	type DetectedRegion,
	type DetectionOptions,
	TARGET_ASPECT_RATIO,
} from "./types";

interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Check if a pixel is gray
 */
function isGrayBoardPixel(
	r: number,
	g: number,
	b: number,
	options: Required<DetectionOptions>,
): boolean {
	const hsl = rgbToHsl(r, g, b);
	return (
		hsl.s < options.saturationThreshold &&
		hsl.l >= options.lightnessRange.min &&
		hsl.l <= options.lightnessRange.max
	);
}

/**
 * Detect horizontal runs (consecutive gray pixel segments)
 */
function findHorizontalRuns(
	imageData: ImageData,
	options: Required<DetectionOptions>,
): Array<{ y: number; xStart: number; xEnd: number }> {
	const { width, height, data } = imageData;
	const runs: Array<{ y: number; xStart: number; xEnd: number }> = [];

	for (let y = 0; y < height; y++) {
		let inRun = false;
		let runStart = 0;

		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * 4;
			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];
			const isGray = isGrayBoardPixel(r, g, b, options);

			if (isGray && !inRun) {
				inRun = true;
				runStart = x;
			} else if (!isGray && inRun) {
				inRun = false;
				// Only record runs above minimum width
				if (x - runStart > 50) {
					runs.push({ y, xStart: runStart, xEnd: x - 1 });
				}
			}
		}
		// Handle runs extending to end of row
		if (inRun && width - runStart > 50) {
			runs.push({ y, xStart: runStart, xEnd: width - 1 });
		}
	}

	return runs;
}

/**
 * Calculate bounding box from runs
 */
function findBoundingBoxFromRuns(
	runs: Array<{ y: number; xStart: number; xEnd: number }>,
): Rect | null {
	if (runs.length === 0) return null;

	let minX = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const run of runs) {
		minX = Math.min(minX, run.xStart);
		maxX = Math.max(maxX, run.xEnd);
		minY = Math.min(minY, run.y);
		maxY = Math.max(maxY, run.y);
	}

	return {
		x: minX,
		y: minY,
		width: maxX - minX + 1,
		height: maxY - minY + 1,
	};
}

/**
 * Calculate gray pixel density within a rectangular region
 */
function calculateGrayDensity(
	imageData: ImageData,
	rect: Rect,
	options: Required<DetectionOptions>,
): number {
	const { width, data } = imageData;
	let grayCount = 0;
	let totalCount = 0;

	for (let y = rect.y; y < rect.y + rect.height; y++) {
		for (let x = rect.x; x < rect.x + rect.width; x++) {
			const idx = (y * width + x) * 4;
			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];
			totalCount++;
			if (isGrayBoardPixel(r, g, b, options)) {
				grayCount++;
			}
		}
	}

	return totalCount > 0 ? grayCount / totalCount : 0;
}

/**
 * Refine edges (fine-tune boundaries)
 */
function refineEdges(
	imageData: ImageData,
	rect: Rect,
	options: Required<DetectionOptions>,
): Rect {
	const { width, data } = imageData;

	// Find where gray pixels start on each edge
	let top = rect.y;
	let bottom = rect.y + rect.height - 1;
	let left = rect.x;
	let right = rect.x + rect.width - 1;

	// Adjust top edge
	for (let y = rect.y; y < rect.y + rect.height / 4; y++) {
		let grayCount = 0;
		for (let x = rect.x; x < rect.x + rect.width; x++) {
			const idx = (y * width + x) * 4;
			if (isGrayBoardPixel(data[idx], data[idx + 1], data[idx + 2], options)) {
				grayCount++;
			}
		}
		if (grayCount > rect.width * 0.7) {
			top = y;
			break;
		}
	}

	// Adjust bottom edge
	for (
		let y = rect.y + rect.height - 1;
		y > rect.y + (rect.height * 3) / 4;
		y--
	) {
		let grayCount = 0;
		for (let x = rect.x; x < rect.x + rect.width; x++) {
			const idx = (y * width + x) * 4;
			if (isGrayBoardPixel(data[idx], data[idx + 1], data[idx + 2], options)) {
				grayCount++;
			}
		}
		if (grayCount > rect.width * 0.7) {
			bottom = y;
			break;
		}
	}

	// Adjust left edge
	for (let x = rect.x; x < rect.x + rect.width / 4; x++) {
		let grayCount = 0;
		for (let y = top; y <= bottom; y++) {
			const idx = (y * width + x) * 4;
			if (isGrayBoardPixel(data[idx], data[idx + 1], data[idx + 2], options)) {
				grayCount++;
			}
		}
		if (grayCount > (bottom - top) * 0.7) {
			left = x;
			break;
		}
	}

	// Adjust right edge
	for (
		let x = rect.x + rect.width - 1;
		x > rect.x + (rect.width * 3) / 4;
		x--
	) {
		let grayCount = 0;
		for (let y = top; y <= bottom; y++) {
			const idx = (y * width + x) * 4;
			if (isGrayBoardPixel(data[idx], data[idx + 1], data[idx + 2], options)) {
				grayCount++;
			}
		}
		if (grayCount > (bottom - top) * 0.7) {
			right = x;
			break;
		}
	}

	return {
		x: left,
		y: top,
		width: right - left + 1,
		height: bottom - top + 1,
	};
}

/**
 * Adjust rectangle based on aspect ratio
 */
function adjustToAspectRatio(rect: Rect, targetRatio: number): Rect {
	const currentRatio = rect.width / rect.height;

	if (Math.abs(currentRatio - targetRatio) < 0.05) {
		// Close enough, keep as is
		return rect;
	}

	if (currentRatio > targetRatio) {
		// Width too large - shrink width
		const newWidth = rect.height * targetRatio;
		const xOffset = (rect.width - newWidth) / 2;
		return {
			x: Math.round(rect.x + xOffset),
			y: rect.y,
			width: Math.round(newWidth),
			height: rect.height,
		};
	}
	// Height too large - shrink height
	const newHeight = rect.width / targetRatio;
	const yOffset = (rect.height - newHeight) / 2;
	return {
		x: rect.x,
		y: Math.round(rect.y + yOffset),
		width: rect.width,
		height: Math.round(newHeight),
	};
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
	rect: Rect,
	imageData: ImageData,
	options: Required<DetectionOptions>,
): number {
	// Gray density (0-1)
	const grayDensity = calculateGrayDensity(imageData, rect, options);

	// Aspect ratio match (0-1)
	const actualRatio = rect.width / rect.height;
	const ratioDiff = Math.abs(actualRatio - TARGET_ASPECT_RATIO);
	const ratioConfidence = Math.max(0, 1 - ratioDiff / TARGET_ASPECT_RATIO);

	// Size validity (not too small)
	const area = rect.width * rect.height;
	const sizeConfidence = Math.min(1, area / options.minRegionArea);

	// Weighted average
	return grayDensity * 0.4 + ratioConfidence * 0.4 + sizeConfidence * 0.2;
}

/**
 * Auto-detect board region from image
 */
export function detectBoardRegion(
	imageData: ImageData,
	options?: DetectionOptions,
): DetectedRegion | null {
	const opts = { ...DEFAULT_DETECTION_OPTIONS, ...options };

	// Step 1: Detect gray pixel runs
	const runs = findHorizontalRuns(imageData, opts);
	if (runs.length < 10) {
		return null; // Not enough gray regions
	}

	// Step 2: Calculate bounding box
	const roughBox = findBoundingBoxFromRuns(runs);
	if (!roughBox) {
		return null;
	}

	// Step 3: Validate region size
	const area = roughBox.width * roughBox.height;
	if (area < opts.minRegionArea) {
		return null; // Region too small
	}

	// Step 4: Refine edges
	const refinedBox = refineEdges(imageData, roughBox, opts);

	// Step 5: Validate and adjust aspect ratio
	const aspectRatio = refinedBox.width / refinedBox.height;
	const ratioDiff = Math.abs(aspectRatio - TARGET_ASPECT_RATIO);

	if (ratioDiff > opts.aspectRatioTolerance) {
		// Adjust if aspect ratio differs significantly
		const adjustedBox = adjustToAspectRatio(refinedBox, TARGET_ASPECT_RATIO);

		// Calculate confidence after adjustment
		const confidence = calculateConfidence(adjustedBox, imageData, opts);

		return {
			...adjustedBox,
			confidence,
			method: "color",
		};
	}

	// Step 6: Calculate confidence
	const confidence = calculateConfidence(refinedBox, imageData, opts);

	return {
		...refinedBox,
		confidence,
		method: "color",
	};
}
