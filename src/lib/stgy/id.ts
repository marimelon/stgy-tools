/**
 * Object ID generation utilities
 * Used only at runtime, discarded on save
 *
 * ID generation strategy:
 * - New creation: use nanoid() (non-deterministic, 21 chars)
 * - Loading from stgy code: simple sequential (obj-0, obj-1, ...)
 *   (same stgyCode -> same ID, easier debugging, useful for yjs integration)
 */

import { nanoid } from "nanoid";
import type { BoardData, BoardObject, ParsedBoardData } from "./types";

/**
 * Generate runtime ID (for new creation, non-deterministic)
 */
export function generateObjectId(): string {
	return nanoid();
}

/**
 * Generate deterministic ID (for loading from stgy code)
 * Simple sequential format (obj-0, obj-1, ...)
 */
export function generateDeterministicObjectId(index: number): string {
	return `obj-${index}`;
}

/**
 * Assign ID to object without ID (non-deterministic)
 */
export function assignObjectId<T extends Omit<BoardObject, "id">>(
	obj: T,
): T & { id: string } {
	return {
		...obj,
		id: generateObjectId(),
	};
}

/**
 * Assign IDs to object array (non-deterministic)
 */
export function assignObjectIds<T extends Omit<BoardObject, "id">>(
	objects: T[],
): (T & { id: string })[] {
	return objects.map(assignObjectId);
}

/**
 * Assign deterministic IDs to object array
 */
export function assignDeterministicObjectIds<T extends Omit<BoardObject, "id">>(
	objects: T[],
): (T & { id: string })[] {
	return objects.map((obj, index) => ({
		...obj,
		id: generateDeterministicObjectId(index),
	}));
}

/**
 * Convert ParsedBoardData to BoardData (assign IDs, non-deterministic)
 */
export function assignBoardObjectIds(parsed: ParsedBoardData): BoardData {
	return {
		...parsed,
		objects: assignObjectIds(parsed.objects),
	};
}

/**
 * Convert ParsedBoardData to BoardData (assign deterministic IDs)
 */
export function assignBoardObjectIdsDeterministic(
	parsed: ParsedBoardData,
): BoardData {
	return {
		...parsed,
		objects: assignDeterministicObjectIds(parsed.objects),
	};
}
