/**
 * エディターContext
 *
 * アクション作成とセレクターを統合し、エディター状態を提供
 */

import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useReducer,
} from "react";
import type {
	BackgroundId,
	BoardData,
	BoardObject,
	Position,
} from "@/lib/stgy";
import { useEditorActions } from "./hooks/useEditorActions";
import { useEditorSelectors } from "./hooks/useEditorSelectors";
import { createInitialStateWithOptions, editorReducer } from "./reducer";
import type {
	AlignmentType,
	BatchUpdatePayload,
	EditorAction,
	EditorState,
	GridSettings,
	ObjectGroup,
} from "./types";

/**
 * エディターContextの値
 */
export interface EditorContextValue {
	/** 現在の状態 */
	state: EditorState;
	/** ディスパッチ関数 */
	dispatch: React.Dispatch<EditorAction>;

	// アクションメソッド
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
	/** 選択中のオブジェクトを一括更新 */
	updateObjectsBatch: (updates: BatchUpdatePayload) => void;
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
	/** 任意の履歴位置に移動 */
	jumpToHistory: (index: number) => void;
	/** 履歴をクリア（初期状態に戻す） */
	clearHistory: () => void;
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
	/** グループ名を変更 */
	renameGroup: (groupId: string, name: string) => void;
	/** オブジェクトをグループから除外 */
	removeFromGroup: (objectIndex: number) => void;
	/** グループの折りたたみ切替 */
	toggleGroupCollapse: (groupId: string) => void;
	/** オブジェクトが属するグループを取得 */
	getGroupForObject: (index: number) => ObjectGroup | undefined;
	/** グループ内の全オブジェクトを選択 */
	selectGroup: (groupId: string) => void;
	/** グリッド設定を更新 */
	setGridSettings: (settings: Partial<GridSettings>) => void;
	/** 選択オブジェクトを整列 */
	alignObjects: (alignment: AlignmentType) => void;
	/** 全オブジェクトを選択 */
	selectAll: () => void;
	/** テキスト編集を開始 */
	startTextEdit: (index: number) => void;
	/** テキスト編集を終了 */
	endTextEdit: (save: boolean, text?: string) => void;

	// 計算済み状態
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
 *
 * useReducerでの状態管理、アクション作成、セレクターを統合
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

	// アクション作成フック
	const actions = useEditorActions({ state, dispatch });

	// セレクターフック
	const selectors = useEditorSelectors({ state });

	// Context値を作成
	const value = useMemo<EditorContextValue>(
		() => ({
			state,
			dispatch,
			...actions,
			...selectors,
		}),
		[state, actions, selectors],
	);

	return (
		<EditorContext.Provider value={value}>{children}</EditorContext.Provider>
	);
}
