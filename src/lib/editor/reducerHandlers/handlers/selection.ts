/**
 * 選択系アクションハンドラー
 */

import type { EditorState } from "../../types";

/**
 * オブジェクトを選択
 */
export function handleSelectObject(
	state: EditorState,
	payload: { objectId: string; additive?: boolean },
): EditorState {
	const { objectId, additive } = payload;

	if (additive) {
		// 追加選択モード (Shift + クリック)
		const exists = state.selectedIds.includes(objectId);
		return {
			...state,
			selectedIds: exists
				? state.selectedIds.filter((id) => id !== objectId)
				: [...state.selectedIds, objectId],
		};
	}

	// 単一選択
	return {
		...state,
		selectedIds: [objectId],
	};
}

/**
 * 複数オブジェクトを選択
 */
export function handleSelectObjects(
	state: EditorState,
	payload: { objectIds: string[] },
): EditorState {
	return {
		...state,
		selectedIds: payload.objectIds,
	};
}

/**
 * 全選択解除
 */
export function handleDeselectAll(state: EditorState): EditorState {
	return {
		...state,
		selectedIds: [],
	};
}
