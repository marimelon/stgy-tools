/**
 * エディター状態管理の型定義
 */

import type {
	BackgroundId,
	BoardData,
	BoardObject,
	Color,
	ObjectFlags,
	Position,
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
	startPositions: Map<string, Position>;
	/** 操作中のハンドル */
	handle?: HandleType;
	/** 操作対象のオブジェクトID */
	objectId: string;
}

/** マーキー選択状態 */
export interface MarqueeState {
	/** 開始位置 */
	startPoint: Position;
	/** 現在位置 */
	currentPoint: Position;
}

/**
 * 円形配置モード状態
 * 円形配置実行後の編集モードで使用
 */
export interface CircularModeState {
	/** 円の中心位置 */
	center: Position;
	/** 円の半径 */
	radius: number;
	/** 参加オブジェクトのID */
	participatingIds: string[];
	/** 各オブジェクトの角度（id → angle in radians） */
	objectAngles: Map<string, number>;
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
	/** グループに含まれるオブジェクトのID */
	objectIds: string[];
	/** グループ名（オプション） */
	name?: string;
	/** 折りたたみ状態 */
	collapsed?: boolean;
}

/**
 * 履歴エントリ
 */
export interface HistoryEntry {
	/** 一意のID */
	id: string;
	/** ボードデータのスナップショット */
	board: BoardData;
	/** グループ情報のスナップショット */
	groups: ObjectGroup[];
	/** 操作の説明 */
	description: string;
}

/** 編集用オーバーレイグリッドのタイプ */
export type EditorOverlayType = "none" | "concentric" | "square";

/** 利用可能なオーバーレイタイプ */
export const EDITOR_OVERLAY_TYPES = ["none", "concentric", "square"] as const;

/** キャンバス背景色のプリセット */
export const CANVAS_COLORS = [
	{ id: "slate-900", color: "#0f172a", label: "Dark" },
	{ id: "slate-800", color: "#1e293b", label: "Default" },
	{ id: "slate-700", color: "#334155", label: "Gray" },
	{ id: "neutral-900", color: "#171717", label: "Black" },
	{ id: "green-950", color: "#052e16", label: "Green" },
	{ id: "blue-950", color: "#172554", label: "Blue" },
] as const;

export type CanvasColorId = (typeof CANVAS_COLORS)[number]["id"];

/** オーバーレイ色プリセット */
export const OVERLAY_COLORS = [
	{ id: "cyan", color: "100, 200, 255", label: "Cyan" },
	{ id: "red", color: "255, 100, 100", label: "Red" },
	{ id: "green", color: "100, 255, 100", label: "Green" },
	{ id: "yellow", color: "255, 255, 100", label: "Yellow" },
	{ id: "white", color: "255, 255, 255", label: "White" },
] as const;

export type OverlayColorId = (typeof OVERLAY_COLORS)[number]["id"];

/** 方眼グリッドサイズの選択肢 */
export const OVERLAY_GRID_SIZES = [16, 24, 32, 48, 64] as const;
export type OverlayGridSize = (typeof OVERLAY_GRID_SIZES)[number];

/**
 * オーバーレイ詳細設定
 */
export interface OverlaySettings {
	/** 同心円の数 (3-10) */
	circleCount: number;
	/** 方眼グリッドサイズ (px) */
	squareGridSize: OverlayGridSize;
	/** オーバーレイ色ID */
	colorId: OverlayColorId;
	/** 透明度 (20-100) */
	opacity: number;
	/** 中心点マーカーを表示 */
	showCenterMarker: boolean;
	/** ガイドライン（8方向）を表示 */
	showGuideLines: boolean;
	/** 外周枠を表示 */
	showBorder: boolean;
}

/** デフォルトのオーバーレイ設定 */
export const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
	circleCount: 5,
	squareGridSize: 32,
	colorId: "cyan",
	opacity: 40,
	showCenterMarker: true,
	showGuideLines: true,
	showBorder: true,
};

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
	/** 編集用オーバーレイグリッドのタイプ */
	overlayType: EditorOverlayType;
	/** 背景を表示 */
	showBackground: boolean;
	/** キャンバス背景色（背景非表示時） */
	canvasColor: CanvasColorId;
	/** オーバーレイ詳細設定 */
	overlaySettings: OverlaySettings;
}

/** 利用可能なグリッドサイズ */
export const GRID_SIZES = [8, 16, 32] as const;
export type GridSize = (typeof GRID_SIZES)[number];

/** 履歴の最大保持件数 */
export const MAX_HISTORY_SIZE = 50;

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
	| "distribute-v"
	| "circular";

/**
 * エラー情報
 */
export interface EditorError {
	/** 翻訳キー */
	key: string;
	/** 翻訳パラメータ */
	params?: Record<string, string | number>;
}

/**
 * エディター状態
 */
export interface EditorState {
	/** 現在のボードデータ */
	board: BoardData;
	/** 選択されているオブジェクトのID (複数選択対応) */
	selectedIds: string[];
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
	/** インライン編集中のテキストオブジェクトのID（null = 編集なし） */
	editingTextId: string | null;
	/** 最後のエラー（UIで表示後クリア） */
	lastError: EditorError | null;
	/** フォーカス中のグループID（null = フォーカスなし） */
	focusedGroupId: string | null;
	/** 円形配置モード状態（null = モード無効） */
	circularMode: CircularModeState | null;
}

/**
 * エディターアクション
 */
export type EditorAction =
	| { type: "SET_BOARD"; board: BoardData }
	| { type: "SELECT_OBJECT"; objectId: string; additive?: boolean }
	| { type: "SELECT_OBJECTS"; objectIds: string[] }
	| { type: "DESELECT_ALL" }
	| { type: "UPDATE_OBJECT"; objectId: string; updates: Partial<BoardObject> }
	| { type: "ADD_OBJECT"; object: BoardObject }
	| { type: "DELETE_OBJECTS"; objectIds: string[] }
	| { type: "DUPLICATE_OBJECTS"; objectIds: string[] }
	| { type: "COPY_OBJECTS" }
	| { type: "PASTE_OBJECTS"; position?: { x: number; y: number } }
	| { type: "UNDO" }
	| { type: "REDO" }
	| {
			type: "UPDATE_BOARD_META";
			updates: Partial<Pick<BoardData, "name" | "backgroundId">>;
	  }
	| {
			type: "MOVE_OBJECTS";
			objectIds: string[];
			deltaX: number;
			deltaY: number;
	  }
	| { type: "COMMIT_HISTORY"; description: string }
	| {
			type: "MOVE_LAYER";
			objectId: string;
			direction: "front" | "back" | "forward" | "backward";
	  }
	| { type: "GROUP_OBJECTS"; objectIds: string[] }
	| { type: "UNGROUP"; groupId: string }
	| { type: "RENAME_GROUP"; groupId: string; name: string }
	| { type: "TOGGLE_GROUP_COLLAPSE"; groupId: string }
	| { type: "SET_GRID_SETTINGS"; settings: Partial<GridSettings> }
	| { type: "ALIGN_OBJECTS"; objectIds: string[]; alignment: AlignmentType }
	| { type: "REORDER_LAYER"; fromIndex: number; toIndex: number }
	| { type: "REMOVE_FROM_GROUP"; objectId: string }
	| { type: "REORDER_GROUP"; groupId: string; toIndex: number }
	| {
			type: "UPDATE_OBJECTS_BATCH";
			objectIds: string[];
			updates: BatchUpdatePayload;
	  }
	| { type: "START_TEXT_EDIT"; objectId: string }
	| { type: "END_TEXT_EDIT"; save: boolean; text?: string }
	| { type: "JUMP_TO_HISTORY"; index: number }
	| { type: "CLEAR_HISTORY" }
	| { type: "SET_ERROR"; error: EditorError }
	| { type: "CLEAR_ERROR" }
	| { type: "SET_FOCUS_GROUP"; groupId: string | null }
	| {
			type: "ENTER_CIRCULAR_MODE";
			center: Position;
			radius: number;
			objectIds: string[];
	  }
	| { type: "EXIT_CIRCULAR_MODE" }
	| { type: "UPDATE_CIRCULAR_CENTER"; center: Position }
	| { type: "UPDATE_CIRCULAR_RADIUS"; radius: number }
	| { type: "MOVE_OBJECT_ON_CIRCLE"; objectId: string; angle: number };

/**
 * ボードメタデータ更新用の部分型
 */
export interface BoardMetaUpdates {
	name?: string;
	backgroundId?: BackgroundId;
}
