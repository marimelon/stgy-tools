/**
 * エディター状態管理の型定義
 */

import type {
	BoardData,
	BoardObject,
	BackgroundId,
	Position,
	Color,
	ObjectFlags,
} from "@/lib/stgy";

// ============================================
// インタラクション関連の型
// ============================================

/** リサイズハンドルの位置 */
export type ResizeHandle = "nw" | "ne" | "sw" | "se";

/** ハンドルの種類 */
export type HandleType = ResizeHandle | "rotate";

/** インタラクションモード */
export type InteractionMode = "none" | "drag" | "rotate" | "resize" | "marquee";

/** ドラッグ状態 */
export interface DragState {
	/** 現在のモード */
	mode: InteractionMode;
	/** ドラッグ開始時のポインター位置 */
	startPointer: Position;
	/** ドラッグ開始時のオブジェクト状態 */
	startObjectState: BoardObject;
	/** 選択中の全オブジェクトの初期位置（グリッドスナップ用） */
	startPositions: Map<number, Position>;
	/** 操作中のハンドル */
	handle?: HandleType;
	/** 操作対象のオブジェクトインデックス */
	objectIndex: number;
}

/** マーキー選択状態 */
export interface MarqueeState {
	/** 開始位置 */
	startPoint: Position;
	/** 現在位置 */
	currentPoint: Position;
}

// ============================================
// コンポーネントProps
// ============================================

/** EditorBoardコンポーネントのProps */
export interface EditorBoardProps {
	/** 表示スケール */
	scale?: number;
}

// ============================================
// グループ・履歴関連の型
// ============================================

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
 * グリッド設定
 */
export interface GridSettings {
	/** グリッドスナップ有効 */
	enabled: boolean;
	/** グリッドサイズ (px) */
	size: number;
	/** グリッド線を表示 */
	showGrid: boolean;
}

/** 利用可能なグリッドサイズ */
export const GRID_SIZES = [8, 16, 32] as const;
export type GridSize = (typeof GRID_SIZES)[number];

// ============================================
// バッチ更新関連の型
// ============================================

/**
 * バッチ更新ペイロード
 * 複数オブジェクトに適用する更新内容（指定されたプロパティのみ更新）
 */
export interface BatchUpdatePayload {
	rotation?: number;
	size?: number;
	color?: Partial<Color>;
	flags?: Partial<ObjectFlags>;
	param1?: number;
	param2?: number;
	param3?: number;
}

/** 整列タイプ */
export type AlignmentType =
	| "left"
	| "center"
	| "right"
	| "top"
	| "middle"
	| "bottom"
	| "distribute-h"
	| "distribute-v";

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
	/** グリッド設定 */
	gridSettings: GridSettings;
	/** 履歴 */
	history: HistoryEntry[];
	/** 履歴の現在位置 */
	historyIndex: number;
	/** 変更があるかどうか */
	isDirty: boolean;
	/** インライン編集中のテキストオブジェクトのインデックス（null = 編集なし） */
	editingTextIndex: number | null;
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
	| {
			type: "MOVE_LAYER";
			index: number;
			direction: "front" | "back" | "forward" | "backward";
	  }
	| { type: "GROUP_OBJECTS"; indices: number[] }
	| { type: "UNGROUP"; groupId: string }
	| { type: "TOGGLE_GROUP_COLLAPSE"; groupId: string }
	| { type: "SET_GRID_SETTINGS"; settings: Partial<GridSettings> }
	| { type: "ALIGN_OBJECTS"; indices: number[]; alignment: AlignmentType }
	| { type: "REORDER_LAYER"; fromIndex: number; toIndex: number }
	| { type: "REMOVE_FROM_GROUP"; objectIndex: number }
	| { type: "REORDER_GROUP"; groupId: string; toIndex: number }
	| {
			type: "UPDATE_OBJECTS_BATCH";
			indices: number[];
			updates: BatchUpdatePayload;
	  }
	| { type: "START_TEXT_EDIT"; index: number }
	| { type: "END_TEXT_EDIT"; save: boolean; text?: string };

/**
 * ボードメタデータ更新用の部分型
 */
export interface BoardMetaUpdates {
	name?: string;
	backgroundId?: BackgroundId;
}
