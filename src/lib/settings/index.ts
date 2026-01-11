/**
 * Application settings module
 */

// Hooks
export {
	selectors as settingsSelectors,
	useAppSettings,
	useDebugMode,
	useSettingsActions,
	useSettingsSelector,
} from "./hooks";
// Provider
export {
	SettingsStoreProvider,
	useIsSettingsStoreInitialized,
	useSettingsStoreContext,
} from "./SettingsStoreProvider";
export type { SettingsActions, SettingsState, SettingsStore } from "./store";
// Store utilities (usable outside Provider)
export { getDebugMode, setDebugMode } from "./store";
// Types
export type { AppSettings } from "./types";
export { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "./types";
