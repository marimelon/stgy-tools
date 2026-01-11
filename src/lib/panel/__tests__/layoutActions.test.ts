/**
 * Panel layout actions tests
 */

import { Store } from "@tanstack/store";
import { beforeEach, describe, expect, it } from "vitest";
import { createLayoutActions } from "../store/actions/layoutActions";
import type { PanelState } from "../store/types";
import { DEFAULT_PANEL_LAYOUT, type PanelId } from "../types";

describe("layoutActions", () => {
	let store: Store<PanelState>;
	let actions: ReturnType<typeof createLayoutActions>;

	beforeEach(() => {
		store = new Store<PanelState>(structuredClone(DEFAULT_PANEL_LAYOUT));
		actions = createLayoutActions(store);
	});

	describe("togglePanelVisibility", () => {
		it("can hide a panel", () => {
			expect(store.state.panels.objectPalette.visible).toBe(true);

			actions.togglePanelVisibility("objectPalette");

			expect(store.state.panels.objectPalette.visible).toBe(false);
		});

		it("can show a hidden panel", () => {
			expect(store.state.panels.historyPanel.visible).toBe(false);

			actions.togglePanelVisibility("historyPanel");

			expect(store.state.panels.historyPanel.visible).toBe(true);
		});

		it("returns to original state after two toggles", () => {
			const initialVisible = store.state.panels.assetPanel.visible;

			actions.togglePanelVisibility("assetPanel");
			actions.togglePanelVisibility("assetPanel");

			expect(store.state.panels.assetPanel.visible).toBe(initialVisible);
		});
	});

	describe("updatePanelSlot", () => {
		it("can move panel from left to right", () => {
			expect(store.state.panels.objectPalette.slot).toBe("left");

			actions.updatePanelSlot("objectPalette", "right");

			expect(store.state.panels.objectPalette.slot).toBe("right");
		});

		it("can move panel from right to left", () => {
			expect(store.state.panels.layerPanel.slot).toBe("right");

			actions.updatePanelSlot("layerPanel", "left");

			expect(store.state.panels.layerPanel.slot).toBe("left");
		});

		it("places panel at end of target slot", () => {
			const rightPanels = Object.entries(store.state.panels)
				.filter(([_, cfg]) => cfg.slot === "right")
				.map(([_, cfg]) => cfg.order);
			const maxRightOrder = Math.max(...rightPanels);

			actions.updatePanelSlot("objectPalette", "right");

			expect(store.state.panels.objectPalette.order).toBe(maxRightOrder + 1);
		});
	});

	describe("reorderPanel", () => {
		it("can move panel up", () => {
			const assetInitialOrder = store.state.panels.assetPanel.order;
			const objectInitialOrder = store.state.panels.objectPalette.order;

			actions.reorderPanel("assetPanel", "up");

			expect(store.state.panels.assetPanel.order).toBe(objectInitialOrder);
			expect(store.state.panels.objectPalette.order).toBe(assetInitialOrder);
		});

		it("can move panel down", () => {
			const assetInitialOrder = store.state.panels.assetPanel.order;
			const objectInitialOrder = store.state.panels.objectPalette.order;

			actions.reorderPanel("objectPalette", "down");

			expect(store.state.panels.objectPalette.order).toBe(assetInitialOrder);
			expect(store.state.panels.assetPanel.order).toBe(objectInitialOrder);
		});

		it("cannot move topmost panel up", () => {
			const initialOrder = store.state.panels.objectPalette.order;

			actions.reorderPanel("objectPalette", "up");

			expect(store.state.panels.objectPalette.order).toBe(initialOrder);
		});

		it("excludes hidden panels from reordering", () => {
			const propertyInitialOrder = store.state.panels.propertyPanel.order;
			const layerInitialOrder = store.state.panels.layerPanel.order;

			actions.reorderPanel("layerPanel", "up");

			expect(store.state.panels.layerPanel.order).toBe(propertyInitialOrder);
			expect(store.state.panels.propertyPanel.order).toBe(layerInitialOrder);
		});
	});

	describe("togglePanelCollapsed", () => {
		it("can collapse a panel", () => {
			expect(store.state.panels.objectPalette.collapsed).toBe(false);

			actions.togglePanelCollapsed("objectPalette");

			expect(store.state.panels.objectPalette.collapsed).toBe(true);
		});

		it("can expand a collapsed panel", () => {
			expect(store.state.panels.assetPanel.collapsed).toBe(true);

			actions.togglePanelCollapsed("assetPanel");

			expect(store.state.panels.assetPanel.collapsed).toBe(false);
		});

		it("returns to original state after two toggles", () => {
			const initialCollapsed = store.state.panels.layerPanel.collapsed;

			actions.togglePanelCollapsed("layerPanel");
			actions.togglePanelCollapsed("layerPanel");

			expect(store.state.panels.layerPanel.collapsed).toBe(initialCollapsed);
		});
	});

	describe("resetToDefault", () => {
		it("can reset to default layout", () => {
			actions.togglePanelVisibility("objectPalette");
			actions.updatePanelSlot("layerPanel", "left");
			actions.togglePanelCollapsed("propertyPanel");

			expect(store.state.panels.objectPalette.visible).toBe(false);
			expect(store.state.panels.layerPanel.slot).toBe("left");
			expect(store.state.panels.propertyPanel.collapsed).toBe(true);

			actions.resetToDefault();

			expect(store.state.panels.objectPalette.visible).toBe(true);
			expect(store.state.panels.layerPanel.slot).toBe("right");
			expect(store.state.panels.propertyPanel.collapsed).toBe(false);
		});

		it("matches default exactly after reset", () => {
			actions.togglePanelVisibility("assetPanel");
			actions.reorderPanel("layerPanel", "up");

			actions.resetToDefault();

			const panelIds: PanelId[] = [
				"objectPalette",
				"assetPanel",
				"layerPanel",
				"propertyPanel",
				"historyPanel",
				"debugPanel",
			];

			for (const id of panelIds) {
				expect(store.state.panels[id]).toEqual(DEFAULT_PANEL_LAYOUT.panels[id]);
			}
		});
	});

	describe("compound operations", () => {
		it("can perform multiple operations in sequence", () => {
			actions.updatePanelSlot("objectPalette", "right");
			actions.togglePanelVisibility("historyPanel");
			actions.togglePanelCollapsed("layerPanel");

			expect(store.state.panels.objectPalette.slot).toBe("right");
			expect(store.state.panels.historyPanel.visible).toBe(true);
			expect(store.state.panels.layerPanel.collapsed).toBe(true);
		});

		it("can reorder after moving panel", () => {
			actions.updatePanelSlot("objectPalette", "right");

			const initialOrder = store.state.panels.objectPalette.order;
			actions.reorderPanel("objectPalette", "up");

			expect(store.state.panels.objectPalette.order).toBeLessThan(initialOrder);
		});
	});
});
