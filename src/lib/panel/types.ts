/**
 * Panel layout configuration type definitions
 */

/** Panel identifier */
export type PanelId =
	| "objectPalette"
	| "layerPanel"
	| "propertyPanel"
	| "historyPanel"
	| "assetPanel"
	| "debugPanel";

/** Panel placement slot */
export type PanelSlot = "left" | "right";

/** Panel configuration */
export interface PanelConfig {
	/** Placement slot */
	slot: PanelSlot;
	/** Order within slot */
	order: number;
	/** Visible/hidden */
	visible: boolean;
	/** Collapsed state */
	collapsed: boolean;
}

/** Overall layout configuration */
export interface PanelLayoutConfig {
	/** Panel configurations */
	panels: Record<PanelId, PanelConfig>;
}

/** Default layout */
export const DEFAULT_PANEL_LAYOUT: PanelLayoutConfig = {
	panels: {
		objectPalette: { slot: "left", order: 0, visible: true, collapsed: false },
		assetPanel: { slot: "left", order: 1, visible: true, collapsed: true },
		layerPanel: { slot: "right", order: 1, visible: true, collapsed: false },
		propertyPanel: { slot: "right", order: 0, visible: true, collapsed: false },
		historyPanel: { slot: "right", order: 2, visible: false, collapsed: false },
		debugPanel: { slot: "right", order: 3, visible: false, collapsed: false },
	},
};
