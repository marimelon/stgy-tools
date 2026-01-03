/**
 * レイヤーアイテム計算フック
 *
 * グループを考慮したレイヤーアイテムのリスト構築と
 * 可視性ヘルパー関数を提供
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
	/** グループを考慮したレイヤーアイテムのリスト */
	layerItems: LayerItem[];
	/** グループ内の全オブジェクトが表示中かどうか */
	isGroupAllVisible: (group: ObjectGroup) => boolean;
	/** グループ内の全オブジェクトが非表示かどうか */
	isGroupAllHidden: (group: ObjectGroup) => boolean;
	/** グループ内の全オブジェクトがロック中かどうか */
	isGroupAllLocked: (group: ObjectGroup) => boolean;
	/** グループ内の全オブジェクトがロック解除かどうか */
	isGroupAllUnlocked: (group: ObjectGroup) => boolean;
}

/**
 * レイヤーアイテム計算フック
 */
export function useLayerItems({
	objects,
	getGroupForObject,
}: UseLayerItemsParams): UseLayerItemsReturn {
	// レイヤーアイテムのリストを構築（グループを考慮）
	const layerItems = useMemo<LayerItem[]>(() => {
		const items: LayerItem[] = [];
		const processedIds = new Set<string>();

		for (const obj of objects) {
			if (processedIds.has(obj.id)) continue;

			const group = getGroupForObject(obj.id);

			if (group) {
				// グループの最初のオブジェクト（配列順で最初に出現するオブジェクト）でグループヘッダーを追加
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

					// グループ内のオブジェクトを追加（折りたたまれていなければ）
					if (!group.collapsed) {
						// オブジェクト配列の順序に従ってグループ内オブジェクトを追加
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
						// 折りたたまれている場合はIDだけ記録
						for (const id of group.objectIds) {
							processedIds.add(id);
						}
					}
				}
			} else {
				// グループに属していないオブジェクト
				items.push({
					type: "object",
					objectId: obj.id,
					isInGroup: false,
				});
			}
		}

		return items;
	}, [objects, getGroupForObject]);

	// グループ内のオブジェクトが全て表示中かどうかを取得
	const isGroupAllVisible = useCallback(
		(group: ObjectGroup) => {
			return group.objectIds.every((id) => {
				const obj = objects.find((o) => o.id === id);
				return obj?.flags.visible;
			});
		},
		[objects],
	);

	// グループ内のオブジェクトが全て非表示かどうかを取得
	const isGroupAllHidden = useCallback(
		(group: ObjectGroup) => {
			return group.objectIds.every((id) => {
				const obj = objects.find((o) => o.id === id);
				return !obj?.flags.visible;
			});
		},
		[objects],
	);

	// グループ内のオブジェクトが全てロック中かどうかを取得
	const isGroupAllLocked = useCallback(
		(group: ObjectGroup) => {
			return group.objectIds.every((id) => {
				const obj = objects.find((o) => o.id === id);
				return obj?.flags.locked;
			});
		},
		[objects],
	);

	// グループ内のオブジェクトが全てロック解除かどうかを取得
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
