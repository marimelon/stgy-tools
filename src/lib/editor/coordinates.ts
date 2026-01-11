/**
 * SVG coordinate transformation utilities
 */

import type { Position } from "@/lib/stgy";

/**
 * Convert screen coordinates to SVG coordinates
 * @param e Pointer event
 * @param svgElement SVG element
 * @returns Position in SVG coordinate system
 */
export function screenToSVG(
	e: { clientX: number; clientY: number },
	svgElement: SVGSVGElement,
): Position {
	const rect = svgElement.getBoundingClientRect();
	const viewBox = svgElement.viewBox.baseVal;

	const displayWidth = rect.width;
	const displayHeight = rect.height;

	// viewBox size (defaults to display size)
	const viewBoxWidth = viewBox.width || displayWidth;
	const viewBoxHeight = viewBox.height || displayHeight;

	const scaleX = viewBoxWidth / displayWidth;
	const scaleY = viewBoxHeight / displayHeight;

	const x = (e.clientX - rect.left) * scaleX + (viewBox.x || 0);
	const y = (e.clientY - rect.top) * scaleY + (viewBox.y || 0);

	return { x, y };
}

/**
 * Calculate angle between two points (in degrees)
 * @param center Center point
 * @param point Target point
 * @returns Angle (-180 to 180)
 */
export function calculateRotation(center: Position, point: Position): number {
	const dx = point.x - center.x;
	const dy = point.y - center.y;
	const radians = Math.atan2(dy, dx);
	// Convert radians to degrees and adjust for SVG coordinate system (up is 0 degrees)
	let degrees = (radians * 180) / Math.PI + 90;
	// Normalize to -180 to 180
	if (degrees > 180) degrees -= 360;
	if (degrees < -180) degrees += 360;
	return Math.round(degrees);
}

/**
 * Clamp position within canvas bounds
 * @param pos Position
 * @param canvas Canvas size
 * @returns Clamped position
 */
export function clampToCanvas(
	pos: Position,
	canvas: { width: number; height: number },
): Position {
	return {
		x: Math.max(0, Math.min(canvas.width, pos.x)),
		y: Math.max(0, Math.min(canvas.height, pos.y)),
	};
}

/**
 * Snap position to grid
 * @param pos Position
 * @param gridSize Grid size
 * @returns Snapped position
 */
export function snapToGrid(pos: Position, gridSize: number): Position {
	return {
		x: Math.round(pos.x / gridSize) * gridSize,
		y: Math.round(pos.y / gridSize) * gridSize,
	};
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Position, p2: Position): number {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	return Math.sqrt(dx * dx + dy * dy);
}
