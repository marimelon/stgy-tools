/**
 * 選択系アクションハンドラー
 */

import type { EditorState } from "../../types";

/**
 * オブジェクトを選択
 */
export function handleSelectObject(
	state: EditorState,
	payload: { index: number; additive?: boolean },
): EditorState {
	const { index, additive } = payload;

	if (additive) {
		// 追加選択モード (Shift + クリック)
		const exists = state.selectedIndices.includes(index);
		return {
			...state,
			selectedIndices: exists
				? state.selectedIndices.filter((i) => i !== index)
				: [...state.selectedIndices, index],
		};
	}

	// 単一選択
	return {
		...state,
		selectedIndices: [index],
	};
}

/**
 * 複数オブジェクトを選択
 */
export function handleSelectObjects(
	state: EditorState,
	payload: { indices: number[] },
): EditorState {
	return {
		...state,
		selectedIndices: payload.indices,
	};
}

/**
 * 全選択解除
 */
export function handleDeselectAll(state: EditorState): EditorState {
	return {
		...state,
		selectedIndices: [],
	};
}
