/**
 * Reducerハンドラーのエクスポート
 */

// ユーティリティ
export {
  MAX_HISTORY,
  pushHistory,
  generateGroupId,
  shiftGroupIndices,
  updateGroupsAfterDelete,
  cloneBoard,
  updateObjectInBoard,
} from "./utils";

// 選択系
export {
  handleSelectObject,
  handleSelectObjects,
  handleDeselectAll,
} from "./selection";

// オブジェクト操作
export {
  handleUpdateObject,
  handleAddObject,
  handleDeleteObjects,
  handleDuplicateObjects,
  handleMoveObjects,
} from "./object";

// クリップボード
export {
  handleCopyObjects,
  handlePasteObjects,
} from "./clipboard";

// 履歴・ボード
export {
  handleSetBoard,
  handleUpdateBoardMeta,
  handleCommitHistory,
  handleUndo,
  handleRedo,
} from "./history";

// レイヤー
export {
  handleMoveLayer,
  type LayerDirection,
} from "./layer";

// グループ・グリッド
export {
  handleGroupObjects,
  handleUngroup,
  handleToggleGroupCollapse,
  handleSetGridSettings,
} from "./group";

// 整列
export {
  handleAlignObjects,
} from "./alignment";
