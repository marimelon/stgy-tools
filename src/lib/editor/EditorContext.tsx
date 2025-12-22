/**
 * エディターContext
 */

import {
	createContext,
	useContext,
	useReducer,
	useCallback,
	useMemo,
	type ReactNode,
} from "react";
import type {
	BoardData,
	BoardObject,
	Position,
	BackgroundId,
} from "@/lib/stgy";
import type {
	EditorState,
	EditorAction,
	GridSettings,
	AlignmentType,
	ObjectGroup,
} from "./types";
import { editorReducer, createInitialStateWithOptions } from "./reducer";
import { createDefaultObject } from "./factory";

/**
 * エディターContextの値
 */
export interface EditorContextValue {
	/** 現在の状態 */
	state: EditorState;
	/** ディスパッチ関数 */
	dispatch: React.Dispatch<EditorAction>;

	// 便利メソッド
	/** ボードを設定 */
	setBoard: (board: BoardData) => void;
	/** オブジェクトを選択 */
	selectObject: (index: number, additive?: boolean) => void;
	/** 複数オブジェクトを選択 */
	selectObjects: (indices: number[]) => void;
	/** 選択を解除 */
	deselectAll: () => void;
	/** オブジェクトを更新 */
	updateObject: (index: number, updates: Partial<BoardObject>) => void;
	/** オブジェクトを追加 */
	addObject: (objectId: number, position?: Position) => void;
	/** 選択オブジェクトを削除 */
	deleteSelected: () => void;
	/** 選択オブジェクトを複製 */
	duplicateSelected: () => void;
	/** 選択オブジェクトをコピー */
	copySelected: () => void;
	/** 貼り付け */
	paste: (position?: Position) => void;
	/** 元に戻す */
	undo: () => void;
	/** やり直す */
	redo: () => void;
	/** 履歴をコミット (ドラッグ終了時など) */
	commitHistory: (description: string) => void;
	/** オブジェクトを移動 */
	moveObjects: (indices: number[], deltaX: number, deltaY: number) => void;
	/** ボードメタデータを更新 */
	updateBoardMeta: (updates: {
		name?: string;
		backgroundId?: BackgroundId;
	}) => void;
	/** レイヤーを移動 */
	moveLayer: (direction: "front" | "back" | "forward" | "backward") => void;
	/** レイヤーを任意の位置に移動（ドラッグ&ドロップ用） */
	reorderLayer: (fromIndex: number, toIndex: number) => void;
	/** グループ全体を任意の位置に移動 */
	reorderGroup: (groupId: string, toIndex: number) => void;
	/** 選択オブジェクトをグループ化 */
	groupSelected: () => void;
	/** グループを解除 */
	ungroup: (groupId: string) => void;
	/** オブジェクトをグループから除外 */
	removeFromGroup: (objectIndex: number) => void;
	/** グループの折りたたみ切替 */
	toggleGroupCollapse: (groupId: string) => void;
	/** オブジェクトが属するグループを取得 */
	getGroupForObject: (
		index: number,
	) => import("./types").ObjectGroup | undefined;
	/** グループ内の全オブジェクトを選択 */
	selectGroup: (groupId: string) => void;
	/** グリッド設定を更新 */
	setGridSettings: (settings: Partial<GridSettings>) => void;
	/** 選択オブジェクトを整列 */
	alignObjects: (alignment: AlignmentType) => void;
	/** 全オブジェクトを選択 */
	selectAll: () => void;

	// 状態
	/** Undoが可能か */
	canUndo: boolean;
	/** Redoが可能か */
	canRedo: boolean;
	/** 選択されているオブジェクト */
	selectedObjects: BoardObject[];
	/** グループ化可能か（2つ以上選択中） */
	canGroup: boolean;
	/** 選択中のオブジェクトが属するグループ（単一選択時） */
	selectedGroup: import("./types").ObjectGroup | undefined;
	/** 整列可能か（2つ以上選択中） */
	canAlign: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

/**
 * エディターContextフック
 */
export function useEditor(): EditorContextValue {
	const context = useContext(EditorContext);
	if (!context) {
		throw new Error("useEditor must be used within an EditorProvider");
	}
	return context;
}

/**
 * エディターProviderのProps
 */
interface EditorProviderProps {
	children: ReactNode;
	initialBoard: BoardData;
	/** 初期グループ情報（セッション復元用） */
	initialGroups?: ObjectGroup[];
	/** 初期グリッド設定（セッション復元用） */
	initialGridSettings?: GridSettings;
}

/**
 * エディターProvider
 */
export function EditorProvider({
	children,
	initialBoard,
	initialGroups,
	initialGridSettings,
}: EditorProviderProps) {
	const [state, dispatch] = useReducer(
		editorReducer,
		{
			board: initialBoard,
			groups: initialGroups,
			gridSettings: initialGridSettings,
		},
		createInitialStateWithOptions,
	);

	// 便利メソッド
	const setBoard = useCallback((board: BoardData) => {
		dispatch({ type: "SET_BOARD", board });
	}, []);

	const selectObject = useCallback((index: number, additive?: boolean) => {
		dispatch({ type: "SELECT_OBJECT", index, additive });
	}, []);

	const selectObjects = useCallback((indices: number[]) => {
		dispatch({ type: "SELECT_OBJECTS", indices });
	}, []);

	const deselectAll = useCallback(() => {
		dispatch({ type: "DESELECT_ALL" });
	}, []);

	const updateObject = useCallback(
		(index: number, updates: Partial<BoardObject>) => {
			dispatch({ type: "UPDATE_OBJECT", index, updates });
		},
		[],
	);

	const addObject = useCallback((objectId: number, position?: Position) => {
		const object = createDefaultObject(objectId, position);
		dispatch({ type: "ADD_OBJECT", object });
	}, []);

	const deleteSelected = useCallback(() => {
		dispatch({ type: "DELETE_OBJECTS", indices: state.selectedIndices });
	}, [state.selectedIndices]);

	const duplicateSelected = useCallback(() => {
		dispatch({ type: "DUPLICATE_OBJECTS", indices: state.selectedIndices });
	}, [state.selectedIndices]);

	const copySelected = useCallback(() => {
		dispatch({ type: "COPY_OBJECTS" });
	}, []);

	const paste = useCallback((position?: Position) => {
		dispatch({ type: "PASTE_OBJECTS", position });
	}, []);

	const undo = useCallback(() => {
		dispatch({ type: "UNDO" });
	}, []);

	const redo = useCallback(() => {
		dispatch({ type: "REDO" });
	}, []);

	const commitHistory = useCallback((description: string) => {
		dispatch({ type: "COMMIT_HISTORY", description });
	}, []);

	const moveObjects = useCallback(
		(indices: number[], deltaX: number, deltaY: number) => {
			dispatch({ type: "MOVE_OBJECTS", indices, deltaX, deltaY });
		},
		[],
	);

	const updateBoardMeta = useCallback(
		(updates: { name?: string; backgroundId?: BackgroundId }) => {
			dispatch({ type: "UPDATE_BOARD_META", updates });
		},
		[],
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
		[state.selectedIndices],
	);

	const reorderLayer = useCallback((fromIndex: number, toIndex: number) => {
		dispatch({ type: "REORDER_LAYER", fromIndex, toIndex });
	}, []);

	const reorderGroup = useCallback((groupId: string, toIndex: number) => {
		dispatch({ type: "REORDER_GROUP", groupId, toIndex });
	}, []);

	const groupSelected = useCallback(() => {
		if (state.selectedIndices.length < 2) return;
		dispatch({ type: "GROUP_OBJECTS", indices: state.selectedIndices });
	}, [state.selectedIndices]);

	const ungroup = useCallback((groupId: string) => {
		dispatch({ type: "UNGROUP", groupId });
	}, []);

	const removeFromGroup = useCallback((objectIndex: number) => {
		dispatch({ type: "REMOVE_FROM_GROUP", objectIndex });
	}, []);

	const toggleGroupCollapse = useCallback((groupId: string) => {
		dispatch({ type: "TOGGLE_GROUP_COLLAPSE", groupId });
	}, []);

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
		[state.groups],
	);

	const setGridSettings = useCallback((settings: Partial<GridSettings>) => {
		dispatch({ type: "SET_GRID_SETTINGS", settings });
	}, []);

	const alignObjects = useCallback(
		(alignment: AlignmentType) => {
			if (state.selectedIndices.length < 2) return;
			dispatch({
				type: "ALIGN_OBJECTS",
				indices: state.selectedIndices,
				alignment,
			});
		},
		[state.selectedIndices],
	);

	const selectAll = useCallback(() => {
		const allIndices = state.board.objects.map((_, i) => i);
		dispatch({ type: "SELECT_OBJECTS", indices: allIndices });
	}, [state.board.objects]);

	// 計算済み状態
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

	const value = useMemo<EditorContextValue>(
		() => ({
			state,
			dispatch,
			setBoard,
			selectObject,
			selectObjects,
			deselectAll,
			updateObject,
			addObject,
			deleteSelected,
			duplicateSelected,
			copySelected,
			paste,
			undo,
			redo,
			commitHistory,
			moveObjects,
			updateBoardMeta,
			moveLayer,
			reorderLayer,
			reorderGroup,
			groupSelected,
			ungroup,
			removeFromGroup,
			toggleGroupCollapse,
			getGroupForObject,
			selectGroup,
			setGridSettings,
			alignObjects,
			selectAll,
			canUndo,
			canRedo,
			selectedObjects,
			canGroup,
			selectedGroup,
			canAlign,
		}),
		[
			state,
			setBoard,
			selectObject,
			selectObjects,
			deselectAll,
			updateObject,
			addObject,
			deleteSelected,
			duplicateSelected,
			copySelected,
			paste,
			undo,
			redo,
			commitHistory,
			moveObjects,
			updateBoardMeta,
			moveLayer,
			reorderLayer,
			reorderGroup,
			groupSelected,
			ungroup,
			removeFromGroup,
			toggleGroupCollapse,
			getGroupForObject,
			selectGroup,
			setGridSettings,
			alignObjects,
			selectAll,
			canUndo,
			canRedo,
			selectedObjects,
			canGroup,
			selectedGroup,
			canAlign,
		],
	);

	return (
		<EditorContext.Provider value={value}>{children}</EditorContext.Provider>
	);
}
