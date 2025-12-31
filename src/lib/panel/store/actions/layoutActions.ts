/**
 * パネルレイアウトアクション
 */

import type { PanelConfig, PanelId, PanelSlot } from "../../types";
import { DEFAULT_PANEL_LAYOUT } from "../../types";
import type { PanelStore } from "../types";

/**
 * レイアウトアクションを作成
 */
export function createLayoutActions(store: PanelStore) {
	/**
	 * パネルの配置スロットを変更
	 */
	const updatePanelSlot = (panelId: PanelId, slot: PanelSlot) => {
		store.setState((state) => {
			// 同じスロットにある既存パネルの最大orderを取得
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
	 * パネルの表示/非表示を切り替え
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
	 * パネルの折りたたみ状態を切り替え
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
	 * パネルの順序を変更（同じスロット内で上下移動）
	 */
	const reorderPanel = (panelId: PanelId, direction: "up" | "down") => {
		store.setState((state) => {
			const panel = state.panels[panelId];

			// 同じスロット内の表示中パネルを取得してソート
			const sameslotPanels = (
				Object.entries(state.panels) as [PanelId, PanelConfig][]
			)
				.filter(([_, cfg]) => cfg.slot === panel.slot && cfg.visible)
				.sort(([_, a], [__, b]) => a.order - b.order);

			// 現在のインデックスを取得
			const currentIndex = sameslotPanels.findIndex(
				([id, _]) => id === panelId,
			);
			if (currentIndex === -1) return state;

			// 移動先インデックスを計算
			const targetIndex =
				direction === "up" ? currentIndex - 1 : currentIndex + 1;

			// 境界チェック
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
	 * デフォルトにリセット
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
