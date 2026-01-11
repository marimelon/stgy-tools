/**
 * Object hit testing functions
 *
 * Provides accurate hit detection considering bounding box and rotation
 */

import { getObjectBoundingBox } from "@/components/board";
import type { BoardObject, Position } from "@/lib/stgy";

/**
 * Check if point is within object's bounding box.
 * Uses rotation-aware accurate hit testing.
 */
export function isPointInObject(point: Position, object: BoardObject): boolean {
	if (!object.flags.visible) return false;

	const bbox = getObjectBoundingBox(
		object.objectId,
		object.param1,
		object.param2,
		object.param3,
		object.text,
		object.position,
	);
	const scale = object.size / 100;
	const halfWidth = (bbox.width * scale) / 2;
	const halfHeight = (bbox.height * scale) / 2;
	const offsetX = (bbox.offsetX ?? 0) * scale;
	const offsetY = (bbox.offsetY ?? 0) * scale;

	// Convert point to relative coordinates from object center
	const dx = point.x - object.position.x;
	const dy = point.y - object.position.y;

	// Apply inverse rotation to convert to local coordinates
	const rad = (-object.rotation * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const localX = dx * cos - dy * sin;
	const localY = dx * sin + dy * cos;

	// Check if within bounding box considering offset
	const left = offsetX - halfWidth;
	const right = offsetX + halfWidth;
	const top = offsetY - halfHeight;
	const bottom = offsetY + halfHeight;

	return localX >= left && localX <= right && localY >= top && localY <= bottom;
}
