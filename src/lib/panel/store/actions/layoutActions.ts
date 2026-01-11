/**
 * Panel layout actions
 */

import type { PanelConfig, PanelId, PanelSlot } from "../../types";
import { DEFAULT_PANEL_LAYOUT } from "../../types";
import type { PanelStore } from "../types";

/**
 * Create layout actions
 */
export function createLayoutActions(store: PanelStore) {
	/**
	 * Change panel slot
	 */
	const updatePanelSlot = (panelId: PanelId, slot: PanelSlot) => {
		store.setState((state) => {
			// Get max order of existing panels in the same slot
			const existingPanelsInSlot = Object.entries(state.panels).filter(
				([id, cfg]) => id !== panelId && cfg.slot === slot,
			);
			const maxOrder =
				existingPanelsInSlot.length > 0
					? Math.max(...existingPanelsInSlot.map(([_, cfg]) => cfg.order))
					: -1;

			return {
				...state,
				panels: {
					...state.panels,
					[panelId]: {
						...state.panels[panelId],
						slot,
						order: maxOrder + 1,
					},
				},
			};
		});
	};

	/**
	 * Toggle panel visibility
	 */
	const togglePanelVisibility = (panelId: PanelId) => {
		store.setState((state) => ({
			...state,
			panels: {
				...state.panels,
				[panelId]: {
					...state.panels[panelId],
					visible: !state.panels[panelId].visible,
				},
			},
		}));
	};

	/**
	 * Toggle panel collapsed state
	 */
	const togglePanelCollapsed = (panelId: PanelId) => {
		store.setState((state) => ({
			...state,
			panels: {
				...state.panels,
				[panelId]: {
					...state.panels[panelId],
					collapsed: !state.panels[panelId].collapsed,
				},
			},
		}));
	};

	/**
	 * Reorder panel (move up/down within same slot)
	 */
	const reorderPanel = (panelId: PanelId, direction: "up" | "down") => {
		store.setState((state) => {
			const panel = state.panels[panelId];

			// Get and sort visible panels in the same slot
			const sameslotPanels = (
				Object.entries(state.panels) as [PanelId, PanelConfig][]
			)
				.filter(([_, cfg]) => cfg.slot === panel.slot && cfg.visible)
				.sort(([_, a], [__, b]) => a.order - b.order);

			// Get current index
			const currentIndex = sameslotPanels.findIndex(
				([id, _]) => id === panelId,
			);
			if (currentIndex === -1) return state;

			// Calculate target index
			const targetIndex =
				direction === "up" ? currentIndex - 1 : currentIndex + 1;

			// Boundary check
			if (targetIndex < 0 || targetIndex >= sameslotPanels.length) return state;

			const [currentId] = sameslotPanels[currentIndex];
			const [targetId] = sameslotPanels[targetIndex];

			return {
				...state,
				panels: {
					...state.panels,
					[currentId]: {
						...state.panels[currentId],
						order: state.panels[targetId].order,
					},
					[targetId]: {
						...state.panels[targetId],
						order: state.panels[currentId].order,
					},
				},
			};
		});
	};

	/**
	 * Reset to default
	 */
	const resetToDefault = () => {
		store.setState(() => DEFAULT_PANEL_LAYOUT);
	};

	return {
		updatePanelSlot,
		togglePanelVisibility,
		togglePanelCollapsed,
		reorderPanel,
		resetToDefault,
	};
}

export type LayoutActions = ReturnType<typeof createLayoutActions>;
