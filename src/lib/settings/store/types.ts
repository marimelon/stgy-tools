/**
 * SettingsStore 型定義
 */

import type { Store } from "@tanstack/store";
import type { AppSettings } from "../types";

/** Settings State (現在は AppSettings と同一) */
export type SettingsState = AppSettings;

/** Settings Store 型 */
export type SettingsStore = Store<SettingsState>;
