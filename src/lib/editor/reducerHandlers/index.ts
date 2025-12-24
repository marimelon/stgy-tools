/**
 * Reducerハンドラーのエクスポート
 */

// 整列
export { handleAlignObjects } from "./alignment";
// クリップボード
export {
	handleCopyObjects,
	handlePasteObjects,
} from "./clipboard";
// グループ・グリッド
export {
	handleGroupObjects,
	handleRemoveFromGroup,
	handleSetGridSettings,
	handleToggleGroupCollapse,
	handleUngroup,
} from "./group";
// 履歴・ボード
export {
	handleClearHistory,
	handleCommitHistory,
	handleJumpToHistory,
	handleRedo,
	handleSetBoard,
	handleUndo,
	handleUpdateBoardMeta,
} from "./history";
// レイヤー
export {
	handleMoveLayer,
	handleReorderGroup,
	handleReorderLayer,
	type LayerDirection,
} from "./layer";
// オブジェクト操作
export {
	handleAddObject,
	handleDeleteObjects,
	handleDuplicateObjects,
	handleMoveObjects,
	handleUpdateObject,
	handleUpdateObjectsBatch,
} from "./object";
// 選択系
export {
	handleDeselectAll,
	handleSelectObject,
	handleSelectObjects,
} from "./selection";
// テキスト編集
export {
	handleEndTextEdit,
	handleStartTextEdit,
} from "./textEdit";
// ユーティリティ
export {
	cloneBoard,
	generateGroupId,
	generateHistoryId,
	MAX_HISTORY,
	pushHistory,
	shiftGroupIndices,
	updateGroupsAfterDelete,
	updateObjectInBoard,
} from "./utils";
