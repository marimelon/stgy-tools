/**
 * エディターライブラリのエクスポート
 */

export { EditorProvider, useEditor } from "./EditorContext";
export type { EditorContextValue } from "./EditorContext";

export {
	editorReducer,
	createInitialState,
	createInitialStateWithOptions,
} from "./reducer";
export type { CreateInitialStateOptions } from "./reducer";

export type {
	EditorState,
	EditorAction,
	HistoryEntry,
	BoardMetaUpdates,
	GridSettings,
	AlignmentType,
	ResizeHandle,
	HandleType,
	InteractionMode,
	DragState,
	MarqueeState,
	EditorBoardProps,
	ObjectGroup,
	BatchUpdatePayload,
} from "./types";

export { GRID_SIZES } from "./types";

export {
	MIXED_VALUE,
	isMixed,
	computeBatchPropertyValues,
	haveSameObjectId,
	getCommonFlipFlags,
} from "./batchUtils";
export type { MixedValue, BatchPropertyValues } from "./batchUtils";

export {
	createEmptyBoard,
	createDefaultObject,
	duplicateObject,
	calculateTextBoardSize,
	recalculateBoardSize,
} from "./factory";

export {
	screenToSVG,
	calculateRotation,
	clampToCanvas,
	snapToGrid,
	distance,
} from "./coordinates";

export {
	useKeyboardShortcuts,
	KEYBOARD_SHORTCUTS,
} from "./useKeyboardShortcuts";

export { useImportExport } from "./useImportExport";
export type { ImportResult, UseImportExportReturn } from "./useImportExport";

export { useCanvasInteraction } from "./useCanvasInteraction";
export type {
	UseCanvasInteractionParams,
	UseCanvasInteractionReturn,
} from "./useCanvasInteraction";

export {
	rgbToHex,
	hexToRgb,
	COLOR_PALETTE,
	COLOR_PALETTE_ROWS,
	COLOR_PALETTE_COLS,
} from "./colorUtils";

export { useDebugMode, getDebugMode, setDebugMode } from "./useDebugMode";
