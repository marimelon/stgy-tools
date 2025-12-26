/**
 * 選択状態更新ユーティリティ
 */

/**
 * 選択インデックスを設定
 * @param indices 選択するインデックス配列
 * @returns 選択インデックス配列
 */
export function setSelectedIndices(indices: number[]): number[] {
	return [...indices];
}

/**
 * 選択インデックスを追加
 * @param currentIndices 現在の選択インデックス配列
 * @param indicesToAdd 追加するインデックス配列
 * @returns 更新された選択インデックス配列
 */
export function addSelectedIndices(
	currentIndices: number[],
	indicesToAdd: number[],
): number[] {
	const newIndices = new Set([...currentIndices, ...indicesToAdd]);
	return Array.from(newIndices).sort((a, b) => a - b);
}

/**
 * 選択インデックスを削除
 * @param currentIndices 現在の選択インデックス配列
 * @param indicesToRemove 削除するインデックス配列
 * @returns 更新された選択インデックス配列
 */
export function removeSelectedIndices(
	currentIndices: number[],
	indicesToRemove: number[],
): number[] {
	const removeSet = new Set(indicesToRemove);
	return currentIndices.filter((i) => !removeSet.has(i));
}

/**
 * 選択をクリア
 * @returns 空の配列
 */
export function clearSelection(): number[] {
	return [];
}

/**
 * 単一インデックスをトグル
 * @param currentIndices 現在の選択インデックス配列
 * @param index トグルするインデックス
 * @returns 更新された選択インデックス配列
 */
export function toggleSelectedIndex(
	currentIndices: number[],
	index: number,
): number[] {
	if (currentIndices.includes(index)) {
		return currentIndices.filter((i) => i !== index);
	}
	return [...currentIndices, index].sort((a, b) => a - b);
}

/**
 * 範囲選択
 * @param start 開始インデックス
 * @param end 終了インデックス
 * @returns 選択インデックス配列
 */
export function selectRange(start: number, end: number): number[] {
	const min = Math.min(start, end);
	const max = Math.max(start, end);
	return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}
