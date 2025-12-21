/**
 * エディター状態のReducer
 */

import type { BoardData } from "@/lib/stgy";
import type { EditorState, EditorAction } from "./types";
import {
  // 選択系
  handleSelectObject,
  handleSelectObjects,
  handleDeselectAll,
  // オブジェクト操作
  handleUpdateObject,
  handleAddObject,
  handleDeleteObjects,
  handleDuplicateObjects,
  handleMoveObjects,
  // クリップボード
  handleCopyObjects,
  handlePasteObjects,
  // 履歴・ボード
  handleSetBoard,
  handleUpdateBoardMeta,
  handleCommitHistory,
  handleUndo,
  handleRedo,
  // レイヤー
  handleMoveLayer,
  // グループ・グリッド
  handleGroupObjects,
  handleUngroup,
  handleToggleGroupCollapse,
  handleSetGridSettings,
  // 整列
  handleAlignObjects,
} from "./reducerHandlers";

/**
 * エディターReducer
 */
export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "SET_BOARD":
      return handleSetBoard(state, { board: action.board });

    case "SELECT_OBJECT":
      return handleSelectObject(state, { index: action.index, additive: action.additive });

    case "SELECT_OBJECTS":
      return handleSelectObjects(state, { indices: action.indices });

    case "DESELECT_ALL":
      return handleDeselectAll(state);

    case "UPDATE_OBJECT":
      return handleUpdateObject(state, { index: action.index, updates: action.updates });

    case "ADD_OBJECT":
      return handleAddObject(state, { object: action.object });

    case "DELETE_OBJECTS":
      return handleDeleteObjects(state, { indices: action.indices });

    case "DUPLICATE_OBJECTS":
      return handleDuplicateObjects(state, { indices: action.indices });

    case "COPY_OBJECTS":
      return handleCopyObjects(state);

    case "PASTE_OBJECTS":
      return handlePasteObjects(state, { position: action.position });

    case "MOVE_OBJECTS":
      return handleMoveObjects(state, {
        indices: action.indices,
        deltaX: action.deltaX,
        deltaY: action.deltaY,
      });

    case "COMMIT_HISTORY":
      return handleCommitHistory(state, { description: action.description });

    case "UPDATE_BOARD_META":
      return handleUpdateBoardMeta(state, { updates: action.updates });

    case "UNDO":
      return handleUndo(state);

    case "REDO":
      return handleRedo(state);

    case "MOVE_LAYER":
      return handleMoveLayer(state, { index: action.index, direction: action.direction });

    case "GROUP_OBJECTS":
      return handleGroupObjects(state, { indices: action.indices });

    case "UNGROUP":
      return handleUngroup(state, { groupId: action.groupId });

    case "TOGGLE_GROUP_COLLAPSE":
      return handleToggleGroupCollapse(state, { groupId: action.groupId });

    case "SET_GRID_SETTINGS":
      return handleSetGridSettings(state, { settings: action.settings });

    case "ALIGN_OBJECTS":
      return handleAlignObjects(state, { indices: action.indices, alignment: action.alignment });

    default:
      return state;
  }
}

/** デフォルトのグリッド設定 */
const DEFAULT_GRID_SETTINGS = {
  enabled: false,
  size: 16,
  showGrid: false,
};

/**
 * 初期状態を生成
 */
export function createInitialState(board: BoardData): EditorState {
  return {
    board: structuredClone(board),
    selectedIndices: [],
    clipboard: null,
    groups: [],
    gridSettings: { ...DEFAULT_GRID_SETTINGS },
    history: [{ board: structuredClone(board), groups: [], description: "初期状態" }],
    historyIndex: 0,
    isDirty: false,
  };
}
