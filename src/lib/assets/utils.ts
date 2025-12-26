/**
 * Utility functions for asset operations
 */

import type { BoardData, BoardObject, Position } from "@/lib/stgy";
import type { AssetBounds, StoredAsset } from "./schema";

/**
 * Calculate bounding box for a set of objects
 * Uses object positions as reference points
 */
export function calculateAssetBounds(objects: BoardObject[]): AssetBounds {
	if (objects.length === 0) {
		return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
	}

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const obj of objects) {
		const { x, y } = obj.position;
		// Use size to estimate object bounds (size is percentage, 100 = normal)
		const sizeMultiplier = obj.size / 100;
		// Estimate radius based on typical object size (32px base)
		const estimatedRadius = 32 * sizeMultiplier;

		minX = Math.min(minX, x - estimatedRadius);
		minY = Math.min(minY, y - estimatedRadius);
		maxX = Math.max(maxX, x + estimatedRadius);
		maxY = Math.max(maxY, y + estimatedRadius);
	}

	return { minX, minY, maxX, maxY };
}

/**
 * Get the center point of asset bounds
 */
export function getBoundsCenter(bounds: AssetBounds): Position {
	return {
		x: (bounds.minX + bounds.maxX) / 2,
		y: (bounds.minY + bounds.maxY) / 2,
	};
}

/**
 * Offset objects to a target position (center of bounds -> target)
 * Returns new deep-cloned objects with updated positions
 */
export function offsetObjectsToPosition(
	objects: BoardObject[],
	bounds: AssetBounds,
	targetPosition: Position,
): BoardObject[] {
	const center = getBoundsCenter(bounds);
	const offsetX = targetPosition.x - center.x;
	const offsetY = targetPosition.y - center.y;

	return objects.map((obj) => ({
		...structuredClone(obj),
		position: {
			x: obj.position.x + offsetX,
			y: obj.position.y + offsetY,
		},
	}));
}

/**
 * Calculate viewport dimensions for preview SVG
 */
export function calculatePreviewViewBox(
	bounds: AssetBounds,
	padding = 10,
): { x: number; y: number; width: number; height: number } {
	const width = bounds.maxX - bounds.minX + padding * 2;
	const height = bounds.maxY - bounds.minY + padding * 2;

	return {
		x: bounds.minX - padding,
		y: bounds.minY - padding,
		width: Math.max(width, 1),
		height: Math.max(height, 1),
	};
}

/**
 * Convert StoredAsset to BoardData for stgy encoding
 * Uses dummy board metadata for compatibility
 */
export function assetToBoardData(asset: StoredAsset): BoardData {
	return {
		version: 2,
		width: 512,
		height: 384,
		name: asset.name,
		backgroundId: 0,
		objects: asset.objects,
	};
}

/**
 * Extract asset data from BoardData (for stgy import)
 * Can be used to import any stgy as an asset
 */
export function boardDataToAssetData(boardData: BoardData): {
	objects: BoardObject[];
	bounds: AssetBounds;
} {
	return {
		objects: boardData.objects,
		bounds: calculateAssetBounds(boardData.objects),
	};
}
