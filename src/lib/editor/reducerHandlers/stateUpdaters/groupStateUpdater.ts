/**
 * グループ状態更新ユーティリティ
 */

import type { ObjectGroup } from "../../types";

/**
 * グループを追加
 * @param groups 現在のグループ配列
 * @param group 追加するグループ
 * @returns 更新されたグループ配列
 */
export function addGroup(
	groups: ObjectGroup[],
	group: ObjectGroup,
): ObjectGroup[] {
	return [...groups, group];
}

/**
 * グループを削除
 * @param groups 現在のグループ配列
 * @param groupId 削除するグループID
 * @returns 更新されたグループ配列
 */
export function removeGroup(
	groups: ObjectGroup[],
	groupId: string,
): ObjectGroup[] {
	return groups.filter((g) => g.id !== groupId);
}

/**
 * グループを更新
 * @param groups 現在のグループ配列
 * @param groupId 更新するグループID
 * @param updates 更新内容
 * @returns 更新されたグループ配列
 */
export function updateGroup(
	groups: ObjectGroup[],
	groupId: string,
	updates: Partial<ObjectGroup>,
): ObjectGroup[] {
	return groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g));
}

/**
 * グループ配列を置き換え
 * @param _currentGroups 現在のグループ配列（未使用）
 * @param newGroups 新しいグループ配列
 * @returns 新しいグループ配列
 */
export function replaceGroups(
	_currentGroups: ObjectGroup[],
	newGroups: ObjectGroup[],
): ObjectGroup[] {
	return newGroups;
}

/**
 * 複数のグループを更新
 * @param groups 現在のグループ配列
 * @param updates グループID → 更新内容のMap
 * @returns 更新されたグループ配列
 */
export function updateMultipleGroups(
	groups: ObjectGroup[],
	updates: Map<string, Partial<ObjectGroup>>,
): ObjectGroup[] {
	return groups.map((g) => {
		const update = updates.get(g.id);
		return update ? { ...g, ...update } : g;
	});
}
