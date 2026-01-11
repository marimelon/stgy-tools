/**
 * SettingsStore type definitions
 */

import type { Store } from "@tanstack/store";
import type { AppSettings } from "../types";

/** Settings State (currently same as AppSettings) */
export type SettingsState = AppSettings;

/** Settings Store type */
export type SettingsStore = Store<SettingsState>;
