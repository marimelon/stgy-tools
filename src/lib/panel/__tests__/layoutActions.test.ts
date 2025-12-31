/**
 * パネルレイアウトアクションのテスト
 */

import { beforeEach, describe, expect, it } from "vitest";
import { Store } from "@tanstack/store";
import { createLayoutActions } from "../store/actions/layoutActions";
import type { PanelState } from "../store/types";
import { DEFAULT_PANEL_LAYOUT, type PanelId } from "../types";

describe("layoutActions", () => {
	let store: Store<PanelState>;
	let actions: ReturnType<typeof createLayoutActions>;

	beforeEach(() => {
		// 各テスト前に新しいストアを作成
		store = new Store<PanelState>(structuredClone(DEFAULT_PANEL_LAYOUT));
		actions = createLayoutActions(store);
	});

	describe("togglePanelVisibility", () => {
		it("パネルを非表示にできる", () => {
			// 初期状態: objectPaletteは表示
			expect(store.state.panels.objectPalette.visible).toBe(true);

			actions.togglePanelVisibility("objectPalette");

			expect(store.state.panels.objectPalette.visible).toBe(false);
		});

		it("非表示のパネルを表示にできる", () => {
			// 初期状態: historyPanelは非表示
			expect(store.state.panels.historyPanel.visible).toBe(false);

			actions.togglePanelVisibility("historyPanel");

			expect(store.state.panels.historyPanel.visible).toBe(true);
		});

		it("2回トグルで元に戻る", () => {
			const initialVisible = store.state.panels.assetPanel.visible;

			actions.togglePanelVisibility("assetPanel");
			actions.togglePanelVisibility("assetPanel");

			expect(store.state.panels.assetPanel.visible).toBe(initialVisible);
		});
	});

	describe("updatePanelSlot", () => {
		it("パネルを左から右に移動できる", () => {
			// 初期状態: objectPaletteは左
			expect(store.state.panels.objectPalette.slot).toBe("left");

			actions.updatePanelSlot("objectPalette", "right");

			expect(store.state.panels.objectPalette.slot).toBe("right");
		});

		it("パネルを右から左に移動できる", () => {
			// 初期状態: layerPanelは右
			expect(store.state.panels.layerPanel.slot).toBe("right");

			actions.updatePanelSlot("layerPanel", "left");

			expect(store.state.panels.layerPanel.slot).toBe("left");
		});

		it("移動先スロットで最後の順序になる", () => {
			// 右スロットのパネルを確認
			const rightPanels = Object.entries(store.state.panels)
				.filter(([_, cfg]) => cfg.slot === "right")
				.map(([_, cfg]) => cfg.order);
			const maxRightOrder = Math.max(...rightPanels);

			// objectPaletteを右に移動
			actions.updatePanelSlot("objectPalette", "right");

			// 新しい順序は既存の最大順序より大きい
			expect(store.state.panels.objectPalette.order).toBe(maxRightOrder + 1);
		});
	});

	describe("reorderPanel", () => {
		it("パネルを上に移動できる", () => {
			// assetPanelはorder=1、objectPaletteはorder=0（両方とも左スロット）
			const assetInitialOrder = store.state.panels.assetPanel.order;
			const objectInitialOrder = store.state.panels.objectPalette.order;

			// assetPanelはvisible=trueでないと移動できないので、まず表示する
			// 初期状態でassetPanelはvisible=true（collapsed=trueだが表示されている）

			actions.reorderPanel("assetPanel", "up");

			// 順序がswapされる
			expect(store.state.panels.assetPanel.order).toBe(objectInitialOrder);
			expect(store.state.panels.objectPalette.order).toBe(assetInitialOrder);
		});

		it("パネルを下に移動できる", () => {
			const assetInitialOrder = store.state.panels.assetPanel.order;
			const objectInitialOrder = store.state.panels.objectPalette.order;

			actions.reorderPanel("objectPalette", "down");

			// 順序がswapされる
			expect(store.state.panels.objectPalette.order).toBe(assetInitialOrder);
			expect(store.state.panels.assetPanel.order).toBe(objectInitialOrder);
		});

		it("最上位のパネルは上に移動できない", () => {
			// objectPaletteをorder=0として最上位に配置
			const initialOrder = store.state.panels.objectPalette.order;

			actions.reorderPanel("objectPalette", "up");

			// 順序は変わらない
			expect(store.state.panels.objectPalette.order).toBe(initialOrder);
		});

		it("非表示のパネルは順序変更に含まれない", () => {
			// historyPanelは非表示 (visible=false)
			const propertyInitialOrder = store.state.panels.propertyPanel.order;
			const layerInitialOrder = store.state.panels.layerPanel.order;

			// layerPanelを上に移動（historyPanelはスキップされる）
			actions.reorderPanel("layerPanel", "up");

			// propertyPanelとlayerPanelがswap
			expect(store.state.panels.layerPanel.order).toBe(propertyInitialOrder);
			expect(store.state.panels.propertyPanel.order).toBe(layerInitialOrder);
		});
	});

	describe("togglePanelCollapsed", () => {
		it("パネルを折りたためる", () => {
			// 初期状態: objectPaletteは展開されている
			expect(store.state.panels.objectPalette.collapsed).toBe(false);

			actions.togglePanelCollapsed("objectPalette");

			expect(store.state.panels.objectPalette.collapsed).toBe(true);
		});

		it("折りたたまれたパネルを展開できる", () => {
			// 初期状態: assetPanelは折りたたまれている
			expect(store.state.panels.assetPanel.collapsed).toBe(true);

			actions.togglePanelCollapsed("assetPanel");

			expect(store.state.panels.assetPanel.collapsed).toBe(false);
		});

		it("2回トグルで元に戻る", () => {
			const initialCollapsed = store.state.panels.layerPanel.collapsed;

			actions.togglePanelCollapsed("layerPanel");
			actions.togglePanelCollapsed("layerPanel");

			expect(store.state.panels.layerPanel.collapsed).toBe(initialCollapsed);
		});
	});

	describe("resetToDefault", () => {
		it("デフォルトレイアウトにリセットできる", () => {
			// 複数の変更を加える
			actions.togglePanelVisibility("objectPalette");
			actions.updatePanelSlot("layerPanel", "left");
			actions.togglePanelCollapsed("propertyPanel");

			// 変更されていることを確認
			expect(store.state.panels.objectPalette.visible).toBe(false);
			expect(store.state.panels.layerPanel.slot).toBe("left");
			expect(store.state.panels.propertyPanel.collapsed).toBe(true);

			// リセット
			actions.resetToDefault();

			// デフォルトに戻る
			expect(store.state.panels.objectPalette.visible).toBe(true);
			expect(store.state.panels.layerPanel.slot).toBe("right");
			expect(store.state.panels.propertyPanel.collapsed).toBe(false);
		});

		it("リセット後はデフォルトと完全に一致", () => {
			// 変更を加える
			actions.togglePanelVisibility("assetPanel");
			actions.reorderPanel("layerPanel", "up");

			// リセット
			actions.resetToDefault();

			// 全てのパネルがデフォルトと一致
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

	describe("複合操作", () => {
		it("複数の操作を連続して行える", () => {
			// オブジェクトパレットを右に移動
			actions.updatePanelSlot("objectPalette", "right");

			// 履歴パネルを表示
			actions.togglePanelVisibility("historyPanel");

			// レイヤーパネルを折りたたむ
			actions.togglePanelCollapsed("layerPanel");

			// 結果を確認
			expect(store.state.panels.objectPalette.slot).toBe("right");
			expect(store.state.panels.historyPanel.visible).toBe(true);
			expect(store.state.panels.layerPanel.collapsed).toBe(true);
		});

		it("パネル移動後に順序変更できる", () => {
			// objectPaletteを右に移動
			actions.updatePanelSlot("objectPalette", "right");

			// 右スロットで上に移動
			const initialOrder = store.state.panels.objectPalette.order;
			actions.reorderPanel("objectPalette", "up");

			// 移動していることを確認（順序が変わっている）
			expect(store.state.panels.objectPalette.order).toBeLessThan(initialOrder);
		});
	});
});

