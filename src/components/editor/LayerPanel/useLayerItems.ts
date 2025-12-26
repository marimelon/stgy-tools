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
	getGroupForObject: (index: number) => ObjectGroup | undefined;
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
		const processedIndices = new Set<number>();

		for (let i = 0; i < objects.length; i++) {
			if (processedIndices.has(i)) continue;

			const group = getGroupForObject(i);

			if (group) {
				// グループの最初のオブジェクトでグループヘッダーを追加
				const firstInGroup = Math.min(...group.objectIndices);
				if (i === firstInGroup) {
					items.push({
						type: "group-header",
						group,
						isInGroup: false,
						groupId: group.id,
					});

					// グループ内のオブジェクトを追加（折りたたまれていなければ）
					if (!group.collapsed) {
						// 元の配列を変更しないようにコピーしてからソート
						const sortedIndices = [...group.objectIndices].sort((a, b) => a - b);
						const lastIndex = sortedIndices[sortedIndices.length - 1];
						for (const idx of sortedIndices) {
							items.push({
								type: "object",
								index: idx,
								isInGroup: true,
								groupId: group.id,
								isLastInGroup: idx === lastIndex,
							});
							processedIndices.add(idx);
						}
					} else {
						// 折りたたまれている場合はインデックスだけ記録
						for (const idx of group.objectIndices) {
							processedIndices.add(idx);
						}
					}
				}
			} else {
				// グループに属していないオブジェクト
				items.push({
					type: "object",
					index: i,
					isInGroup: false,
				});
			}
		}

		return items;
	}, [objects, getGroupForObject]);

	// グループ内のオブジェクトが全て表示中かどうかを取得
	const isGroupAllVisible = useCallback(
		(group: ObjectGroup) => {
			return group.objectIndices.every((i) => objects[i]?.flags.visible);
		},
		[objects],
	);

	// グループ内のオブジェクトが全て非表示かどうかを取得
	const isGroupAllHidden = useCallback(
		(group: ObjectGroup) => {
			return group.objectIndices.every((i) => !objects[i]?.flags.visible);
		},
		[objects],
	);

	// グループ内のオブジェクトが全てロック中かどうかを取得
	const isGroupAllLocked = useCallback(
		(group: ObjectGroup) => {
			return group.objectIndices.every((i) => objects[i]?.flags.locked);
		},
		[objects],
	);

	// グループ内のオブジェクトが全てロック解除かどうかを取得
	const isGroupAllUnlocked = useCallback(
		(group: ObjectGroup) => {
			return group.objectIndices.every((i) => !objects[i]?.flags.locked);
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
