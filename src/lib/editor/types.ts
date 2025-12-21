/**
 * エディター状態管理の型定義
 */

import type { BoardData, BoardObject, BackgroundId } from "@/lib/stgy";

/**
 * オブジェクトグループ
 */
export interface ObjectGroup {
  /** グループID */
  id: string;
  /** グループに含まれるオブジェクトのインデックス */
  objectIndices: number[];
  /** グループ名（オプション） */
  name?: string;
  /** 折りたたみ状態 */
  collapsed?: boolean;
}

/**
 * 履歴エントリ
 */
export interface HistoryEntry {
  /** ボードデータのスナップショット */
  board: BoardData;
  /** グループ情報のスナップショット */
  groups: ObjectGroup[];
  /** 操作の説明 */
  description: string;
}

/**
 * エディター状態
 */
export interface EditorState {
  /** 現在のボードデータ */
  board: BoardData;
  /** 選択されているオブジェクトのインデックス (複数選択対応) */
  selectedIndices: number[];
  /** クリップボード (コピー/カット用) */
  clipboard: BoardObject[] | null;
  /** オブジェクトグループ */
  groups: ObjectGroup[];
  /** 履歴 */
  history: HistoryEntry[];
  /** 履歴の現在位置 */
  historyIndex: number;
  /** 変更があるかどうか */
  isDirty: boolean;
}

/**
 * エディターアクション
 */
export type EditorAction =
  | { type: "SET_BOARD"; board: BoardData }
  | { type: "SELECT_OBJECT"; index: number; additive?: boolean }
  | { type: "SELECT_OBJECTS"; indices: number[] }
  | { type: "DESELECT_ALL" }
  | { type: "UPDATE_OBJECT"; index: number; updates: Partial<BoardObject> }
  | { type: "ADD_OBJECT"; object: BoardObject }
  | { type: "DELETE_OBJECTS"; indices: number[] }
  | { type: "DUPLICATE_OBJECTS"; indices: number[] }
  | { type: "COPY_OBJECTS" }
  | { type: "PASTE_OBJECTS"; position?: { x: number; y: number } }
  | { type: "UNDO" }
  | { type: "REDO" }
  | {
      type: "UPDATE_BOARD_META";
      updates: Partial<Pick<BoardData, "name" | "backgroundId">>;
    }
  | { type: "MOVE_OBJECTS"; indices: number[]; deltaX: number; deltaY: number }
  | { type: "COMMIT_HISTORY"; description: string }
  | { type: "MOVE_LAYER"; index: number; direction: "front" | "back" | "forward" | "backward" }
  | { type: "GROUP_OBJECTS"; indices: number[] }
  | { type: "UNGROUP"; groupId: string }
  | { type: "TOGGLE_GROUP_COLLAPSE"; groupId: string };

/**
 * ボードメタデータ更新用の部分型
 */
export interface BoardMetaUpdates {
  name?: string;
  backgroundId?: BackgroundId;
}
