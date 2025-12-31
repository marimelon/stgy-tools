/**
 * アプリケーション設定のContext
 *
 * 設定をlocalStorageに永続化し、カスタムイベントで複数コンポーネント間で同期
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
import {
	type AppSettings,
	DEFAULT_SETTINGS,
	SETTINGS_STORAGE_KEY,
} from "./types";

/** 設定変更イベント名 */
const SETTINGS_CHANGE_EVENT = "appSettingsChange";

/**
 * localStorageから設定を読み込む
 */
function loadSettings(): AppSettings {
	if (typeof window === "undefined") return DEFAULT_SETTINGS;

	try {
		const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// デフォルト値とマージして、新しい設定項目にも対応
			return { ...DEFAULT_SETTINGS, ...parsed };
		}
	} catch {
		// パースエラーの場合はデフォルトを返す
	}
	return DEFAULT_SETTINGS;
}

/**
 * localStorageに設定を保存
 */
function saveSettings(settings: AppSettings): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
		// カスタムイベントを発火して他のコンポーネントに通知
		window.dispatchEvent(
			new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings }),
		);
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
		const currentSettings = loadSettings();
		if (oldValue === "true") {
			currentSettings.debugMode = true;
			saveSettings(currentSettings);
		}
		// 旧キーを削除
		localStorage.removeItem(OLD_DEBUG_KEY);
	}
}

/** Settings Contextの値 */
interface SettingsContextValue {
	/** 現在の設定 */
	settings: AppSettings;
	/** 設定を更新 */
	updateSettings: (updates: Partial<AppSettings>) => void;
	/** デバッグモードを切り替え */
	toggleDebugMode: () => void;
	/** 設定をリセット */
	resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Settings Provider Props */
interface SettingsProviderProps {
	children: ReactNode;
}

/**
 * 設定Providerコンポーネント
 */
export function SettingsProvider({ children }: SettingsProviderProps) {
	const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

	// 初期化時に設定を読み込み + マイグレーション
	useEffect(() => {
		migrateFromOldDebugMode();
		setSettings(loadSettings());

		// 他のコンポーネントからの変更をリッスン
		const handleSettingsChange = (event: CustomEvent<AppSettings>) => {
			setSettings(event.detail);
		};

		window.addEventListener(
			SETTINGS_CHANGE_EVENT,
			handleSettingsChange as EventListener,
		);

		return () => {
			window.removeEventListener(
				SETTINGS_CHANGE_EVENT,
				handleSettingsChange as EventListener,
			);
		};
	}, []);

	const updateSettings = useCallback((updates: Partial<AppSettings>) => {
		setSettings((prev) => {
			const newSettings = { ...prev, ...updates };
			saveSettings(newSettings);
			return newSettings;
		});
	}, []);

	const toggleDebugMode = useCallback(() => {
		updateSettings({ debugMode: !settings.debugMode });
	}, [settings.debugMode, updateSettings]);

	const resetSettings = useCallback(() => {
		setSettings(DEFAULT_SETTINGS);
		saveSettings(DEFAULT_SETTINGS);
	}, []);

	const value = useMemo<SettingsContextValue>(
		() => ({
			settings,
			updateSettings,
			toggleDebugMode,
			resetSettings,
		}),
		[settings, updateSettings, toggleDebugMode, resetSettings],
	);

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
}

/**
 * 設定Contextを使用するフック
 */
export function useSettings(): SettingsContextValue {
	const context = useContext(SettingsContext);
	if (!context) {
		throw new Error("useSettings must be used within a SettingsProvider");
	}
	return context;
}

/**
 * デバッグモードのみを取得するフック（後方互換性のため）
 */
export function useDebugMode() {
	const { settings, toggleDebugMode, updateSettings } = useSettings();

	return {
		debugMode: settings.debugMode,
		toggleDebugMode,
		setDebugMode: (enabled: boolean) => updateSettings({ debugMode: enabled }),
	};
}

/**
 * デバッグモードの状態を取得（Provider外でも使用可能）
 */
export function getDebugMode(): boolean {
	return loadSettings().debugMode;
}

/**
 * デバッグモードの状態を設定（Provider外でも使用可能）
 */
export function setDebugMode(enabled: boolean): void {
	const currentSettings = loadSettings();
	saveSettings({ ...currentSettings, debugMode: enabled });
}
