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
} from "./types";

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
