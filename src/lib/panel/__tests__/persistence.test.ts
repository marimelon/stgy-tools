/**
 * パネル設定の永続化テスト
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { Store } from "@tanstack/store";
import { DEFAULT_PANEL_LAYOUT, type PanelLayoutConfig } from "../types";

const STORAGE_KEY = "strategy-board-panel-layout";

// localStorageのモック
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
		// localStorageをモック
		vi.stubGlobal("localStorage", localStorageMock);
		localStorageMock.clear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("loadConfig", () => {
		it("保存データがない場合はデフォルトを返す", async () => {
			// PanelStoreProviderをインポート（モック後にインポートする必要がある）
			const { PanelStoreProvider, usePanelStoreContext } = await import(
				"../PanelStoreProvider"
			);

			let capturedState: PanelLayoutConfig | null = null;

			function TestComponent() {
				const store = usePanelStoreContext();
				capturedState = store.state;
				return null;
			}

			render(
				createElement(PanelStoreProvider, {
					children: createElement(TestComponent),
				}),
			);

			await waitFor(() => {
				expect(capturedState).not.toBeNull();
			});

			// デフォルト設定と一致
			expect(capturedState?.panels.objectPalette).toEqual(
				DEFAULT_PANEL_LAYOUT.panels.objectPalette,
			);
		});

		it("保存されたデータを読み込む", async () => {
			// カスタム設定を保存
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

			// モジュールを再読み込み
			vi.resetModules();
			const { PanelStoreProvider, usePanelStoreContext } = await import(
				"../PanelStoreProvider"
			);

			let capturedState: PanelLayoutConfig | null = null;

			function TestComponent() {
				const store = usePanelStoreContext();
				capturedState = store.state;
				return null;
			}

			render(
				createElement(PanelStoreProvider, {
					children: createElement(TestComponent),
				}),
			);

			await waitFor(() => {
				expect(capturedState).not.toBeNull();
			});

			// 保存した設定が読み込まれている
			expect(capturedState?.panels.objectPalette.slot).toBe("right");
			expect(capturedState?.panels.objectPalette.visible).toBe(false);
			expect(capturedState?.panels.objectPalette.collapsed).toBe(true);
		});

		it("不正なJSONは無視してデフォルトを返す", async () => {
			// 不正なJSONを保存
			localStorageMock.setItem(STORAGE_KEY, "invalid json {{{");

			vi.resetModules();
			const { PanelStoreProvider, usePanelStoreContext } = await import(
				"../PanelStoreProvider"
			);

			let capturedState: PanelLayoutConfig | null = null;

			function TestComponent() {
				const store = usePanelStoreContext();
				capturedState = store.state;
				return null;
			}

			render(
				createElement(PanelStoreProvider, {
					children: createElement(TestComponent),
				}),
			);

			await waitFor(() => {
				expect(capturedState).not.toBeNull();
			});

			// デフォルト設定にフォールバック
			expect(capturedState?.panels.objectPalette).toEqual(
				DEFAULT_PANEL_LAYOUT.panels.objectPalette,
			);
		});

		it("新しいパネルがデフォルト値で補完される", async () => {
			// 古い形式のデータ（debugPanelがない）
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
					assetPanel: { slot: "left", order: 1, visible: true, collapsed: true },
					// debugPanelがない
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
				capturedState = store.state;
				return null;
			}

			render(
				createElement(PanelStoreProvider, {
					children: createElement(TestComponent),
				}),
			);

			await waitFor(() => {
				expect(capturedState).not.toBeNull();
			});

			// debugPanelがデフォルト値で補完されている
			expect(capturedState?.panels.debugPanel).toEqual(
				DEFAULT_PANEL_LAYOUT.panels.debugPanel,
			);
		});

		it("collapsedプロパティがない場合はfalseで補完", async () => {
			// 古い形式のデータ（collapsedがない）
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
				capturedState = store.state;
				return null;
			}

			render(
				createElement(PanelStoreProvider, {
					children: createElement(TestComponent),
				}),
			);

			await waitFor(() => {
				expect(capturedState).not.toBeNull();
			});

			// collapsedがfalseで補完されている
			expect(capturedState?.panels.objectPalette.collapsed).toBe(false);
			expect(capturedState?.panels.layerPanel.collapsed).toBe(false);
		});
	});

	describe("saveConfig", () => {
		it("ストア変更時にlocalStorageに保存される", async () => {
			vi.resetModules();
			const { PanelStoreProvider, usePanelStoreContext } = await import(
				"../PanelStoreProvider"
			);
			const { createLayoutActions } = await import(
				"../store/actions/layoutActions"
			);

			let store: Store<PanelLayoutConfig> | null = null;

			function TestComponent() {
				store = usePanelStoreContext();
				return null;
			}

			render(
				createElement(PanelStoreProvider, {
					children: createElement(TestComponent),
				}),
			);

			await waitFor(() => {
				expect(store).not.toBeNull();
			});

			// 初期状態が保存されている
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				STORAGE_KEY,
				expect.any(String),
			);

			// 変更を加える
			const actions = createLayoutActions(store!);
			actions.togglePanelVisibility("objectPalette");

			// 変更後もlocalStorageが更新される
			await waitFor(() => {
				const savedData = localStorageMock.getItem(STORAGE_KEY);
				const parsed = JSON.parse(savedData!);
				expect(parsed.panels.objectPalette.visible).toBe(false);
			});
		});
	});
});

