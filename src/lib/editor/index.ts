/**
 * エディターライブラリのエクスポート
 */

export { EditorProvider, useEditor } from "./EditorContext";
export type { EditorContextValue } from "./EditorContext";

export { editorReducer, createInitialState } from "./reducer";

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
} from "./types";

export { GRID_SIZES } from "./types";

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

export { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from "./useKeyboardShortcuts";

export { useImportExport } from "./useImportExport";
export type { ImportResult, UseImportExportReturn } from "./useImportExport";

export { useCanvasInteraction } from "./useCanvasInteraction";
export type {
  UseCanvasInteractionParams,
  UseCanvasInteractionReturn,
} from "./useCanvasInteraction";

export { rgbToHex, hexToRgb } from "./colorUtils";
