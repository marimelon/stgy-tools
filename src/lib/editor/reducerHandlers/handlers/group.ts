/**
 * グループ・グリッド操作ハンドラー
 */

import i18n from "@/lib/i18n";
import type { EditorState, GridSettings, ObjectGroup } from "../../types";
import { generateGroupId, pushHistory } from "../utils";

/**
 * オブジェクトをグループ化
 */
export function handleGroupObjects(
	state: EditorState,
	payload: { objectIds: string[] },
): EditorState {
	if (payload.objectIds.length < 2) return state;

	const newGroup: ObjectGroup = {
		id: generateGroupId(),
		objectIds: [...payload.objectIds],
	};

	const newGroups = [...state.groups, newGroup];

	return {
		...state,
		groups: newGroups,
		...pushHistory(
			{ ...state, groups: newGroups },
			i18n.t("history.groupObjects"),
		),
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

	// フォーカス中のグループが解除された場合、フォーカスをクリア
	const newFocusedGroupId =
		state.focusedGroupId === payload.groupId ? null : state.focusedGroupId;

	return {
		...state,
		groups: newGroups,
		focusedGroupId: newFocusedGroupId,
		...pushHistory(
			{ ...state, groups: newGroups },
			i18n.t("history.ungroupObjects"),
		),
	};
}

/**
 * グループ名を変更
 */
export function handleRenameGroup(
	state: EditorState,
	payload: { groupId: string; name: string },
): EditorState {
	const { groupId, name } = payload;
	const normalizedName = name.trim();

	const newGroups = state.groups.map((g) =>
		g.id === groupId ? { ...g, name: normalizedName || undefined } : g,
	);

	return {
		...state,
		groups: newGroups,
		...pushHistory(
			{ ...state, groups: newGroups },
			i18n.t("history.renameGroup"),
		),
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
	payload: { objectId: string },
): EditorState {
	const { objectId } = payload;

	// オブジェクトが属するグループを探す
	const group = state.groups.find((g) => g.objectIds.includes(objectId));
	if (!group) return state;

	// グループから除外
	const newIds = group.objectIds.filter((id) => id !== objectId);

	let newGroups: typeof state.groups;
	let newFocusedGroupId = state.focusedGroupId;

	if (newIds.length < 2) {
		// 残りが1つ以下ならグループ自体を削除
		newGroups = state.groups.filter((g) => g.id !== group.id);
		// フォーカス中のグループが削除された場合、フォーカスをクリア
		if (state.focusedGroupId === group.id) {
			newFocusedGroupId = null;
		}
	} else {
		// グループを更新
		newGroups = state.groups.map((g) =>
			g.id === group.id ? { ...g, objectIds: newIds } : g,
		);
	}

	return {
		...state,
		groups: newGroups,
		focusedGroupId: newFocusedGroupId,
		...pushHistory(
			{ ...state, groups: newGroups },
			i18n.t("history.removeFromGroup"),
		),
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

/**
 * フォーカスグループを設定
 */
export function handleSetFocusGroup(
	state: EditorState,
	payload: { groupId: string | null },
): EditorState {
	const { groupId } = payload;

	// フォーカス解除の場合
	if (groupId === null) {
		return {
			...state,
			focusedGroupId: null,
		};
	}

	// グループが存在するか検証
	const groupExists = state.groups.some((g) => g.id === groupId);
	if (!groupExists) {
		return state;
	}

	// フォーカス設定時、フォーカス外のオブジェクトが選択されていたら選択解除
	const focusedGroup = state.groups.find((g) => g.id === groupId);
	const focusedObjectIds = new Set(focusedGroup?.objectIds ?? []);
	const newSelectedIds = focusedGroup
		? state.selectedIds.filter((id) => focusedObjectIds.has(id))
		: state.selectedIds;

	// グループが折りたたまれていたら展開する
	const newGroups = state.groups.map((g) =>
		g.id === groupId ? { ...g, collapsed: false } : g,
	);

	return {
		...state,
		focusedGroupId: groupId,
		selectedIds: newSelectedIds,
		groups: newGroups,
	};
}
