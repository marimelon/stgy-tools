/**
 * Panel layout constants
 */

export const SIDEBAR_CONFIG = {
	LEFT_DEFAULT_SIZE: "20%",
	LEFT_MIN_SIZE: "150px",
	RIGHT_DEFAULT_SIZE: "22%",
	RIGHT_MIN_SIZE: "200px",
	MAX_SIZE: "50%",
} as const;

export const CENTER_PANEL_CONFIG = {
	MIN_SIZE: "20%",
} as const;

export const PANEL_CONFIG = {
	MIN_SIZE_PERCENT: 10,
} as const;

export const RESIZE_HANDLE_STYLES = {
	HORIZONTAL:
		"w-1 bg-slate-700 hover:bg-cyan-500 transition-colors cursor-col-resize",
	VERTICAL:
		"h-1 bg-slate-700 hover:bg-cyan-500 transition-colors cursor-row-resize flex-shrink-0",
} as const;
