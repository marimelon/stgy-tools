/**
 * エディターライブラリのエクスポート
 */

export type { BatchPropertyValues, MixedValue } from "./batchUtils";
export {
	computeBatchPropertyValues,
	getCommonFlipFlags,
	haveSameObjectId,
	isMixed,
	MIXED_VALUE,
} from "./batchUtils";
export {
	COLOR_PALETTE,
	COLOR_PALETTE_COLS,
	COLOR_PALETTE_ROWS,
	hexToRgb,
	rgbToHex,
} from "./colorUtils";
export {
	calculateRotation,
	clampToCanvas,
	distance,
	screenToSVG,
	snapToGrid,
} from "./coordinates";
export type { EditorContextValue } from "./EditorContext";
export { EditorProvider, useEditor } from "./EditorContext";
export {
	calculateTextBoardSize,
	createDefaultObject,
	createEmptyBoard,
	duplicateObject,
	recalculateBoardSize,
} from "./factory";
export type { CreateInitialStateOptions } from "./reducer";
export {
	createInitialState,
	createInitialStateWithOptions,
	editorReducer,
} from "./reducer";
export type {
	AlignmentType,
	BatchUpdatePayload,
	BoardMetaUpdates,
	DragState,
	EditorAction,
	EditorBoardProps,
	EditorState,
	GridSettings,
	HandleType,
	HistoryEntry,
	InteractionMode,
	MarqueeState,
	ObjectGroup,
	ResizeHandle,
} from "./types";
export { GRID_SIZES } from "./types";
export type {
	UseCanvasInteractionParams,
	UseCanvasInteractionReturn,
} from "./useCanvasInteraction";
export { useCanvasInteraction } from "./useCanvasInteraction";
export { getDebugMode, setDebugMode, useDebugMode } from "./useDebugMode";
export type { ImportResult, UseImportExportReturn } from "./useImportExport";
export { useImportExport } from "./useImportExport";
export {
	KEYBOARD_SHORTCUTS,
	useKeyboardShortcuts,
} from "./useKeyboardShortcuts";
