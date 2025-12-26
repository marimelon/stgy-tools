/**
 * グループ・グリッド操作ハンドラー
 */

import type { EditorState, GridSettings, ObjectGroup } from "../../types";
import { generateGroupId, pushHistory } from "../utils";

/**
 * オブジェクトをグループ化
 */
export function handleGroupObjects(
	state: EditorState,
	payload: { indices: number[] },
): EditorState {
	if (payload.indices.length < 2) return state;

	const newGroup: ObjectGroup = {
		id: generateGroupId(),
		objectIndices: [...payload.indices].sort((a, b) => a - b),
	};

	const newGroups = [...state.groups, newGroup];

	return {
		...state,
		groups: newGroups,
		...pushHistory({ ...state, groups: newGroups }, "グループ化"),
	};
}

/**
 * グループを解除
 */
export function handleUngroup(
	state: EditorState,
	payload: { groupId: string },
): EditorState {
	const newGroups = state.groups.filter((g) => g.id !== payload.groupId);

	return {
		...state,
		groups: newGroups,
		...pushHistory({ ...state, groups: newGroups }, "グループ解除"),
	};
}

/**
 * グループの折りたたみ状態を切り替え
 */
export function handleToggleGroupCollapse(
	state: EditorState,
	payload: { groupId: string },
): EditorState {
	const newGroups = state.groups.map((g) =>
		g.id === payload.groupId ? { ...g, collapsed: !g.collapsed } : g,
	);

	return {
		...state,
		groups: newGroups,
	};
}

/**
 * オブジェクトをグループから除外
 */
export function handleRemoveFromGroup(
	state: EditorState,
	payload: { objectIndex: number },
): EditorState {
	const { objectIndex } = payload;

	// オブジェクトが属するグループを探す
	const group = state.groups.find((g) => g.objectIndices.includes(objectIndex));
	if (!group) return state;

	// グループから除外
	const newIndices = group.objectIndices.filter((i) => i !== objectIndex);

	let newGroups: typeof state.groups;
	if (newIndices.length < 2) {
		// 残りが1つ以下ならグループ自体を削除
		newGroups = state.groups.filter((g) => g.id !== group.id);
	} else {
		// グループを更新
		newGroups = state.groups.map((g) =>
			g.id === group.id ? { ...g, objectIndices: newIndices } : g,
		);
	}

	return {
		...state,
		groups: newGroups,
		...pushHistory({ ...state, groups: newGroups }, "グループから除外"),
	};
}

/**
 * グリッド設定を更新
 */
export function handleSetGridSettings(
	state: EditorState,
	payload: { settings: Partial<GridSettings> },
): EditorState {
	return {
		...state,
		gridSettings: {
			...state.gridSettings,
			...payload.settings,
		},
	};
}
