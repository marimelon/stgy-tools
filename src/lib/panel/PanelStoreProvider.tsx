/**
 * PanelStore Provider
 */

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { createPanelStore, getPanelStoreSafe } from "./store/panelStore";
import type { PanelStore } from "./store/types";
import type { PanelId, PanelLayoutConfig } from "./types";
import { DEFAULT_PANEL_LAYOUT } from "./types";

const STORAGE_KEY = "strategy-board-panel-layout";

/**
 * 古い数字のみのlocalStorageキーを削除
 * 旧形式: editor-{left|right}-sidebar-{number}（異なるパネル構成でキーが衝突する問題があった）
 * 現形式: editor-{left|right}-sidebar-{panelId1}-{panelId2}-...（パネルIDベース）
 */
function cleanupLegacySidebarKeys(): void {
	if (typeof window === "undefined") return;

	const keysToRemove: string[] = [];
	// 数字のみの旧形式を削除対象にする
	const legacyKeyPattern = /^editor-(left|right)-sidebar-\d+$/;

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && legacyKeyPattern.test(key)) {
			keysToRemove.push(key);
		}
	}

	for (const key of keysToRemove) {
		localStorage.removeItem(key);
	}
}

/**
 * localStorageから設定を読み込み
 * 新しいパネルが追加された場合、デフォルト値でマージする
 * 既存データにcollapsedプロパティがない場合はfalseで補完
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
			// デフォルト設定とマージして、新しいパネルを補完
			// 各パネルのcollapsedプロパティがない場合はfalseで補完（マイグレーション）
			const migratedPanels = { ...DEFAULT_PANEL_LAYOUT.panels };
			for (const [id, cfg] of Object.entries(parsed.panels)) {
				const panelId = id as PanelId;
				migratedPanels[panelId] = {
					...cfg,
					collapsed: cfg.collapsed ?? false,
				};
			}
			return {
				...parsed,
				panels: migratedPanels,
			};
		}
	} catch {
		// 無効なJSONは無視
	}

	return DEFAULT_PANEL_LAYOUT;
}

/** Context */
const PanelStoreContext = createContext<PanelStore | null>(null);

/**
 * PanelStoreContext フック
 */
export function usePanelStoreContext(): PanelStore {
	const store = useContext(PanelStoreContext);
	if (!store) {
		throw new Error(
			"usePanelStoreContext must be used within PanelStoreProvider",
		);
	}
	return store;
}

/** Provider Props */
interface PanelStoreProviderProps {
	children: ReactNode;
}

/**
 * PanelStore Provider
 */
export function PanelStoreProvider({ children }: PanelStoreProviderProps) {
	// ストアを一度だけ作成
	const store = useMemo(() => {
		const initialState = loadConfig();
		return createPanelStore(initialState);
	}, []);

	// 初回マウント時に古いサイドバーレイアウトキーをクリーンアップ
	useEffect(() => {
		cleanupLegacySidebarKeys();
	}, []);

	// ストア変更時にlocalStorageに保存
	useEffect(() => {
		// 初期状態を保存
		localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));

		// 変更を購読して保存
		const unsubscribe = store.subscribe(() => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
		});

		return unsubscribe;
	}, [store]);

	return (
		<PanelStoreContext.Provider value={store}>
			{children}
		</PanelStoreContext.Provider>
	);
}

/**
 * ストアが初期化されているか確認
 */
export function useIsPanelStoreInitialized(): boolean {
	return getPanelStoreSafe() !== null;
}
