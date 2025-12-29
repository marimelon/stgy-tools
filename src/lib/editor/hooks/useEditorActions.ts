/**
 * エディターアクション作成フック
 *
 * dispatchをラップしたアクション作成メソッドを提供
 */

import { useCallback } from "react";
import type {
	BackgroundId,
	BoardData,
	BoardObject,
	Position,
} from "@/lib/stgy";
import { createDefaultObject } from "../factory";
import type {
	AlignmentType,
	BatchUpdatePayload,
	EditorAction,
	EditorState,
	GridSettings,
} from "../types";

export interface UseEditorActionsParams {
	state: EditorState;
	dispatch: React.Dispatch<EditorAction>;
}

export interface UseEditorActionsReturn {
	setBoard: (board: BoardData) => void;
	selectObject: (index: number, additive?: boolean) => void;
	selectObjects: (indices: number[]) => void;
	deselectAll: () => void;
	updateObject: (index: number, updates: Partial<BoardObject>) => void;
	updateObjectsBatch: (updates: BatchUpdatePayload) => void;
	addObject: (objectId: number, position?: Position) => void;
	deleteSelected: () => void;
	duplicateSelected: () => void;
	copySelected: () => void;
	paste: (position?: Position) => void;
	undo: () => void;
	redo: () => void;
	commitHistory: (description: string) => void;
	jumpToHistory: (index: number) => void;
	clearHistory: () => void;
	moveObjects: (indices: number[], deltaX: number, deltaY: number) => void;
	updateBoardMeta: (updates: {
		name?: string;
		backgroundId?: BackgroundId;
	}) => void;
	moveLayer: (direction: "front" | "back" | "forward" | "backward") => void;
	reorderLayer: (fromIndex: number, toIndex: number) => void;
	reorderGroup: (groupId: string, toIndex: number) => void;
	groupSelected: () => void;
	ungroup: (groupId: string) => void;
	renameGroup: (groupId: string, name: string) => void;
	removeFromGroup: (objectIndex: number) => void;
	toggleGroupCollapse: (groupId: string) => void;
	getGroupForObject: (
		index: number,
	) => import("../types").ObjectGroup | undefined;
	selectGroup: (groupId: string) => void;
	setGridSettings: (settings: Partial<GridSettings>) => void;
	alignObjects: (alignment: AlignmentType) => void;
	selectAll: () => void;
	startTextEdit: (index: number) => void;
	endTextEdit: (save: boolean, text?: string) => void;
	focusGroup: (groupId: string) => void;
	unfocus: () => void;
}

/**
 * エディターアクション作成フック
 */
export function useEditorActions({
	state,
	dispatch,
}: UseEditorActionsParams): UseEditorActionsReturn {
	const setBoard = useCallback(
		(board: BoardData) => {
			dispatch({ type: "SET_BOARD", board });
		},
		[dispatch],
	);

	const selectObject = useCallback(
		(index: number, additive?: boolean) => {
			dispatch({ type: "SELECT_OBJECT", index, additive });
		},
		[dispatch],
	);

	const selectObjects = useCallback(
		(indices: number[]) => {
			dispatch({ type: "SELECT_OBJECTS", indices });
		},
		[dispatch],
	);

	const deselectAll = useCallback(() => {
		dispatch({ type: "DESELECT_ALL" });
	}, [dispatch]);

	const updateObject = useCallback(
		(index: number, updates: Partial<BoardObject>) => {
			dispatch({ type: "UPDATE_OBJECT", index, updates });
		},
		[dispatch],
	);

	const updateObjectsBatch = useCallback(
		(updates: BatchUpdatePayload) => {
			if (state.selectedIndices.length === 0) return;
			dispatch({
				type: "UPDATE_OBJECTS_BATCH",
				indices: state.selectedIndices,
				updates,
			});
		},
		[dispatch, state.selectedIndices],
	);

	const addObject = useCallback(
		(objectId: number, position?: Position) => {
			const object = createDefaultObject(objectId, position);
			dispatch({ type: "ADD_OBJECT", object });
		},
		[dispatch],
	);

	const deleteSelected = useCallback(() => {
		dispatch({ type: "DELETE_OBJECTS", indices: state.selectedIndices });
	}, [dispatch, state.selectedIndices]);

	const duplicateSelected = useCallback(() => {
		dispatch({ type: "DUPLICATE_OBJECTS", indices: state.selectedIndices });
	}, [dispatch, state.selectedIndices]);

	const copySelected = useCallback(() => {
		dispatch({ type: "COPY_OBJECTS" });
	}, [dispatch]);

	const paste = useCallback(
		(position?: Position) => {
			dispatch({ type: "PASTE_OBJECTS", position });
		},
		[dispatch],
	);

	const undo = useCallback(() => {
		dispatch({ type: "UNDO" });
	}, [dispatch]);

	const redo = useCallback(() => {
		dispatch({ type: "REDO" });
	}, [dispatch]);

	const commitHistory = useCallback(
		(description: string) => {
			dispatch({ type: "COMMIT_HISTORY", description });
		},
		[dispatch],
	);

	const jumpToHistory = useCallback(
		(index: number) => {
			dispatch({ type: "JUMP_TO_HISTORY", index });
		},
		[dispatch],
	);

	const clearHistory = useCallback(() => {
		dispatch({ type: "CLEAR_HISTORY" });
	}, [dispatch]);

	const moveObjects = useCallback(
		(indices: number[], deltaX: number, deltaY: number) => {
			dispatch({ type: "MOVE_OBJECTS", indices, deltaX, deltaY });
		},
		[dispatch],
	);

	const updateBoardMeta = useCallback(
		(updates: { name?: string; backgroundId?: BackgroundId }) => {
			dispatch({ type: "UPDATE_BOARD_META", updates });
		},
		[dispatch],
	);

	const moveLayer = useCallback(
		(direction: "front" | "back" | "forward" | "backward") => {
			if (state.selectedIndices.length !== 1) return;
			dispatch({
				type: "MOVE_LAYER",
				index: state.selectedIndices[0],
				direction,
			});
		},
		[dispatch, state.selectedIndices],
	);

	const reorderLayer = useCallback(
		(fromIndex: number, toIndex: number) => {
			dispatch({ type: "REORDER_LAYER", fromIndex, toIndex });
		},
		[dispatch],
	);

	const reorderGroup = useCallback(
		(groupId: string, toIndex: number) => {
			dispatch({ type: "REORDER_GROUP", groupId, toIndex });
		},
		[dispatch],
	);

	const groupSelected = useCallback(() => {
		if (state.selectedIndices.length < 2) return;
		dispatch({ type: "GROUP_OBJECTS", indices: state.selectedIndices });
	}, [dispatch, state.selectedIndices]);

	const ungroup = useCallback(
		(groupId: string) => {
			dispatch({ type: "UNGROUP", groupId });
		},
		[dispatch],
	);

	const renameGroup = useCallback(
		(groupId: string, name: string) => {
			dispatch({ type: "RENAME_GROUP", groupId, name });
		},
		[dispatch],
	);

	const removeFromGroup = useCallback(
		(objectIndex: number) => {
			dispatch({ type: "REMOVE_FROM_GROUP", objectIndex });
		},
		[dispatch],
	);

	const toggleGroupCollapse = useCallback(
		(groupId: string) => {
			dispatch({ type: "TOGGLE_GROUP_COLLAPSE", groupId });
		},
		[dispatch],
	);

	const getGroupForObject = useCallback(
		(index: number) => {
			return state.groups.find((g) => g.objectIndices.includes(index));
		},
		[state.groups],
	);

	const selectGroup = useCallback(
		(groupId: string) => {
			const group = state.groups.find((g) => g.id === groupId);
			if (group) {
				dispatch({ type: "SELECT_OBJECTS", indices: group.objectIndices });
			}
		},
		[dispatch, state.groups],
	);

	const setGridSettings = useCallback(
		(settings: Partial<GridSettings>) => {
			dispatch({ type: "SET_GRID_SETTINGS", settings });
		},
		[dispatch],
	);

	const alignObjects = useCallback(
		(alignment: AlignmentType) => {
			if (state.selectedIndices.length < 2) return;
			dispatch({
				type: "ALIGN_OBJECTS",
				indices: state.selectedIndices,
				alignment,
			});
		},
		[dispatch, state.selectedIndices],
	);

	const selectAll = useCallback(() => {
		// フォーカスモード中はフォーカス中グループ内のみを選択
		if (state.focusedGroupId !== null) {
			const focusedGroup = state.groups.find(
				(g) => g.id === state.focusedGroupId,
			);
			if (focusedGroup) {
				dispatch({
					type: "SELECT_OBJECTS",
					indices: focusedGroup.objectIndices,
				});
				return;
			}
		}
		// 通常モードは全選択
		const allIndices = state.board.objects.map((_, i) => i);
		dispatch({ type: "SELECT_OBJECTS", indices: allIndices });
	}, [dispatch, state.board.objects, state.focusedGroupId, state.groups]);

	const startTextEdit = useCallback(
		(index: number) => {
			dispatch({ type: "START_TEXT_EDIT", index });
		},
		[dispatch],
	);

	const endTextEdit = useCallback(
		(save: boolean, text?: string) => {
			const currentText =
				state.editingTextIndex !== null
					? state.board.objects[state.editingTextIndex]?.text
					: undefined;
			dispatch({ type: "END_TEXT_EDIT", save, text });
			// テキストが実際に変更された場合のみ履歴をコミット
			if (save && text !== undefined && text !== currentText) {
				dispatch({ type: "COMMIT_HISTORY", description: "テキスト編集" });
			}
		},
		[dispatch, state.editingTextIndex, state.board.objects],
	);

	const focusGroup = useCallback(
		(groupId: string) => {
			dispatch({ type: "SET_FOCUS_GROUP", groupId });
		},
		[dispatch],
	);

	const unfocus = useCallback(() => {
		dispatch({ type: "SET_FOCUS_GROUP", groupId: null });
	}, [dispatch]);

	return {
		setBoard,
		selectObject,
		selectObjects,
		deselectAll,
		updateObject,
		updateObjectsBatch,
		addObject,
		deleteSelected,
		duplicateSelected,
		copySelected,
		paste,
		undo,
		redo,
		commitHistory,
		jumpToHistory,
		clearHistory,
		moveObjects,
		updateBoardMeta,
		moveLayer,
		reorderLayer,
		reorderGroup,
		groupSelected,
		ungroup,
		renameGroup,
		removeFromGroup,
		toggleGroupCollapse,
		getGroupForObject,
		selectGroup,
		setGridSettings,
		alignObjects,
		selectAll,
		startTextEdit,
		endTextEdit,
		focusGroup,
		unfocus,
	};
}
