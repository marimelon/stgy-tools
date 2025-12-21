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
import type { BoardData, BoardObject, Position, BackgroundId } from "@/lib/stgy";
import type { EditorState, EditorAction } from "./types";
import { editorReducer, createInitialState } from "./reducer";
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
  updateBoardMeta: (updates: { name?: string; backgroundId?: BackgroundId }) => void;

  // 状態
  /** Undoが可能か */
  canUndo: boolean;
  /** Redoが可能か */
  canRedo: boolean;
  /** 選択されているオブジェクト */
  selectedObjects: BoardObject[];
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
}

/**
 * エディターProvider
 */
export function EditorProvider({
  children,
  initialBoard,
}: EditorProviderProps) {
  const [state, dispatch] = useReducer(
    editorReducer,
    initialBoard,
    createInitialState
  );

  // 便利メソッド
  const setBoard = useCallback((board: BoardData) => {
    dispatch({ type: "SET_BOARD", board });
  }, []);

  const selectObject = useCallback((index: number, additive?: boolean) => {
    dispatch({ type: "SELECT_OBJECT", index, additive });
  }, []);

  const deselectAll = useCallback(() => {
    dispatch({ type: "DESELECT_ALL" });
  }, []);

  const updateObject = useCallback(
    (index: number, updates: Partial<BoardObject>) => {
      dispatch({ type: "UPDATE_OBJECT", index, updates });
    },
    []
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
    []
  );

  const updateBoardMeta = useCallback(
    (updates: { name?: string; backgroundId?: BackgroundId }) => {
      dispatch({ type: "UPDATE_BOARD_META", updates });
    },
    []
  );

  // 計算済み状態
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  const selectedObjects = useMemo(() => {
    return state.selectedIndices
      .filter((i) => i >= 0 && i < state.board.objects.length)
      .map((i) => state.board.objects[i]);
  }, [state.selectedIndices, state.board.objects]);

  const value = useMemo<EditorContextValue>(
    () => ({
      state,
      dispatch,
      setBoard,
      selectObject,
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
      canUndo,
      canRedo,
      selectedObjects,
    }),
    [
      state,
      setBoard,
      selectObject,
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
      canUndo,
      canRedo,
      selectedObjects,
    ]
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}
