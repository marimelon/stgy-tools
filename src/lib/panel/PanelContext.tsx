/**
 * パネルレイアウト設定のContext
 */

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type {
	PanelConfig,
	PanelId,
	PanelLayoutConfig,
	PanelPreset,
	PanelSlot,
} from "./types";
import { DEFAULT_PANEL_LAYOUT, PANEL_PRESETS } from "./types";

const STORAGE_KEY = "strategy-board-panel-layout";

/**
 * PanelContextの値
 */
export interface PanelContextValue {
	/** 現在のレイアウト設定 */
	config: PanelLayoutConfig;
	/** パネルの配置スロットを変更 */
	updatePanelSlot: (panelId: PanelId, slot: PanelSlot) => void;
	/** パネルの表示/非表示を切り替え */
	togglePanelVisibility: (panelId: PanelId) => void;
	/** プリセットを適用 */
	applyPreset: (preset: PanelPreset) => void;
	/** デフォルトにリセット */
	resetToDefault: () => void;
	/** 左スロットのパネル一覧 */
	leftPanels: [PanelId, PanelConfig][];
	/** 右スロットのパネル一覧 */
	rightPanels: [PanelId, PanelConfig][];
}

const PanelContext = createContext<PanelContextValue | null>(null);

/**
 * パネルレイアウトContextフック
 */
export function usePanelLayout(): PanelContextValue {
	const context = useContext(PanelContext);
	if (!context) {
		throw new Error("usePanelLayout must be used within a PanelProvider");
	}
	return context;
}

/**
 * PanelProviderのProps
 */
interface PanelProviderProps {
	children: ReactNode;
}

/**
 * localStorageから設定を読み込み
 */
function loadConfig(): PanelLayoutConfig {
	if (typeof window === "undefined") {
		return DEFAULT_PANEL_LAYOUT;
	}

	const saved = localStorage.getItem(STORAGE_KEY);
	if (!saved) {
		return DEFAULT_PANEL_LAYOUT;
	}

	try {
		const parsed = JSON.parse(saved) as PanelLayoutConfig;
		// 必須プロパティの存在確認
		if (
			parsed.panels?.objectPalette &&
			parsed.panels.layerPanel &&
			parsed.panels.propertyPanel
		) {
			return parsed;
		}
	} catch {
		// 無効なJSONは無視
	}

	return DEFAULT_PANEL_LAYOUT;
}

/**
 * パネルレイアウトProvider
 */
export function PanelProvider({ children }: PanelProviderProps) {
	const [config, setConfig] = useState<PanelLayoutConfig>(loadConfig);

	// localStorageに保存
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
	}, [config]);

	const updatePanelSlot = useCallback((panelId: PanelId, slot: PanelSlot) => {
		setConfig((prev) => {
			// 同じスロットにある既存パネルの最大orderを取得
			const existingPanelsInSlot = Object.entries(prev.panels).filter(
				([id, cfg]) => id !== panelId && cfg.slot === slot,
			);
			const maxOrder =
				existingPanelsInSlot.length > 0
					? Math.max(...existingPanelsInSlot.map(([_, cfg]) => cfg.order))
					: -1;

			return {
				...prev,
				panels: {
					...prev.panels,
					[panelId]: {
						...prev.panels[panelId],
						slot,
						order: maxOrder + 1,
					},
				},
			};
		});
	}, []);

	const togglePanelVisibility = useCallback((panelId: PanelId) => {
		setConfig((prev) => ({
			...prev,
			panels: {
				...prev.panels,
				[panelId]: {
					...prev.panels[panelId],
					visible: !prev.panels[panelId].visible,
				},
			},
		}));
	}, []);

	const applyPreset = useCallback((preset: PanelPreset) => {
		setConfig(PANEL_PRESETS[preset]);
	}, []);

	const resetToDefault = useCallback(() => {
		setConfig(DEFAULT_PANEL_LAYOUT);
	}, []);

	// スロット別にソートしたパネル一覧
	const leftPanels = useMemo(() => {
		return (Object.entries(config.panels) as [PanelId, PanelConfig][])
			.filter(([_, cfg]) => cfg.slot === "left" && cfg.visible)
			.sort(([_, a], [__, b]) => a.order - b.order);
	}, [config.panels]);

	const rightPanels = useMemo(() => {
		return (Object.entries(config.panels) as [PanelId, PanelConfig][])
			.filter(([_, cfg]) => cfg.slot === "right" && cfg.visible)
			.sort(([_, a], [__, b]) => a.order - b.order);
	}, [config.panels]);

	const value = useMemo<PanelContextValue>(
		() => ({
			config,
			updatePanelSlot,
			togglePanelVisibility,
			applyPreset,
			resetToDefault,
			leftPanels,
			rightPanels,
		}),
		[
			config,
			updatePanelSlot,
			togglePanelVisibility,
			applyPreset,
			resetToDefault,
			leftPanels,
			rightPanels,
		],
	);

	return (
		<PanelContext.Provider value={value}>{children}</PanelContext.Provider>
	);
}
