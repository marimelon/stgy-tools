/**
 * インデックス管理ロジック
 * グループ内のオブジェクトインデックスの更新を一元管理
 */

import type { ObjectGroup } from "../../types";

/**
 * オブジェクト追加時: 全インデックスを下にシフト
 * @param groups 既存のグループ配列
 * @param count 追加されたオブジェクトの数
 * @returns 更新されたグループ配列
 */
export function shiftIndicesDown(
	groups: ObjectGroup[],
	count: number,
): ObjectGroup[] {
	return groups.map((group) => ({
		...group,
		objectIndices: group.objectIndices.map((i) => i + count),
	}));
}

/**
 * オブジェクト削除時: 削除されたインデックスを除外し、シフト
 * @param groups 既存のグループ配列
 * @param deletedIndices 削除されたオブジェクトのインデックス配列
 * @returns 更新されたグループ配列（空のグループは除外）
 */
export function removeIndices(
	groups: ObjectGroup[],
	deletedIndices: number[],
): ObjectGroup[] {
	const sortedDeleted = [...deletedIndices].sort((a, b) => b - a);

	return groups
		.map((group) => {
			// 削除されたインデックスを除外
			let newIndices = group.objectIndices.filter(
				(i) => !deletedIndices.includes(i),
			);

			// 削除されたインデックスより大きいインデックスを調整
			for (const deleted of sortedDeleted) {
				newIndices = newIndices.map((i) => (i > deleted ? i - 1 : i));
			}

			return {
				...group,
				objectIndices: newIndices,
			};
		})
		.filter((group) => group.objectIndices.length > 0); // 空のグループを削除
}

/**
 * レイヤー移動時: インデックスを更新
 * @param groups 既存のグループ配列
 * @param fromIndex 移動元のインデックス
 * @param toIndex 移動先のインデックス
 * @returns 更新されたグループ配列
 */
export function updateForLayerMove(
	groups: ObjectGroup[],
	fromIndex: number,
	toIndex: number,
): ObjectGroup[] {
	return groups.map((group) => ({
		...group,
		objectIndices: group.objectIndices.map((i) => {
			if (i === fromIndex) return toIndex;

			// fromIndex から toIndex への移動によるシフト
			if (fromIndex < toIndex) {
				// 下に移動: fromIndex+1 ~ toIndex の範囲を -1
				if (i > fromIndex && i <= toIndex) return i - 1;
			} else {
				// 上に移動: toIndex ~ fromIndex-1 の範囲を +1
				if (i >= toIndex && i < fromIndex) return i + 1;
			}
			return i;
		}),
	}));
}

/**
 * グループ移動時: 複雑なインデックス更新
 * @param groups 既存のグループ配列
 * @param groupId 移動するグループのID
 * @param sortedIndices グループ内のソート済みインデックス配列
 * @param insertAt 挿入位置
 * @param groupSize グループサイズ
 * @returns 更新されたグループ配列
 */
export function updateForGroupMove(
	groups: ObjectGroup[],
	groupId: string,
	sortedIndices: number[],
	insertAt: number,
	groupSize: number,
): ObjectGroup[] {
	// 新しいグループのインデックス
	const newGroupIndices = Array.from(
		{ length: groupSize },
		(_, i) => insertAt + i,
	);

	return groups.map((g) => {
		if (g.id === groupId) {
			return { ...g, objectIndices: newGroupIndices };
		}

		// 他のグループのインデックスも調整
		const newIndices = g.objectIndices.map((idx) => {
			let newIdx = idx;

			// 削除による影響
			const deletedBefore = sortedIndices.filter((si) => si < idx).length;
			newIdx -= deletedBefore;

			// 挿入による影響
			if (newIdx >= insertAt) {
				newIdx += groupSize;
			}

			return newIdx;
		});

		return { ...g, objectIndices: newIndices };
	});
}
