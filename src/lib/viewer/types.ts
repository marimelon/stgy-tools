import type { BoardData, BoardObject } from "@/lib/stgy";

/**
 * Viewer画面で管理する個別ボード
 */
export interface ViewerBoard {
	/** クライアント側ID (nanoid) */
	id: string;
	/** 元のstgyコード */
	stgyCode: string;
	/** デコード済みボードデータ (デコード失敗時はnull) */
	boardData: BoardData | null;
	/** デコードエラーメッセージ (成功時はnull) */
	error: string | null;
	/** 表示名 */
	name: string;
}

/**
 * Viewerの表示モード
 */
export type ViewerMode = "tab" | "grid";

/**
 * Viewer全体の状態
 */
export interface ViewerState {
	/** 読み込まれた全ボード */
	boards: ViewerBoard[];
	/** アクティブなボードID (タブモード用) */
	activeId: string | null;
	/** 表示モード */
	viewMode: ViewerMode;
	/** 選択中のオブジェクトID (ボードIDごと) */
	selectedObjectIds: Record<string, string | null>;
}

/**
 * アクティブなボードの選択オブジェクト情報
 */
export interface ActiveBoardSelection {
	objectId: string | null;
	object: BoardObject | null;
}

/**
 * Viewerストアの初期状態
 */
export const initialViewerState: ViewerState = {
	boards: [],
	activeId: null,
	viewMode: "tab",
	selectedObjectIds: {},
};

/**
 * ボード数の上限
 */
export const MAX_BOARDS = 30;
