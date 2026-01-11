/**
 * Layer item computation hook
 *
 * Builds layer item list with group awareness and
 * provides visibility helper functions.
 */

import { useCallback, useMemo } from "react";
import type { ObjectGroup } from "@/lib/editor/types";
import type { BoardObject } from "@/lib/stgy";
import type { LayerItem } from "./types";

export interface UseLayerItemsParams {
	objects: BoardObject[];
	getGroupForObject: (objectId: string) => ObjectGroup | undefined;
}

export interface UseLayerItemsReturn {
	layerItems: LayerItem[];
	isGroupAllVisible: (group: ObjectGroup) => boolean;
	isGroupAllHidden: (group: ObjectGroup) => boolean;
	isGroupAllLocked: (group: ObjectGroup) => boolean;
	isGroupAllUnlocked: (group: ObjectGroup) => boolean;
}

export function useLayerItems({
	objects,
	getGroupForObject,
}: UseLayerItemsParams): UseLayerItemsReturn {
	const layerItems = useMemo<LayerItem[]>(() => {
		const items: LayerItem[] = [];
		const processedIds = new Set<string>();

		for (const obj of objects) {
			if (processedIds.has(obj.id)) continue;

			const group = getGroupForObject(obj.id);

			if (group) {
				// Add group header at the first object in array order
				const firstGroupObjectId = group.objectIds.find((id) =>
					objects.some((o) => o.id === id),
				);
				if (obj.id === firstGroupObjectId) {
					items.push({
						type: "group-header",
						group,
						isInGroup: false,
						groupId: group.id,
					});

					if (!group.collapsed) {
						const groupObjectsInOrder = objects.filter((o) =>
							group.objectIds.includes(o.id),
						);
						const lastObject =
							groupObjectsInOrder[groupObjectsInOrder.length - 1];
						for (const groupObj of groupObjectsInOrder) {
							items.push({
								type: "object",
								objectId: groupObj.id,
								isInGroup: true,
								groupId: group.id,
								isLastInGroup: groupObj.id === lastObject?.id,
							});
							processedIds.add(groupObj.id);
						}
					} else {
						for (const id of group.objectIds) {
							processedIds.add(id);
						}
					}
				}
			} else {
				items.push({
					type: "object",
					objectId: obj.id,
					isInGroup: false,
				});
			}
		}

		return items;
	}, [objects, getGroupForObject]);

	const isGroupAllVisible = useCallback(
		(group: ObjectGroup) => {
			return group.objectIds.every((id) => {
				const obj = objects.find((o) => o.id === id);
				return obj?.flags.visible;
			});
		},
		[objects],
	);

	const isGroupAllHidden = useCallback(
		(group: ObjectGroup) => {
			return group.objectIds.every((id) => {
				const obj = objects.find((o) => o.id === id);
				return !obj?.flags.visible;
			});
		},
		[objects],
	);

	const isGroupAllLocked = useCallback(
		(group: ObjectGroup) => {
			return group.objectIds.every((id) => {
				const obj = objects.find((o) => o.id === id);
				return obj?.flags.locked;
			});
		},
		[objects],
	);

	const isGroupAllUnlocked = useCallback(
		(group: ObjectGroup) => {
			return group.objectIds.every((id) => {
				const obj = objects.find((o) => o.id === id);
				return !obj?.flags.locked;
			});
		},
		[objects],
	);

	return {
		layerItems,
		isGroupAllVisible,
		isGroupAllHidden,
		isGroupAllLocked,
		isGroupAllUnlocked,
	};
}
