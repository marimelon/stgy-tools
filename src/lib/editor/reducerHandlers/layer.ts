/**
 * レイヤー操作ハンドラー
 */

import type { EditorState } from "../types";
import { cloneBoard, pushHistory } from "./utils";

/** レイヤー移動方向 */
export type LayerDirection = "front" | "back" | "forward" | "backward";

/**
 * レイヤーを移動
 */
export function handleMoveLayer(
  state: EditorState,
  payload: { index: number; direction: LayerDirection }
): EditorState {
  const { index, direction } = payload;
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

  const descriptions: Record<LayerDirection, string> = {
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
