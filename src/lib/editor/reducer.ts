/**
 * エディター状態のReducer
 */

import type { BoardData, BoardObject } from "@/lib/stgy";
import { duplicateObject } from "./factory";
import type { EditorState, EditorAction, HistoryEntry, ObjectGroup } from "./types";

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
    groups: structuredClone(state.groups),
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
 * グループIDを生成
 */
function generateGroupId(): string {
  return `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * オブジェクト追加時にグループのインデックスを更新（先頭追加）
 */
function shiftGroupIndices(groups: ObjectGroup[], count: number): ObjectGroup[] {
  return groups.map(group => ({
    ...group,
    objectIndices: group.objectIndices.map(i => i + count),
  }));
}

/**
 * オブジェクト削除時にグループを更新
 */
function updateGroupsAfterDelete(groups: ObjectGroup[], deletedIndices: number[]): ObjectGroup[] {
  const sortedDeleted = [...deletedIndices].sort((a, b) => b - a);

  return groups
    .map(group => {
      let newIndices = group.objectIndices.filter(i => !deletedIndices.includes(i));

      // 削除されたインデックスより大きいインデックスを調整
      for (const deleted of sortedDeleted) {
        newIndices = newIndices.map(i => i > deleted ? i - 1 : i);
      }

      return {
        ...group,
        objectIndices: newIndices,
      };
    })
    .filter(group => group.objectIndices.length > 0); // 空のグループを削除
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
        groups: [],
        isDirty: false,
        history: [{ board: structuredClone(action.board), groups: [], description: "初期状態" }],
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
      newBoard.objects.unshift(action.object);
      // グループのインデックスを更新（先頭に追加するので全て+1）
      const updatedGroups = shiftGroupIndices(state.groups, 1);
      return {
        ...state,
        board: newBoard,
        groups: updatedGroups,
        selectedIndices: [0],
        ...pushHistory({ ...state, groups: updatedGroups }, "オブジェクト追加"),
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
      // グループを更新
      const updatedGroups = updateGroupsAfterDelete(state.groups, action.indices);
      return {
        ...state,
        board: newBoard,
        groups: updatedGroups,
        selectedIndices: [],
        ...pushHistory({ ...state, groups: updatedGroups }, "オブジェクト削除"),
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
        groups: structuredClone(entry.groups ?? []),
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
        groups: structuredClone(entry.groups ?? []),
        historyIndex: newIndex,
        selectedIndices: [],
        isDirty: true,
      };
    }

    case "MOVE_LAYER": {
      const { index, direction } = action;
      const objects = state.board.objects;

      // 範囲外チェック
      if (index < 0 || index >= objects.length) return state;

      const newBoard = cloneBoard(state.board);
      const [movedObject] = newBoard.objects.splice(index, 1);

      let newIndex: number;
      switch (direction) {
        case "front":
          // 最前面（配列の先頭）
          newIndex = 0;
          break;
        case "back":
          // 最背面（配列の末尾）
          newIndex = newBoard.objects.length;
          break;
        case "forward":
          // 1つ前面へ（配列で前へ）
          newIndex = Math.max(0, index - 1);
          break;
        case "backward":
          // 1つ背面へ（配列で後ろへ）
          newIndex = Math.min(newBoard.objects.length, index + 1);
          break;
      }

      newBoard.objects.splice(newIndex, 0, movedObject);

      // グループのインデックスを更新
      const updatedGroups = state.groups.map(group => ({
        ...group,
        objectIndices: group.objectIndices.map(i => {
          if (i === index) return newIndex;
          if (index < newIndex) {
            // 下に移動: index+1 ~ newIndex の範囲を -1
            if (i > index && i <= newIndex) return i - 1;
          } else {
            // 上に移動: newIndex ~ index-1 の範囲を +1
            if (i >= newIndex && i < index) return i + 1;
          }
          return i;
        }),
      }));

      const descriptions: Record<typeof direction, string> = {
        front: "最前面へ移動",
        back: "最背面へ移動",
        forward: "前面へ移動",
        backward: "背面へ移動",
      };

      return {
        ...state,
        board: newBoard,
        groups: updatedGroups,
        selectedIndices: [newIndex],
        ...pushHistory({ ...state, groups: updatedGroups }, descriptions[direction]),
      };
    }

    case "GROUP_OBJECTS": {
      if (action.indices.length < 2) return state;

      const newGroup: ObjectGroup = {
        id: generateGroupId(),
        objectIndices: [...action.indices].sort((a, b) => a - b),
      };

      const newGroups = [...state.groups, newGroup];

      return {
        ...state,
        groups: newGroups,
        ...pushHistory({ ...state, groups: newGroups }, "グループ化"),
      };
    }

    case "UNGROUP": {
      const newGroups = state.groups.filter(g => g.id !== action.groupId);

      return {
        ...state,
        groups: newGroups,
        ...pushHistory({ ...state, groups: newGroups }, "グループ解除"),
      };
    }

    case "TOGGLE_GROUP_COLLAPSE": {
      const newGroups = state.groups.map(g =>
        g.id === action.groupId ? { ...g, collapsed: !g.collapsed } : g
      );

      return {
        ...state,
        groups: newGroups,
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
    groups: [],
    history: [{ board: structuredClone(board), groups: [], description: "初期状態" }],
    historyIndex: 0,
    isDirty: false,
  };
}
