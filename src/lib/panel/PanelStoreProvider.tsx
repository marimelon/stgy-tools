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
 * Remove old numeric-only localStorage keys
 * Legacy format: editor-{left|right}-sidebar-{number} (had key collision issues with different panel configurations)
 * Current format: editor-{left|right}-sidebar-{panelId1}-{panelId2}-... (panel ID based)
 */
function cleanupLegacySidebarKeys(): void {
	if (typeof window === "undefined") return;

	const keysToRemove: string[] = [];
	// Target legacy numeric-only format for removal
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
 * Load configuration from localStorage
 * When new panels are added, merge with default values
 * Complement with false if collapsed property is missing from existing data
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
		// Verify required properties exist
		if (
			parsed.panels?.objectPalette &&
			parsed.panels.layerPanel &&
			parsed.panels.propertyPanel
		) {
			// Merge with defaults to complement new panels
			// Complement with false if collapsed property is missing (migration)
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
		// Ignore invalid JSON
	}

	return DEFAULT_PANEL_LAYOUT;
}

/** Context */
const PanelStoreContext = createContext<PanelStore | null>(null);

/**
 * Hook to access PanelStoreContext
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
	const store = useMemo(() => {
		const initialState = loadConfig();
		return createPanelStore(initialState);
	}, []);

	useEffect(() => {
		cleanupLegacySidebarKeys();
	}, []);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));

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
 * Check if the store is initialized
 */
export function useIsPanelStoreInitialized(): boolean {
	return getPanelStoreSafe() !== null;
}
