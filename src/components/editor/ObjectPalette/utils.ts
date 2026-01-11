/**
 * Object palette utility functions
 */

import { DEFAULT_BBOX_SIZE, OBJECT_BBOX_SIZES } from "@/lib/board";

/**
 * Get viewBox size for an object (actual size + padding)
 */
export function getViewBoxSize(objectId: number): number {
	const size = OBJECT_BBOX_SIZES[objectId] ?? DEFAULT_BBOX_SIZE;
	const maxDimension = Math.max(size.width, size.height);
	// Add padding to prevent object clipping
	return Math.ceil(maxDimension * 1.1);
}
