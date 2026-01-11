/**
 * Application settings type definitions
 */

/**
 * Application settings
 */
export interface AppSettings {
	/** Debug mode (shows all object IDs) */
	debugMode: boolean;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
	debugMode: false,
};

/**
 * localStorage key
 */
export const SETTINGS_STORAGE_KEY = "strategy-board-settings";
