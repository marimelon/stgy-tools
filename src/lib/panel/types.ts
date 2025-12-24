/**
 * パネルレイアウト設定の型定義
 */

/** パネル識別子 */
export type PanelId =
	| "objectPalette"
	| "layerPanel"
	| "propertyPanel"
	| "historyPanel";

/** パネル配置スロット */
export type PanelSlot = "left" | "right";

/** パネル設定 */
export interface PanelConfig {
	/** 配置スロット */
	slot: PanelSlot;
	/** スロット内の順序 */
	order: number;
	/** 表示/非表示 */
	visible: boolean;
}

/** レイアウト全体設定 */
export interface PanelLayoutConfig {
	/** パネル設定 */
	panels: Record<PanelId, PanelConfig>;
}

/** パネルプリセット名 */
export type PanelPreset = "default" | "propertyLeft" | "allLeft" | "allRight";

/** デフォルトレイアウト */
export const DEFAULT_PANEL_LAYOUT: PanelLayoutConfig = {
	panels: {
		objectPalette: { slot: "left", order: 0, visible: true },
		layerPanel: { slot: "right", order: 1, visible: true },
		propertyPanel: { slot: "right", order: 0, visible: true },
		historyPanel: { slot: "right", order: 2, visible: false },
	},
};

/** プリセット定義 */
export const PANEL_PRESETS: Record<PanelPreset, PanelLayoutConfig> = {
	default: DEFAULT_PANEL_LAYOUT,
	propertyLeft: {
		panels: {
			propertyPanel: { slot: "left", order: 0, visible: true },
			objectPalette: { slot: "right", order: 0, visible: true },
			layerPanel: { slot: "right", order: 1, visible: true },
			historyPanel: { slot: "right", order: 2, visible: false },
		},
	},
	allLeft: {
		panels: {
			objectPalette: { slot: "left", order: 0, visible: true },
			layerPanel: { slot: "left", order: 1, visible: true },
			propertyPanel: { slot: "left", order: 2, visible: true },
			historyPanel: { slot: "left", order: 3, visible: false },
		},
	},
	allRight: {
		panels: {
			objectPalette: { slot: "right", order: 0, visible: true },
			layerPanel: { slot: "right", order: 1, visible: true },
			propertyPanel: { slot: "right", order: 2, visible: true },
			historyPanel: { slot: "right", order: 3, visible: false },
		},
	},
};

/** パネル表示名 */
export const PANEL_NAMES: Record<PanelId, string> = {
	objectPalette: "オブジェクトパレット",
	layerPanel: "レイヤーパネル",
	propertyPanel: "プロパティパネル",
	historyPanel: "履歴パネル",
};

/** プリセット表示名 */
export const PRESET_NAMES: Record<PanelPreset, string> = {
	default: "デフォルト",
	propertyLeft: "プロパティ左配置",
	allLeft: "全て左",
	allRight: "全て右",
};
