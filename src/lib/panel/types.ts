/**
 * パネルレイアウト設定の型定義
 */

/** パネル識別子 */
export type PanelId =
	| "objectPalette"
	| "layerPanel"
	| "propertyPanel"
	| "historyPanel"
	| "assetPanel";

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
	/** 折りたたみ状態 */
	collapsed: boolean;
}

/** レイアウト全体設定 */
export interface PanelLayoutConfig {
	/** パネル設定 */
	panels: Record<PanelId, PanelConfig>;
}

/** デフォルトレイアウト */
export const DEFAULT_PANEL_LAYOUT: PanelLayoutConfig = {
	panels: {
		objectPalette: { slot: "left", order: 0, visible: true, collapsed: false },
		assetPanel: { slot: "left", order: 1, visible: true, collapsed: true },
		layerPanel: { slot: "right", order: 1, visible: true, collapsed: false },
		propertyPanel: { slot: "right", order: 0, visible: true, collapsed: false },
		historyPanel: { slot: "right", order: 2, visible: false, collapsed: false },
	},
};
