/**
 * Object placement limit validation
 */

import { getDebugMode } from "@/lib/settings";
import {
	type BoardData,
	type BoardObject,
	MAX_TOTAL_OBJECTS,
	OBJECT_LIMITS,
	ObjectNames,
} from "@/lib/stgy";

export interface ValidationResult {
	canAdd: boolean;
	errorKey?: string;
	errorParams?: Record<string, string | number>;
}

/**
 * Check if a single object can be added
 */
export function canAddObject(
	board: BoardData,
	objectId: number,
): ValidationResult {
	if (getDebugMode()) {
		return { canAdd: true };
	}

	if (board.objects.length >= MAX_TOTAL_OBJECTS) {
		return {
			canAdd: false,
			errorKey: "editor.errors.maxTotalObjects",
			errorParams: { max: MAX_TOTAL_OBJECTS },
		};
	}

	const limit = OBJECT_LIMITS[objectId];
	if (limit !== undefined) {
		const count = board.objects.filter((o) => o.objectId === objectId).length;
		if (count >= limit) {
			return {
				canAdd: false,
				errorKey: "editor.errors.maxObjectType",
				errorParams: {
					name: ObjectNames[objectId] ?? `ID:${objectId}`,
					max: limit,
				},
			};
		}
	}

	return { canAdd: true };
}

/**
 * Check if multiple objects can be added
 */
export function canAddObjects(
	board: BoardData,
	objects: BoardObject[],
): ValidationResult {
	if (objects.length === 0) {
		return { canAdd: true };
	}

	if (getDebugMode()) {
		return { canAdd: true };
	}

	const newTotal = board.objects.length + objects.length;
	if (newTotal > MAX_TOTAL_OBJECTS) {
		return {
			canAdd: false,
			errorKey: "editor.errors.maxTotalObjectsExceeded",
			errorParams: {
				max: MAX_TOTAL_OBJECTS,
				current: board.objects.length,
				adding: objects.length,
			},
		};
	}

	// Count by object type
	const currentCountMap = new Map<number, number>();
	for (const obj of board.objects) {
		currentCountMap.set(
			obj.objectId,
			(currentCountMap.get(obj.objectId) ?? 0) + 1,
		);
	}

	const addingCountMap = new Map<number, number>();
	for (const obj of objects) {
		addingCountMap.set(
			obj.objectId,
			(addingCountMap.get(obj.objectId) ?? 0) + 1,
		);
	}

	// Check per-type limits
	for (const [objectId, addingCount] of addingCountMap) {
		const limit = OBJECT_LIMITS[objectId];
		if (limit !== undefined) {
			const currentCount = currentCountMap.get(objectId) ?? 0;
			if (currentCount + addingCount > limit) {
				return {
					canAdd: false,
					errorKey: "editor.errors.maxObjectType",
					errorParams: {
						name: ObjectNames[objectId] ?? `ID:${objectId}`,
						max: limit,
					},
				};
			}
		}
	}

	return { canAdd: true };
}
