/**
 * アプリケーション設定モジュール
 */

export {
	getDebugMode,
	SettingsProvider,
	setDebugMode,
	useDebugMode,
	useSettings,
} from "./SettingsContext";
export type { AppSettings } from "./types";
export { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "./types";
