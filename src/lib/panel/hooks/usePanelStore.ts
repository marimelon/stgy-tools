/**
 * PanelStore フック
 */

import { shallow, useStore } from "@tanstack/react-store";
import { getPanelStore } from "../store/panelStore";
import type { PanelState } from "../store/types";
import type { PanelConfig, PanelId, PanelLayoutConfig } from "../types";

/**
 * セレクタを使用してストアの一部を購読
 */
export function usePanelSelector<T>(selector: (state: PanelState) => T): T {
	const store = getPanelStore();
	return useStore(store, selector);
}

/**
 * 浅い比較でセレクタを使用（配列/オブジェクト向け）
 */
export function usePanelSelectorShallow<T>(
	selector: (state: PanelState) => T,
): T {
	const store = getPanelStore();
	return useStore(store, selector, { equal: shallow });
}

/**
 * 事前定義セレクタ
 */
export const selectors = {
	/** 全設定 */
	config: (s: PanelState): PanelLayoutConfig => s,

	/** パネル設定マップ */
	panels: (s: PanelState): Record<PanelId, PanelConfig> => s.panels,

	/** 特定パネルの設定を取得するセレクタを生成 */
	panel: (panelId: PanelId) => (s: PanelState) => s.panels[panelId],

	/** 左スロットの表示中パネル */
	leftPanels: (s: PanelState): [PanelId, PanelConfig][] =>
		(Object.entries(s.panels) as [PanelId, PanelConfig][])
			.filter(([_, cfg]) => cfg.slot === "left" && cfg.visible)
			.sort(([_, a], [__, b]) => a.order - b.order),

	/** 右スロットの表示中パネル */
	rightPanels: (s: PanelState): [PanelId, PanelConfig][] =>
		(Object.entries(s.panels) as [PanelId, PanelConfig][])
			.filter(([_, cfg]) => cfg.slot === "right" && cfg.visible)
			.sort(([_, a], [__, b]) => a.order - b.order),

	/** 左スロットの非表示パネル */
	leftHiddenPanels: (s: PanelState): [PanelId, PanelConfig][] =>
		(Object.entries(s.panels) as [PanelId, PanelConfig][])
			.filter(([_, cfg]) => cfg.slot === "left" && !cfg.visible)
			.sort(([_, a], [__, b]) => a.order - b.order),

	/** 右スロットの非表示パネル */
	rightHiddenPanels: (s: PanelState): [PanelId, PanelConfig][] =>
		(Object.entries(s.panels) as [PanelId, PanelConfig][])
			.filter(([_, cfg]) => cfg.slot === "right" && !cfg.visible)
			.sort(([_, a], [__, b]) => a.order - b.order),
} as const;

// ============================================
// 便利フック
// ============================================

/** レイアウト設定全体を取得 */
export function useConfig(): PanelLayoutConfig {
	return usePanelSelector(selectors.config);
}

/** 左スロットの表示中パネルを取得 */
export function useLeftPanels(): [PanelId, PanelConfig][] {
	return usePanelSelectorShallow(selectors.leftPanels);
}

/** 右スロットの表示中パネルを取得 */
export function useRightPanels(): [PanelId, PanelConfig][] {
	return usePanelSelectorShallow(selectors.rightPanels);
}

/** 左スロットの非表示パネルを取得 */
export function useLeftHiddenPanels(): [PanelId, PanelConfig][] {
	return usePanelSelectorShallow(selectors.leftHiddenPanels);
}

/** 右スロットの非表示パネルを取得 */
export function useRightHiddenPanels(): [PanelId, PanelConfig][] {
	return usePanelSelectorShallow(selectors.rightHiddenPanels);
}
