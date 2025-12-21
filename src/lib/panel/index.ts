/**
 * パネルレイアウトライブラリのエクスポート
 */

export type { PanelContextValue } from "./PanelContext";
export { PanelProvider, usePanelLayout } from "./PanelContext";

export type {
	PanelConfig,
	PanelId,
	PanelLayoutConfig,
	PanelPreset,
	PanelSlot,
} from "./types";

export {
	DEFAULT_PANEL_LAYOUT,
	PANEL_NAMES,
	PANEL_PRESETS,
	PRESET_NAMES,
} from "./types";
