/**
 * SettingsStore Provider
 */

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
} from "react";
import {
	createSettingsStore,
	getSettingsStoreSafe,
	loadSettingsFromStorage,
} from "./store/settingsStore";
import type { SettingsStore } from "./store/types";
import { type AppSettings, SETTINGS_STORAGE_KEY } from "./types";

/**
 * Save settings to localStorage
 */
function saveSettings(settings: AppSettings): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Ignore storage errors
	}
}

/**
 * Migrate from legacy debug mode setting
 */
function migrateFromOldDebugMode(): void {
	if (typeof window === "undefined") return;

	const OLD_DEBUG_KEY = "debugObjectPalette";
	const oldValue = localStorage.getItem(OLD_DEBUG_KEY);

	if (oldValue !== null) {
		// Migrate legacy setting to new format
		const currentSettings = loadSettingsFromStorage();
		if (oldValue === "true") {
			currentSettings.debugMode = true;
			saveSettings(currentSettings);
		}
		// Remove legacy key
		localStorage.removeItem(OLD_DEBUG_KEY);
	}
}

/** Context */
const SettingsStoreContext = createContext<SettingsStore | null>(null);

/**
 * Hook to access SettingsStoreContext
 */
export function useSettingsStoreContext(): SettingsStore {
	const store = useContext(SettingsStoreContext);
	if (!store) {
		throw new Error(
			"useSettingsStoreContext must be used within SettingsStoreProvider",
		);
	}
	return store;
}

/** Provider Props */
interface SettingsStoreProviderProps {
	children: ReactNode;
}

/**
 * SettingsStore Provider
 */
export function SettingsStoreProvider({
	children,
}: SettingsStoreProviderProps) {
	const store = useMemo(() => {
		const initialState = loadSettingsFromStorage();
		return createSettingsStore(initialState);
	}, []);

	useEffect(() => {
		migrateFromOldDebugMode();
	}, []);

	useEffect(() => {
		saveSettings(store.state);

		const unsubscribe = store.subscribe(() => {
			saveSettings(store.state);
		});

		return unsubscribe;
	}, [store]);

	// Listen for changes from other tabs (storage event doesn't fire in same tab)
	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key !== SETTINGS_STORAGE_KEY || !event.newValue) return;

			try {
				const newSettings = JSON.parse(event.newValue) as AppSettings;
				store.setState(() => newSettings);
			} catch {
				// Ignore parse errors
			}
		};

		window.addEventListener("storage", handleStorageChange);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [store]);

	return (
		<SettingsStoreContext.Provider value={store}>
			{children}
		</SettingsStoreContext.Provider>
	);
}

/**
 * Check if the store is initialized
 */
export function useIsSettingsStoreInitialized(): boolean {
	return getSettingsStoreSafe() !== null;
}
