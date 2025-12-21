/**
 * オブジェクト操作ハンドラー
 */

import type { BoardObject } from "@/lib/stgy";
import { duplicateObject } from "../factory";
import type { EditorState } from "../types";
import {
  cloneBoard,
  updateObjectInBoard,
  pushHistory,
  shiftGroupIndices,
  updateGroupsAfterDelete,
} from "./utils";

/**
 * オブジェクトを更新
 */
export function handleUpdateObject(
  state: EditorState,
  payload: { index: number; updates: Partial<BoardObject> }
): EditorState {
  const newBoard = updateObjectInBoard(state.board, payload.index, payload.updates);
  return {
    ...state,
    board: newBoard,
    isDirty: true,
  };
}

/**
 * オブジェクトを追加
 */
export function handleAddObject(
  state: EditorState,
  payload: { object: BoardObject }
): EditorState {
  const newBoard = cloneBoard(state.board);
  newBoard.objects.unshift(payload.object);
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

/**
 * オブジェクトを削除
 */
export function handleDeleteObjects(
  state: EditorState,
  payload: { indices: number[] }
): EditorState {
  if (payload.indices.length === 0) return state;

  const newBoard = cloneBoard(state.board);
  // インデックスを降順でソートして削除 (インデックスのずれを防ぐ)
  const sortedIndices = [...payload.indices].sort((a, b) => b - a);
  for (const index of sortedIndices) {
    if (index >= 0 && index < newBoard.objects.length) {
      newBoard.objects.splice(index, 1);
    }
  }
  // グループを更新
  const updatedGroups = updateGroupsAfterDelete(state.groups, payload.indices);
  return {
    ...state,
    board: newBoard,
    groups: updatedGroups,
    selectedIndices: [],
    ...pushHistory({ ...state, groups: updatedGroups }, "オブジェクト削除"),
  };
}

/**
 * オブジェクトを複製
 */
export function handleDuplicateObjects(
  state: EditorState,
  payload: { indices: number[] }
): EditorState {
  if (payload.indices.length === 0) return state;

  const newBoard = cloneBoard(state.board);
  const newIndices: number[] = [];

  for (const index of payload.indices) {
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

/**
 * オブジェクトを移動
 */
export function handleMoveObjects(
  state: EditorState,
  payload: { indices: number[]; deltaX: number; deltaY: number }
): EditorState {
  if (payload.indices.length === 0) return state;

  let newBoard = state.board;
  for (const index of payload.indices) {
    if (index >= 0 && index < newBoard.objects.length) {
      const obj = newBoard.objects[index];
      newBoard = updateObjectInBoard(newBoard, index, {
        position: {
          x: obj.position.x + payload.deltaX,
          y: obj.position.y + payload.deltaY,
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
