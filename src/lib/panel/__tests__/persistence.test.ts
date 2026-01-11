/**
 * Panel configuration persistence tests
 */

import { render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PanelStore } from "../store/types";
import { DEFAULT_PANEL_LAYOUT, type PanelLayoutConfig } from "../types";

const STORAGE_KEY = "strategy-board-panel-layout";

// localStorage mock
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		get length() {
			return Object.keys(store).length;
		},
		key: vi.fn((i: number) => Object.keys(store)[i] || null),
	};
})();

describe("Panel persistence", () => {
	beforeEach(() => {
		vi.stubGlobal("localStorage", localStorageMock);
		localStorageMock.clear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("loadConfig", () => {
		it("returns default when no saved data exists", async () => {
			const { PanelStoreProvider, usePanelStoreContext } = await import(
				"../PanelStoreProvider"
			);

			let capturedState: PanelLayoutConfig | null = null;

			function TestComponent() {
				const store = usePanelStoreContext();
				capturedState = store.state as PanelLayoutConfig;
				return null;
			}

			render(
				createElement(PanelStoreProvider, null, createElement(TestComponent)),
			);

			await waitFor(() => {
				expect(capturedState).not.toBeNull();
			});

			expect(capturedState!.panels.objectPalette).toEqual(
				DEFAULT_PANEL_LAYOUT.panels.objectPalette,
			);
		});

		it("loads saved data", async () => {
			const customConfig: PanelLayoutConfig = {
				panels: {
					...DEFAULT_PANEL_LAYOUT.panels,
					objectPalette: {
						slot: "right",
						order: 5,
						visible: false,
						collapsed: true,
					},
				},
			};
			localStorageMock.setItem(STORAGE_KEY, JSON.stringify(customConfig));

			vi.resetModules();
			const { PanelStoreProvider, usePanelStoreContext } = await import(
				"../PanelStoreProvider"
			);

			let capturedState: PanelLayoutConfig | null = null;

			function TestComponent() {
				const store = usePanelStoreContext();
				capturedState = store.state as PanelLayoutConfig;
				return null;
			}

			render(
				createElement(PanelStoreProvider, null, createElement(TestComponent)),
			);

			await waitFor(() => {
				expect(capturedState).not.toBeNull();
			});

			expect(capturedState!.panels.objectPalette.slot).toBe("right");
			expect(capturedState!.panels.objectPalette.visible).toBe(false);
			expect(capturedState!.panels.objectPalette.collapsed).toBe(true);
		});

		it("ignores invalid JSON and returns default", async () => {
			localStorageMock.setItem(STORAGE_KEY, "invalid json {{{");

			vi.resetModules();
			const { PanelStoreProvider, usePanelStoreContext } = await import(
				"../PanelStoreProvider"
			);

			let capturedState: PanelLayoutConfig | null = null;

			function TestComponent() {
				const store = usePanelStoreContext();
				capturedState = store.state as PanelLayoutConfig;
				return null;
			}

			render(
				createElement(PanelStoreProvider, null, createElement(TestComponent)),
			);

			await waitFor(() => {
				expect(capturedState).not.toBeNull();
			});

			expect(capturedState!.panels.objectPalette).toEqual(
				DEFAULT_PANEL_LAYOUT.panels.objectPalette,
			);
		});

		it("fills in missing panels with default values", async () => {
			const oldConfig = {
				panels: {
					objectPalette: {
						slot: "left",
						order: 0,
						visible: true,
						collapsed: false,
					},
					layerPanel: {
						slot: "right",
						order: 1,
						visible: true,
						collapsed: false,
					},
					propertyPanel: {
						slot: "right",
						order: 0,
						visible: true,
						collapsed: false,
					},
					historyPanel: {
						slot: "right",
						order: 2,
						visible: false,
						collapsed: false,
					},
					assetPanel: {
						slot: "left",
						order: 1,
						visible: true,
						collapsed: true,
					},
				},
			};
			localStorageMock.setItem(STORAGE_KEY, JSON.stringify(oldConfig));

			vi.resetModules();
			const { PanelStoreProvider, usePanelStoreContext } = await import(
				"../PanelStoreProvider"
			);

			let capturedState: PanelLayoutConfig | null = null;

			function TestComponent() {
				const store = usePanelStoreContext();
				capturedState = store.state as PanelLayoutConfig;
				return null;
			}

			render(
				createElement(PanelStoreProvider, null, createElement(TestComponent)),
			);

			await waitFor(() => {
				expect(capturedState).not.toBeNull();
			});

			expect(capturedState!.panels.debugPanel).toEqual(
				DEFAULT_PANEL_LAYOUT.panels.debugPanel,
			);
		});

		it("fills in missing collapsed property with false", async () => {
			const oldConfig = {
				panels: {
					objectPalette: { slot: "left", order: 0, visible: true },
					layerPanel: { slot: "right", order: 1, visible: true },
					propertyPanel: { slot: "right", order: 0, visible: true },
					historyPanel: { slot: "right", order: 2, visible: false },
					assetPanel: { slot: "left", order: 1, visible: true },
					debugPanel: { slot: "right", order: 3, visible: false },
				},
			};
			localStorageMock.setItem(STORAGE_KEY, JSON.stringify(oldConfig));

			vi.resetModules();
			const { PanelStoreProvider, usePanelStoreContext } = await import(
				"../PanelStoreProvider"
			);

			let capturedState: PanelLayoutConfig | null = null;

			function TestComponent() {
				const store = usePanelStoreContext();
				capturedState = store.state as PanelLayoutConfig;
				return null;
			}

			render(
				createElement(PanelStoreProvider, null, createElement(TestComponent)),
			);

			await waitFor(() => {
				expect(capturedState).not.toBeNull();
			});

			expect(capturedState!.panels.objectPalette.collapsed).toBe(false);
			expect(capturedState!.panels.layerPanel.collapsed).toBe(false);
		});
	});

	describe("saveConfig", () => {
		it("saves to localStorage when store changes", async () => {
			vi.resetModules();
			const { PanelStoreProvider, usePanelStoreContext } = await import(
				"../PanelStoreProvider"
			);
			const { createLayoutActions } = await import(
				"../store/actions/layoutActions"
			);

			let store: PanelStore | null = null;

			function TestComponent() {
				store = usePanelStoreContext();
				return null;
			}

			render(
				createElement(PanelStoreProvider, null, createElement(TestComponent)),
			);

			await waitFor(() => {
				expect(store).not.toBeNull();
			});

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				STORAGE_KEY,
				expect.any(String),
			);

			const actions = createLayoutActions(store!);
			actions.togglePanelVisibility("objectPalette");

			await waitFor(() => {
				const savedData = localStorageMock.getItem(STORAGE_KEY);
				const parsed = JSON.parse(savedData!);
				expect(parsed.panels.objectPalette.visible).toBe(false);
			});
		});
	});
});
