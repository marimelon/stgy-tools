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
 * localStorageに設定を保存
 */
function saveSettings(settings: AppSettings): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// ストレージエラーは無視
	}
}

/**
 * 旧デバッグモード設定からのマイグレーション
 */
function migrateFromOldDebugMode(): void {
	if (typeof window === "undefined") return;

	const OLD_DEBUG_KEY = "debugObjectPalette";
	const oldValue = localStorage.getItem(OLD_DEBUG_KEY);

	if (oldValue !== null) {
		// 旧設定が存在する場合、新しい設定にマイグレーション
		const currentSettings = loadSettingsFromStorage();
		if (oldValue === "true") {
			currentSettings.debugMode = true;
			saveSettings(currentSettings);
		}
		// 旧キーを削除
		localStorage.removeItem(OLD_DEBUG_KEY);
	}
}

/** Context */
const SettingsStoreContext = createContext<SettingsStore | null>(null);

/**
 * SettingsStoreContext フック
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
	// ストアを一度だけ作成
	const store = useMemo(() => {
		const initialState = loadSettingsFromStorage();
		return createSettingsStore(initialState);
	}, []);

	// 初回マウント時にマイグレーション処理
	useEffect(() => {
		migrateFromOldDebugMode();
	}, []);

	// ストア変更時にlocalStorageに保存
	useEffect(() => {
		// 初期状態を保存
		saveSettings(store.state);

		// 変更を購読して保存
		const unsubscribe = store.subscribe(() => {
			saveSettings(store.state);
		});

		return unsubscribe;
	}, [store]);

	// 他のタブからの変更をリッスン（storageイベントは同じタブでは発火しない）
	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key !== SETTINGS_STORAGE_KEY || !event.newValue) return;

			try {
				const newSettings = JSON.parse(event.newValue) as AppSettings;
				store.setState(() => newSettings);
			} catch {
				// パースエラーは無視
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
 * ストアが初期化されているか確認
 */
export function useIsSettingsStoreInitialized(): boolean {
	return getSettingsStoreSafe() !== null;
}
