/**
 * グループのインデックス⇔ID変換ユーティリティ
 * インフラ層でのみ使用
 */

import type { ObjectGroup } from "@/lib/editor/types";
import type { BoardObject } from "@/lib/stgy/types";

/**
 * 保存形式のグループ（インデックスベース）
 */
export interface StoredObjectGroup {
	id: string;
	objectIndices: number[];
	name?: string;
	collapsed?: boolean;
}

/**
 * インデックスベースのグループをIDベースに変換
 * @param storedGroups 保存形式のグループ
 * @param objects ID付きのオブジェクト配列
 * @returns IDベースのグループ
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
 * IDベースのグループをインデックスベースに変換
 * @param groups IDベースのグループ
 * @param objects ID付きのオブジェクト配列
 * @returns 保存形式のグループ
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
