/**
 * Batch editing utility functions
 *
 * Common value calculation and Mixed value detection for multi-object selection
 */

import type { BoardObject } from "@/lib/stgy";

/**
 * Symbol representing mixed values
 * Used when values differ across multiple objects
 */
export const MIXED_VALUE = Symbol("mixed");
export type MixedValue = typeof MIXED_VALUE;

/**
 * Check if a value is mixed
 */
export function isMixed<T>(value: T | MixedValue): value is MixedValue {
	return value === MIXED_VALUE;
}

/**
 * Batch property values
 * Each property is either a common value or Mixed
 */
export interface BatchPropertyValues {
	rotation: number | MixedValue;
	size: number | MixedValue;
	color: {
		r: number | MixedValue;
		g: number | MixedValue;
		b: number | MixedValue;
		opacity: number | MixedValue;
	};
	flags: {
		visible: boolean | MixedValue;
		flipHorizontal: boolean | MixedValue;
		flipVertical: boolean | MixedValue;
		locked: boolean | MixedValue;
	};
	param1: number | undefined | MixedValue;
	param2: number | undefined | MixedValue;
	param3: number | undefined | MixedValue;
}

/**
 * Compute common value from object array
 * Returns the value if all objects have the same value, otherwise returns MIXED_VALUE
 */
function computeCommonValue<T>(
	objects: BoardObject[],
	getter: (obj: BoardObject) => T,
): T | MixedValue {
	if (objects.length === 0) return MIXED_VALUE;
	const first = getter(objects[0]);
	for (let i = 1; i < objects.length; i++) {
		if (getter(objects[i]) !== first) {
			return MIXED_VALUE;
		}
	}
	return first;
}

/**
 * Compute batch property values from selected objects
 */
export function computeBatchPropertyValues(
	objects: BoardObject[],
): BatchPropertyValues {
	return {
		rotation: computeCommonValue(objects, (o) => o.rotation),
		size: computeCommonValue(objects, (o) => o.size),
		color: {
			r: computeCommonValue(objects, (o) => o.color.r),
			g: computeCommonValue(objects, (o) => o.color.g),
			b: computeCommonValue(objects, (o) => o.color.b),
			opacity: computeCommonValue(objects, (o) => o.color.opacity),
		},
		flags: {
			visible: computeCommonValue(objects, (o) => o.flags.visible),
			flipHorizontal: computeCommonValue(
				objects,
				(o) => o.flags.flipHorizontal,
			),
			flipVertical: computeCommonValue(objects, (o) => o.flags.flipVertical),
			locked: computeCommonValue(objects, (o) => o.flags.locked),
		},
		param1: computeCommonValue(objects, (o) => o.param1),
		param2: computeCommonValue(objects, (o) => o.param2),
		param3: computeCommonValue(objects, (o) => o.param3),
	};
}

/**
 * Check if all objects have the same objectId
 */
export function haveSameObjectId(objects: BoardObject[]): boolean {
	if (objects.length === 0) return false;
	const firstId = objects[0].objectId;
	return objects.every((o) => o.objectId === firstId);
}

/**
 * Get common flip flags (those supported by all objects)
 */
export function getCommonFlipFlags(
	objects: BoardObject[],
	flipFlagsMap: Record<number, { horizontal: boolean; vertical: boolean }>,
	defaultFlags: { horizontal: boolean; vertical: boolean },
): { horizontal: boolean; vertical: boolean } {
	if (objects.length === 0) return { horizontal: false, vertical: false };

	// Return only flags supported by all objects
	let horizontal = true;
	let vertical = true;

	for (const obj of objects) {
		const flags = flipFlagsMap[obj.objectId] ?? defaultFlags;
		if (!flags.horizontal) horizontal = false;
		if (!flags.vertical) vertical = false;
	}

	return { horizontal, vertical };
}
