/**
 * Color-related utilities
 * Used on both server-side and client-side
 */

import type { Color } from "@/lib/stgy/types";

/**
 * Default color (uses original image when this color is set)
 */
export const DEFAULT_OBJECT_COLOR: Readonly<Color> = {
	r: 255,
	g: 100,
	b: 0,
	opacity: 0,
};

/**
 * Check if color differs from default
 */
export function isColorChanged(color: Color): boolean {
	return (
		color.r !== DEFAULT_OBJECT_COLOR.r ||
		color.g !== DEFAULT_OBJECT_COLOR.g ||
		color.b !== DEFAULT_OBJECT_COLOR.b ||
		color.opacity !== DEFAULT_OBJECT_COLOR.opacity
	);
}

/**
 * Convert Color type to rgba string
 * opacity: 0=opaque, 100=transparent
 */
export function colorToRgba(color: Color): string {
	const alpha = 1 - color.opacity / 100;
	return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

/**
 * Convert Color type to rgb string (no transparency)
 */
export function colorToRgb(color: Color): string {
	return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
