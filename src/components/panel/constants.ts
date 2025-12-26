/**
 * パネルレイアウト関連の定数
 */

/** サイドバー設定 */
export const SIDEBAR_CONFIG = {
	/** 左サイドバーのデフォルトサイズ */
	LEFT_DEFAULT_SIZE: "20%",
	/** 左サイドバーの最小サイズ */
	LEFT_MIN_SIZE: "150px",
	/** 右サイドバーのデフォルトサイズ */
	RIGHT_DEFAULT_SIZE: "22%",
	/** 右サイドバーの最小サイズ */
	RIGHT_MIN_SIZE: "200px",
	/** サイドバーの最大サイズ */
	MAX_SIZE: "50%",
} as const;

/** 中央パネル設定 */
export const CENTER_PANEL_CONFIG = {
	/** 最小サイズ */
	MIN_SIZE: "20%",
} as const;

/** サイドバー内パネル設定 */
export const PANEL_CONFIG = {
	/** パネルの最小サイズ（%） */
	MIN_SIZE_PERCENT: 10,
} as const;

/** リサイズハンドルのスタイル */
export const RESIZE_HANDLE_STYLES = {
	/** 水平リサイズハンドル（サイドバー間） */
	HORIZONTAL:
		"w-1 bg-slate-700 hover:bg-cyan-500 transition-colors cursor-col-resize",
	/** 垂直リサイズハンドル（パネル間） */
	VERTICAL:
		"h-1 bg-slate-700 hover:bg-cyan-500 transition-colors cursor-row-resize flex-shrink-0",
} as const;
