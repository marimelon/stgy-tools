/**
 * SVG transform building utilities
 * Used on both server-side and client-side
 */

/**
 * Build SVG transform attribute
 */
export function buildTransform(
	x: number,
	y: number,
	rotation: number,
	scale: number,
	flipH: boolean,
	flipV: boolean,
): string {
	const parts = [`translate(${x}, ${y})`];
	if (rotation !== 0) {
		parts.push(`rotate(${rotation})`);
	}
	const scaleX = flipH ? -scale : scale;
	const scaleY = flipV ? -scale : scale;
	if (scaleX !== 1 || scaleY !== 1) {
		parts.push(`scale(${scaleX}, ${scaleY})`);
	}
	return parts.join(" ");
}

/**
 * Build transform string from position, rotation, scale, and flip (simple version)
 * Returns full transform including rotation and scale even when scale is 1
 */
export function buildFullTransform(
	x: number,
	y: number,
	rotation: number,
	scale: number,
	flipH: boolean,
	flipV: boolean,
): string {
	const scaleX = flipH ? -scale : scale;
	const scaleY = flipV ? -scale : scale;
	return `translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`;
}
