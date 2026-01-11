/**
 * SVG path generation utilities
 * Used on both server-side and client-side
 *
 * Shared cone and donut SVG path generation
 */

import { getConeBoundingBox, getDonutConeBoundingBox } from "./geometry";

/**
 * Cone path calculation result
 */
export interface ConePathResult {
	/** SVG path string */
	path: string;
	/** X offset (for bounding box centering) */
	offsetX: number;
	/** Y offset (for bounding box centering) */
	offsetY: number;
}

/**
 * Generate SVG path for a cone shape
 * Origin is at 12 o'clock (top), expanding clockwise by the specified angle
 *
 * @param angle Arc angle in degrees
 * @param radius Radius
 * @returns Path string and offsets
 */
export function generateConePath(
	angle: number,
	radius: number,
): ConePathResult {
	const bbox = getConeBoundingBox(angle, radius);
	const offsetX = -(bbox.minX + bbox.width / 2);
	const offsetY = -(bbox.minY + bbox.height / 2);

	// SVG coordinate system: 0°=right, 90°=down, -90°=up
	// Start: 12 o'clock (-90°, up)
	const startRad = -Math.PI / 2;
	const endRad = startRad + (angle * Math.PI) / 180;

	const x1 = offsetX + Math.cos(startRad) * radius;
	const y1 = offsetY + Math.sin(startRad) * radius;
	const x2 = offsetX + Math.cos(endRad) * radius;
	const y2 = offsetY + Math.sin(endRad) * radius;

	const largeArc = angle > 180 ? 1 : 0;

	// Draw clockwise (sweep=1)
	const path = `M ${offsetX} ${offsetY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

	return { path, offsetX, offsetY };
}

/**
 * Generate SVG path for a donut shape (ring or cone donut)
 *
 * @param angle Arc angle in degrees (360+ for full circle)
 * @param outerRadius Outer radius
 * @param innerRadius Inner radius (0 for cone without hole)
 * @returns Path string and offsets
 */
export function generateDonutPath(
	angle: number,
	outerRadius: number,
	innerRadius: number,
): ConePathResult {
	if (angle >= 360) {
		return generateFullDonutPath(outerRadius, innerRadius);
	}

	return generateDonutConePath(angle, outerRadius, innerRadius);
}

/**
 * Generate full circle donut path (for click detection)
 * Outer arc clockwise, inner arc counter-clockwise
 */
function generateFullDonutPath(
	outerRadius: number,
	innerRadius: number,
): ConePathResult {
	const path = [
		`M ${outerRadius} 0`,
		`A ${outerRadius} ${outerRadius} 0 1 1 ${-outerRadius} 0`,
		`A ${outerRadius} ${outerRadius} 0 1 1 ${outerRadius} 0`,
		`M ${innerRadius} 0`,
		`A ${innerRadius} ${innerRadius} 0 1 0 ${-innerRadius} 0`,
		`A ${innerRadius} ${innerRadius} 0 1 0 ${innerRadius} 0`,
		"Z",
	].join(" ");

	return { path, offsetX: 0, offsetY: 0 };
}

/**
 * Generate cone donut path
 * If inner radius is 0, generates a regular cone
 */
function generateDonutConePath(
	angle: number,
	outerRadius: number,
	innerRadius: number,
): ConePathResult {
	const bbox =
		innerRadius <= 0
			? getConeBoundingBox(angle, outerRadius)
			: getDonutConeBoundingBox(angle, outerRadius, innerRadius);
	const offsetX = -(bbox.minX + bbox.width / 2);
	const offsetY = -(bbox.minY + bbox.height / 2);

	// Start: 12 o'clock (-90°), clockwise by angle
	const startRad = -Math.PI / 2;
	const endRad = startRad + (angle * Math.PI) / 180;

	const outerX1 = offsetX + Math.cos(startRad) * outerRadius;
	const outerY1 = offsetY + Math.sin(startRad) * outerRadius;
	const outerX2 = offsetX + Math.cos(endRad) * outerRadius;
	const outerY2 = offsetY + Math.sin(endRad) * outerRadius;

	const largeArc = angle > 180 ? 1 : 0;

	if (innerRadius <= 0) {
		const path = [
			`M ${offsetX} ${offsetY}`,
			`L ${outerX1} ${outerY1}`,
			`A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerX2} ${outerY2}`,
			"Z",
		].join(" ");

		return { path, offsetX, offsetY };
	}

	const innerX1 = offsetX + Math.cos(startRad) * innerRadius;
	const innerY1 = offsetY + Math.sin(startRad) * innerRadius;
	const innerX2 = offsetX + Math.cos(endRad) * innerRadius;
	const innerY2 = offsetY + Math.sin(endRad) * innerRadius;

	const path = [
		`M ${outerX1} ${outerY1}`,
		`A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerX2} ${outerY2}`,
		`L ${innerX2} ${innerY2}`,
		`A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1}`,
		"Z",
	].join(" ");

	return { path, offsetX, offsetY };
}

/**
 * Generate path data for circular masks (for mask/clipPath elements)
 */
export function generateDonutMaskPath(
	angle: number,
	outerRadius: number,
	innerRadius: number,
): ConePathResult {
	return generateDonutPath(angle, outerRadius, innerRadius);
}

/**
 * Arc coordinates for image clipping
 */
export interface ArcCoordinates {
	/** Start point X */
	x1: number;
	/** Start point Y */
	y1: number;
	/** End point X */
	x2: number;
	/** End point Y */
	y2: number;
	/** Large arc flag (0 or 1) */
	largeArc: number;
	/** X offset */
	offsetX: number;
	/** Y offset */
	offsetY: number;
}

/**
 * Calculate arc coordinates for cone clipping
 */
export function calculateConeArcCoordinates(
	angle: number,
	radius: number,
): ArcCoordinates {
	const bbox = getConeBoundingBox(angle, radius);
	const offsetX = -(bbox.minX + bbox.width / 2);
	const offsetY = -(bbox.minY + bbox.height / 2);

	const startRad = -Math.PI / 2;
	const endRad = startRad + (angle * Math.PI) / 180;

	return {
		x1: offsetX + Math.cos(startRad) * radius,
		y1: offsetY + Math.sin(startRad) * radius,
		x2: offsetX + Math.cos(endRad) * radius,
		y2: offsetY + Math.sin(endRad) * radius,
		largeArc: angle > 180 ? 1 : 0,
		offsetX,
		offsetY,
	};
}
