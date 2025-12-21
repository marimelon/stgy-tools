/**
 * エディター状態のReducer
 */

import type { BoardData, BoardObject } from "@/lib/stgy";
import { duplicateObject } from "./factory";
import type { EditorState, EditorAction, HistoryEntry } from "./types";

/** 履歴の最大保持数 */
const MAX_HISTORY = 50;

/**
 * 履歴エントリを追加
 */
function pushHistory(
  state: EditorState,
  description: string
): Pick<EditorState, "history" | "historyIndex" | "isDirty"> {
  // 現在位置以降の履歴を削除
  const newHistory = state.history.slice(0, state.historyIndex + 1);

  // 新しいエントリを追加
  const entry: HistoryEntry = {
    board: structuredClone(state.board),
    description,
  };
  newHistory.push(entry);

  // 履歴が多すぎる場合は古いものを削除
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }

  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
    isDirty: true,
  };
}

/**
 * ボードデータをディープコピー
 */
function cloneBoard(board: BoardData): BoardData {
  return structuredClone(board);
}

/**
 * オブジェクトを更新
 */
function updateObjectInBoard(
  board: BoardData,
  index: number,
  updates: Partial<BoardObject>
): BoardData {
  const newBoard = cloneBoard(board);
  if (index >= 0 && index < newBoard.objects.length) {
    newBoard.objects[index] = {
      ...newBoard.objects[index],
      ...updates,
      // ネストしたオブジェクトは個別にマージ
      flags: {
        ...newBoard.objects[index].flags,
        ...(updates.flags ?? {}),
      },
      color: {
        ...newBoard.objects[index].color,
        ...(updates.color ?? {}),
      },
      position: {
        ...newBoard.objects[index].position,
        ...(updates.position ?? {}),
      },
    };
  }
  return newBoard;
}

/**
 * エディターReducer
 */
export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "SET_BOARD": {
      return {
        ...state,
        board: action.board,
        selectedIndices: [],
        isDirty: false,
        history: [{ board: structuredClone(action.board), description: "初期状態" }],
        historyIndex: 0,
      };
    }

    case "SELECT_OBJECT": {
      if (action.additive) {
        // 追加選択モード (Ctrl/Cmd + クリック)
        const exists = state.selectedIndices.includes(action.index);
        return {
          ...state,
          selectedIndices: exists
            ? state.selectedIndices.filter((i) => i !== action.index)
            : [...state.selectedIndices, action.index],
        };
      }
      // 単一選択
      return {
        ...state,
        selectedIndices: [action.index],
      };
    }

    case "SELECT_OBJECTS": {
      return {
        ...state,
        selectedIndices: action.indices,
      };
    }

    case "DESELECT_ALL": {
      return {
        ...state,
        selectedIndices: [],
      };
    }

    case "UPDATE_OBJECT": {
      const newBoard = updateObjectInBoard(
        state.board,
        action.index,
        action.updates
      );
      return {
        ...state,
        board: newBoard,
        isDirty: true,
      };
    }

    case "ADD_OBJECT": {
      const newBoard = cloneBoard(state.board);
      newBoard.objects.push(action.object);
      const newIndex = newBoard.objects.length - 1;
      return {
        ...state,
        board: newBoard,
        selectedIndices: [newIndex],
        ...pushHistory(state, "オブジェクト追加"),
      };
    }

    case "DELETE_OBJECTS": {
      if (action.indices.length === 0) return state;

      const newBoard = cloneBoard(state.board);
      // インデックスを降順でソートして削除 (インデックスのずれを防ぐ)
      const sortedIndices = [...action.indices].sort((a, b) => b - a);
      for (const index of sortedIndices) {
        if (index >= 0 && index < newBoard.objects.length) {
          newBoard.objects.splice(index, 1);
        }
      }
      return {
        ...state,
        board: newBoard,
        selectedIndices: [],
        ...pushHistory(state, "オブジェクト削除"),
      };
    }

    case "DUPLICATE_OBJECTS": {
      if (action.indices.length === 0) return state;

      const newBoard = cloneBoard(state.board);
      const newIndices: number[] = [];

      for (const index of action.indices) {
        if (index >= 0 && index < state.board.objects.length) {
          const original = state.board.objects[index];
          const duplicated = duplicateObject(original);
          newBoard.objects.push(duplicated);
          newIndices.push(newBoard.objects.length - 1);
        }
      }

      return {
        ...state,
        board: newBoard,
        selectedIndices: newIndices,
        ...pushHistory(state, "オブジェクト複製"),
      };
    }

    case "COPY_OBJECTS": {
      if (state.selectedIndices.length === 0) return state;

      const copiedObjects = state.selectedIndices
        .filter((i) => i >= 0 && i < state.board.objects.length)
        .map((i) => structuredClone(state.board.objects[i]));

      return {
        ...state,
        clipboard: copiedObjects,
      };
    }

    case "PASTE_OBJECTS": {
      if (!state.clipboard || state.clipboard.length === 0) return state;

      const newBoard = cloneBoard(state.board);
      const newIndices: number[] = [];

      for (const obj of state.clipboard) {
        const pasted = structuredClone(obj);
        // 位置をオフセット
        if (action.position) {
          pasted.position = action.position;
        } else {
          pasted.position.x += 10;
          pasted.position.y += 10;
        }
        newBoard.objects.push(pasted);
        newIndices.push(newBoard.objects.length - 1);
      }

      return {
        ...state,
        board: newBoard,
        selectedIndices: newIndices,
        ...pushHistory(state, "オブジェクト貼り付け"),
      };
    }

    case "MOVE_OBJECTS": {
      if (action.indices.length === 0) return state;

      let newBoard = state.board;
      for (const index of action.indices) {
        if (index >= 0 && index < newBoard.objects.length) {
          const obj = newBoard.objects[index];
          newBoard = updateObjectInBoard(newBoard, index, {
            position: {
              x: obj.position.x + action.deltaX,
              y: obj.position.y + action.deltaY,
            },
          });
        }
      }

      return {
        ...state,
        board: newBoard,
        isDirty: true,
      };
    }

    case "COMMIT_HISTORY": {
      return {
        ...state,
        ...pushHistory(state, action.description),
      };
    }

    case "UPDATE_BOARD_META": {
      const newBoard = cloneBoard(state.board);
      if (action.updates.name !== undefined) {
        newBoard.name = action.updates.name;
      }
      if (action.updates.backgroundId !== undefined) {
        newBoard.backgroundId = action.updates.backgroundId;
      }
      return {
        ...state,
        board: newBoard,
        isDirty: true,
      };
    }

    case "UNDO": {
      if (state.historyIndex <= 0) return state;

      const newIndex = state.historyIndex - 1;
      const entry = state.history[newIndex];
      return {
        ...state,
        board: structuredClone(entry.board),
        historyIndex: newIndex,
        selectedIndices: [],
        isDirty: newIndex > 0,
      };
    }

    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;

      const newIndex = state.historyIndex + 1;
      const entry = state.history[newIndex];
      return {
        ...state,
        board: structuredClone(entry.board),
        historyIndex: newIndex,
        selectedIndices: [],
        isDirty: true,
      };
    }

    default:
      return state;
  }
}

/**
 * 初期状態を生成
 */
export function createInitialState(board: BoardData): EditorState {
  return {
    board: structuredClone(board),
    selectedIndices: [],
    clipboard: null,
    history: [{ board: structuredClone(board), description: "初期状態" }],
    historyIndex: 0,
    isDirty: false,
  };
}
