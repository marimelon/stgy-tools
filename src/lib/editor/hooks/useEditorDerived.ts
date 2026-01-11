/**
 * Derived state access hooks
 *
 * React hooks for computed values derived from store.
 * Simple calculations use store selectors directly,
 * complex calculations use Derived.
 */

import { shallow, useStore } from "@tanstack/react-store";
import type { BoardObject } from "@/lib/stgy";
import { getEditorStore } from "../store/editorStore";
import type { CircularModeState, EditorState, ObjectGroup } from "../types";

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

export function useCanGroup(): boolean {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.selectedIds.length >= 2);
}

export function useCanAlign(): boolean {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.selectedIds.length >= 2);
}

export function useSelectedGroup(): ObjectGroup | undefined {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => {
		if (state.selectedIds.length === 0) return undefined;
		return state.groups.find((g) => g.objectIds.includes(state.selectedIds[0]));
	});
}

export function useCanUndo(): boolean {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.historyIndex > 0);
}

export function useCanRedo(): boolean {
	const store = getEditorStore();
	return useStore(
		store,
		(state: EditorState) => state.historyIndex < state.history.length - 1,
	);
}

export function useIsFocusMode(): boolean {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.focusedGroupId !== null);
}

export function useFocusedGroup(): ObjectGroup | undefined {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => {
		if (!state.focusedGroupId) return undefined;
		return state.groups.find((g) => g.id === state.focusedGroupId);
	});
}

export function useIsCircularMode(): boolean {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.circularMode !== null);
}

export function useCircularModeState(): CircularModeState | null {
	const store = getEditorStore();
	return useStore(store, (state: EditorState) => state.circularMode);
}

export function useHistoryCapabilities(): {
	canUndo: boolean;
	canRedo: boolean;
} {
	const canUndo = useCanUndo();
	const canRedo = useCanRedo();
	return { canUndo, canRedo };
}

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

export function useFocusModeDerived(): {
	isFocusMode: boolean;
	focusedGroup: ObjectGroup | undefined;
} {
	const isFocusMode = useIsFocusMode();
	const focusedGroup = useFocusedGroup();
	return { isFocusMode, focusedGroup };
}

export function useCircularModeDerived(): {
	isCircularMode: boolean;
	circularModeState: CircularModeState | null;
} {
	const isCircularMode = useIsCircularMode();
	const circularModeState = useCircularModeState();
	return { isCircularMode, circularModeState };
}
