/**
 * Group index-to-ID conversion utilities (infrastructure layer only)
 */

import type { ObjectGroup } from "@/lib/editor/types";
import type { BoardObject } from "@/lib/stgy/types";

export interface StoredObjectGroup {
	id: string;
	objectIndices: number[];
	name?: string;
	collapsed?: boolean;
}

/**
 * Convert index-based groups to ID-based groups
 */
export function convertGroupsToIdBased(
	storedGroups: StoredObjectGroup[],
	objects: BoardObject[],
): ObjectGroup[] {
	return storedGroups.map((group) => ({
		id: group.id,
		name: group.name,
		objectIds: group.objectIndices
			.filter((idx) => idx >= 0 && idx < objects.length)
			.map((idx) => objects[idx].id),
		collapsed: group.collapsed,
	}));
}

/**
 * Convert ID-based groups to index-based groups
 */
export function convertGroupsToIndexBased(
	groups: ObjectGroup[],
	objects: BoardObject[],
): StoredObjectGroup[] {
	const idToIndex = new Map(objects.map((obj, idx) => [obj.id, idx]));

	return groups.map((group) => ({
		id: group.id,
		name: group.name,
		objectIndices: group.objectIds
			.map((id) => idToIndex.get(id))
			.filter((idx): idx is number => idx !== undefined),
		collapsed: group.collapsed,
	}));
}
