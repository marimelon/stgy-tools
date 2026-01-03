/**
 * グループ内オブジェクトID管理ロジック
 *
 * ID-basedでグループを管理しているため、オブジェクトの追加・削除・移動時に
 * インデックス更新は不要。削除時のID除去のみが必要。
 */

import type { ObjectGroup } from "../../types";

/**
 * オブジェクト削除時: 削除されたIDをグループから除外
 * @param groups 既存のグループ配列
 * @param deletedIds 削除されたオブジェクトのID配列
 * @returns 更新されたグループ配列（空または1つのみのグループは除外）
 */
export function removeIdsFromGroups(
	groups: ObjectGroup[],
	deletedIds: string[],
): ObjectGroup[] {
	const deletedIdSet = new Set(deletedIds);

	return groups
		.map((group) => ({
			...group,
			objectIds: group.objectIds.filter((id) => !deletedIdSet.has(id)),
		}))
		.filter((group) => group.objectIds.length >= 2); // 2つ未満のグループを削除
}

// Note: shiftIndicesDown, updateForLayerMove, updateForGroupMove は
// ID-based管理では不要になったため削除
