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

// TanStack Store Provider
export {
	EditorStoreProvider,
	useEditorStoreContext,
} from "./EditorStoreProvider";
export {
	calculateTextBoardSize,
	createDefaultObject,
	createEmptyBoard,
	duplicateObject,
	recalculateBoardSize,
} from "./factory";
export type { EditorActions } from "./hooks/useEditorActions";
// Actions Hook
export { useEditorActions } from "./hooks/useEditorActions";

// Derived Hooks
export {
	useCanAlign,
	useCanGroup,
	useCanRedo,
	useCanUndo,
	useCircularModeDerived,
	useCircularModeState,
	useFocusedGroup,
	useFocusModeDerived,
	useHistoryCapabilities,
	useIsCircularMode,
	useIsFocusMode,
	useSelectedGroup,
	useSelectedObjects,
	useSelectionDerived,
} from "./hooks/useEditorDerived";
// Store Hooks
export {
	selectors,
	useBoard,
	useCircularMode,
	useClipboard,
	useEditingTextIndex,
	useEditorSelector,
	useEditorSelectorShallow,
	useEditorState,
	useFocusedGroupId,
	useGridSettings,
	useGroups,
	useHistory,
	useIsDirty,
	useLastError,
	useObjects,
	useSelectedIndices,
} from "./hooks/useEditorStore";
export type { CreateInitialStateOptions } from "./reducer";
export {
	createInitialState,
	createInitialStateWithOptions,
	editorReducer,
} from "./reducer";
export type { ValidationResult } from "./reducerHandlers/businessLogic/validation";
export { canAddObjects } from "./reducerHandlers/businessLogic/validation";
// Store
export {
	createEditorStore,
	getEditorStore,
	getEditorStoreSafe,
	isEditorStoreInitialized,
	resetEditorStore,
} from "./store/editorStore";
export type { EditorStore, EditorStoreOptions } from "./store/types";
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
export { useObjectPaletteState } from "./useObjectPaletteState";
