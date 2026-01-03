/**
 * Reducerハンドラーのエクスポート
 */

// 整列
export { handleAlignObjects } from "./handlers/alignment";
// 円形配置モード
export {
	handleEnterCircularMode,
	handleExitCircularMode,
	handleMoveObjectOnCircle,
	handleUpdateCircularCenter,
	handleUpdateCircularRadius,
} from "./handlers/circularMode";
// クリップボード
export {
	handleCopyObjects,
	handlePasteObjects,
} from "./handlers/clipboard";
// グループ・グリッド・フォーカス
export {
	handleGroupObjects,
	handleRemoveFromGroup,
	handleRenameGroup,
	handleSetFocusGroup,
	handleSetGridSettings,
	handleToggleGroupCollapse,
	handleUngroup,
} from "./handlers/group";
// 履歴・ボード
export {
	handleClearHistory,
	handleCommitHistory,
	handleJumpToHistory,
	handleRedo,
	handleSetBoard,
	handleUndo,
	handleUpdateBoardMeta,
} from "./handlers/history";
// レイヤー
export {
	handleMoveLayer,
	handleReorderGroup,
	handleReorderLayer,
	type LayerDirection,
} from "./handlers/layer";
// オブジェクト操作
export {
	handleAddObject,
	handleDeleteObjects,
	handleDuplicateObjects,
	handleMoveObjects,
	handleUpdateObject,
	handleUpdateObjectsBatch,
} from "./handlers/object";
// 選択系
export {
	handleDeselectAll,
	handleSelectObject,
	handleSelectObjects,
} from "./handlers/selection";
// テキスト編集
export {
	handleEndTextEdit,
	handleStartTextEdit,
} from "./handlers/textEdit";
// ユーティリティ
export {
	cloneBoard,
	findObjectById,
	findObjectIndex,
	generateGroupId,
	generateHistoryId,
	MAX_HISTORY,
	pushHistory,
	updateGroupsAfterDelete,
	updateObjectInBoard,
} from "./utils";
