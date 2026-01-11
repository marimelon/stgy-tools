/**
 * PanelStore hooks
 */

import { shallow, useStore } from "@tanstack/react-store";
import { getPanelStore } from "../store/panelStore";
import type { PanelState } from "../store/types";
import type { PanelConfig, PanelId, PanelLayoutConfig } from "../types";

/**
 * Subscribe to a portion of the store using a selector
 */
export function usePanelSelector<T>(selector: (state: PanelState) => T): T {
	const store = getPanelStore();
	return useStore(store, selector);
}

/**
 * Use selector with shallow comparison (for arrays/objects)
 */
export function usePanelSelectorShallow<T>(
	selector: (state: PanelState) => T,
): T {
	const store = getPanelStore();
	return useStore(store, selector, { equal: shallow });
}

/**
 * Pre-defined selectors
 */
export const selectors = {
	/** All settings */
	config: (s: PanelState): PanelLayoutConfig => s,

	/** Panel settings map */
	panels: (s: PanelState): Record<PanelId, PanelConfig> => s.panels,

	/** Generate selector for specific panel settings */
	panel: (panelId: PanelId) => (s: PanelState) => s.panels[panelId],

	/** Visible panels in left slot */
	leftPanels: (s: PanelState): [PanelId, PanelConfig][] =>
		(Object.entries(s.panels) as [PanelId, PanelConfig][])
			.filter(([_, cfg]) => cfg.slot === "left" && cfg.visible)
			.sort(([_, a], [__, b]) => a.order - b.order),

	/** Visible panels in right slot */
	rightPanels: (s: PanelState): [PanelId, PanelConfig][] =>
		(Object.entries(s.panels) as [PanelId, PanelConfig][])
			.filter(([_, cfg]) => cfg.slot === "right" && cfg.visible)
			.sort(([_, a], [__, b]) => a.order - b.order),

	/** Hidden panels in left slot */
	leftHiddenPanels: (s: PanelState): [PanelId, PanelConfig][] =>
		(Object.entries(s.panels) as [PanelId, PanelConfig][])
			.filter(([_, cfg]) => cfg.slot === "left" && !cfg.visible)
			.sort(([_, a], [__, b]) => a.order - b.order),

	/** Hidden panels in right slot */
	rightHiddenPanels: (s: PanelState): [PanelId, PanelConfig][] =>
		(Object.entries(s.panels) as [PanelId, PanelConfig][])
			.filter(([_, cfg]) => cfg.slot === "right" && !cfg.visible)
			.sort(([_, a], [__, b]) => a.order - b.order),
} as const;

/** Get entire layout configuration */
export function useConfig(): PanelLayoutConfig {
	return usePanelSelector(selectors.config);
}

/** Get visible panels in left slot */
export function useLeftPanels(): [PanelId, PanelConfig][] {
	return usePanelSelectorShallow(selectors.leftPanels);
}

/** Get visible panels in right slot */
export function useRightPanels(): [PanelId, PanelConfig][] {
	return usePanelSelectorShallow(selectors.rightPanels);
}

/** Get hidden panels in left slot */
export function useLeftHiddenPanels(): [PanelId, PanelConfig][] {
	return usePanelSelectorShallow(selectors.leftHiddenPanels);
}

/** Get hidden panels in right slot */
export function useRightHiddenPanels(): [PanelId, PanelConfig][] {
	return usePanelSelectorShallow(selectors.rightHiddenPanels);
}
