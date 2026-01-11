/**
 * Editor store access hooks
 *
 * Selective subscription using TanStack Store's useStore
 */

import { shallow, useStore } from "@tanstack/react-store";
import type { BoardData, BoardObject } from "@/lib/stgy";
import { getEditorStore, isEditorStoreInitialized } from "../store/editorStore";
import type {
	CircularModeState,
	EditorError,
	EditorState,
	GridSettings,
	HistoryEntry,
	ObjectGroup,
} from "../types";

/**
 * Check if store is initialized.
 * Used to detect timing issues during panel layout changes etc.
 */
export function useIsEditorStoreInitialized(): boolean {
	return isEditorStoreInitialized();
}

/**
 * Selectively subscribe to part of the state.
 * Re-renders only when selected value changes.
 */
export function useEditorSelector<T>(selector: (state: EditorState) => T): T {
	const store = getEditorStore();
	return useStore(store, selector);
}

/**
 * Selectively subscribe with shallow comparison.
 * Uses shallow comparison for objects and arrays.
 */
export function useEditorSelectorShallow<T>(
	selector: (state: EditorState) => T,
): T {
	const store = getEditorStore();
	return useStore(store, selector, { equal: shallow });
}

/**
 * Subscribe to entire state (not recommended for performance)
 * @deprecated Use useEditorSelector to subscribe only to needed parts
 */
export function useEditorState(): EditorState {
	const store = getEditorStore();
	return useStore(store, (s) => s);
}

// ============================================
// Predefined selectors
// ============================================

export const selectors = {
	board: (s: EditorState): BoardData => s.board,
	objects: (s: EditorState): BoardObject[] => s.board.objects,
	backgroundId: (s: EditorState): number => s.board.backgroundId,
	boardName: (s: EditorState): string => s.board.name,
	selectedIds: (s: EditorState): string[] => s.selectedIds,
	selectionCount: (s: EditorState): number => s.selectedIds.length,
	hasSelection: (s: EditorState): boolean => s.selectedIds.length > 0,
	hasSingleSelection: (s: EditorState): boolean => s.selectedIds.length === 1,
	gridSettings: (s: EditorState): GridSettings => s.gridSettings,
	groups: (s: EditorState): ObjectGroup[] => s.groups,
	history: (s: EditorState): HistoryEntry[] => s.history,
	historyIndex: (s: EditorState): number => s.historyIndex,
	isDirty: (s: EditorState): boolean => s.isDirty,
	editingTextId: (s: EditorState): string | null => s.editingTextId,
	isEditingText: (s: EditorState): boolean => s.editingTextId !== null,
	focusedGroupId: (s: EditorState): string | null => s.focusedGroupId,
	circularMode: (s: EditorState): CircularModeState | null => s.circularMode,
	lastError: (s: EditorState): EditorError | null => s.lastError,
} as const;

// ============================================
// Convenience hooks
// ============================================

/**
 * Note: Re-renders frequently during object movement.
 * Use useBoardName, useBackgroundId, useObjects for specific properties.
 */
export function useBoard(): BoardData {
	return useEditorSelector(selectors.board);
}

export function useBoardName(): string {
	return useEditorSelector(selectors.boardName);
}

export function useBackgroundId(): number {
	return useEditorSelector(selectors.backgroundId);
}

export function useObjects(): BoardObject[] {
	return useEditorSelectorShallow(selectors.objects);
}

export function useSelectedIds(): string[] {
	return useEditorSelectorShallow(selectors.selectedIds);
}

export function useGridSettings(): GridSettings {
	return useEditorSelector(selectors.gridSettings);
}

export function useGroups(): ObjectGroup[] {
	return useEditorSelectorShallow(selectors.groups);
}

export function useHistory(): {
	history: HistoryEntry[];
	historyIndex: number;
} {
	const history = useEditorSelectorShallow(selectors.history);
	const historyIndex = useEditorSelector(selectors.historyIndex);
	return { history, historyIndex };
}

export function useCircularMode(): CircularModeState | null {
	return useEditorSelector(selectors.circularMode);
}

export function useLastError(): EditorError | null {
	return useEditorSelector(selectors.lastError);
}

export function useEditingTextId(): string | null {
	return useEditorSelector(selectors.editingTextId);
}

export function useFocusedGroupId(): string | null {
	return useEditorSelector(selectors.focusedGroupId);
}

export function useIsDirty(): boolean {
	return useEditorSelector(selectors.isDirty);
}
