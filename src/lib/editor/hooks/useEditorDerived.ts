/**
 * Derived stateへのアクセスフック
 *
 * ストアから派生する計算値へのReactフック
 * シンプルな計算はストアセレクタを直接使用し、
 * 複雑な計算のみDerivedを使用
 */

import { shallow, useStore } from "@tanstack/react-store";
import type { BoardObject } from "@/lib/stgy";
import { getEditorStore } from "../store/editorStore";
import type { CircularModeState, EditorState, ObjectGroup } from "../types";

/**
 * 選択されているオブジェクト配列を取得
 */
export function useSelectedObjects(): BoardObject[] {
	const store = getEditorStore();
	return useStore(
		store,
		(state: EditorState) => {
			const selectedSet = new Set(state.selectedIds);
			return state.board.objects.filter((obj) => selectedSet.has(obj.id));
		},
		{ equal: shallow },
	);
}

/**
 * グループ化可能かを取得
 */
export function useCanGroup(): boolean {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.selectedIds.length >= 2);
}

/**
 * 整列可能かを取得
 */
export function useCanAlign(): boolean {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.selectedIds.length >= 2);
}

/**
 * 選択中のオブジェクトが属するグループを取得
 */
export function useSelectedGroup(): ObjectGroup | undefined {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => {
		if (state.selectedIds.length === 0) return undefined;
		return state.groups.find((g) => g.objectIds.includes(state.selectedIds[0]));
	});
}

/**
 * Undoが可能かを取得
 */
export function useCanUndo(): boolean {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.historyIndex > 0);
}

/**
 * Redoが可能かを取得
 */
export function useCanRedo(): boolean {
	const store = getEditorStore();
	return useStore(
		store,
		(state: EditorState) => state.historyIndex < state.history.length - 1,
	);
}

/**
 * フォーカスモードかどうかを取得
 */
export function useIsFocusMode(): boolean {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.focusedGroupId !== null);
}

/**
 * フォーカス中のグループを取得
 */
export function useFocusedGroup(): ObjectGroup | undefined {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => {
		if (!state.focusedGroupId) return undefined;
		return state.groups.find((g) => g.id === state.focusedGroupId);
	});
}

/**
 * 円形配置モードかどうかを取得
 */
export function useIsCircularMode(): boolean {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.circularMode !== null);
}

/**
 * 円形配置モード状態を取得
 */
export function useCircularModeState(): CircularModeState | null {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.circularMode);
}

/**
 * 履歴操作の可否を一括で取得
 */
export function useHistoryCapabilities(): {
	canUndo: boolean;
	canRedo: boolean;
} {
	const canUndo = useCanUndo();
	const canRedo = useCanRedo();
	return { canUndo, canRedo };
}

/**
 * 選択関連の派生状態を一括で取得
 */
export function useSelectionDerived(): {
	selectedObjects: BoardObject[];
	canGroup: boolean;
	canAlign: boolean;
	selectedGroup: ObjectGroup | undefined;
} {
	const selectedObjects = useSelectedObjects();
	const canGroup = useCanGroup();
	const canAlign = useCanAlign();
	const selectedGroup = useSelectedGroup();
	return { selectedObjects, canGroup, canAlign, selectedGroup };
}

/**
 * フォーカスモード関連の派生状態を一括で取得
 */
export function useFocusModeDerived(): {
	isFocusMode: boolean;
	focusedGroup: ObjectGroup | undefined;
} {
	const isFocusMode = useIsFocusMode();
	const focusedGroup = useFocusedGroup();
	return { isFocusMode, focusedGroup };
}

/**
 * 円形配置モード関連の派生状態を一括で取得
 */
export function useCircularModeDerived(): {
	isCircularMode: boolean;
	circularModeState: CircularModeState | null;
} {
	const isCircularMode = useIsCircularMode();
	const circularModeState = useCircularModeState();
	return { isCircularMode, circularModeState };
}
