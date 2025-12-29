/**
 * エディター状態セレクターフック
 *
 * 計算済み状態（派生状態）を提供
 */

import { useMemo } from "react";
import type { BoardObject } from "@/lib/stgy";
import type { EditorState, ObjectGroup } from "../types";

export interface UseEditorSelectorsParams {
	state: EditorState;
}

export interface UseEditorSelectorsReturn {
	/** Undoが可能か */
	canUndo: boolean;
	/** Redoが可能か */
	canRedo: boolean;
	/** 選択されているオブジェクト */
	selectedObjects: BoardObject[];
	/** グループ化可能か（2つ以上選択中） */
	canGroup: boolean;
	/** 選択中のオブジェクトが属するグループ（単一選択時） */
	selectedGroup: ObjectGroup | undefined;
	/** 整列可能か（2つ以上選択中） */
	canAlign: boolean;
	/** フォーカス中のグループID */
	focusedGroupId: string | null;
	/** フォーカスモードかどうか */
	isFocusMode: boolean;
	/** フォーカス中のグループ */
	focusedGroup: ObjectGroup | undefined;
}

/**
 * エディター状態セレクターフック
 */
export function useEditorSelectors({
	state,
}: UseEditorSelectorsParams): UseEditorSelectorsReturn {
	const canUndo = state.historyIndex > 0;
	const canRedo = state.historyIndex < state.history.length - 1;

	const selectedObjects = useMemo(() => {
		return state.selectedIndices
			.filter((i) => i >= 0 && i < state.board.objects.length)
			.map((i) => state.board.objects[i]);
	}, [state.selectedIndices, state.board.objects]);

	const canGroup = state.selectedIndices.length >= 2;
	const canAlign = state.selectedIndices.length >= 2;

	const selectedGroup = useMemo(() => {
		if (state.selectedIndices.length === 0) return undefined;
		// 選択中のオブジェクトが属するグループを探す（最初のオブジェクトで判定）
		return state.groups.find((g) =>
			g.objectIndices.includes(state.selectedIndices[0]),
		);
	}, [state.selectedIndices, state.groups]);

	const focusedGroupId = state.focusedGroupId;
	const isFocusMode = focusedGroupId !== null;

	const focusedGroup = useMemo(() => {
		if (focusedGroupId === null) return undefined;
		return state.groups.find((g) => g.id === focusedGroupId);
	}, [focusedGroupId, state.groups]);

	return {
		canUndo,
		canRedo,
		selectedObjects,
		canGroup,
		selectedGroup,
		canAlign,
		focusedGroupId,
		isFocusMode,
		focusedGroup,
	};
}
