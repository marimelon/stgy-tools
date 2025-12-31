/**
 * アプリケーション設定の型定義
 */

/**
 * アプリケーション設定
 */
export interface AppSettings {
	/** デバッグモード（全オブジェクトIDを表示） */
	debugMode: boolean;
}

/**
 * デフォルト設定
 */
export const DEFAULT_SETTINGS: AppSettings = {
	debugMode: false,
};

/**
 * ローカルストレージのキー
 */
export const SETTINGS_STORAGE_KEY = "strategy-board-settings";
