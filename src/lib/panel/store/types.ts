/**
 * PanelStore 型定義
 */

import type { Store } from "@tanstack/store";
import type { PanelLayoutConfig } from "../types";

/** Panel State (現在は PanelLayoutConfig と同一) */
export type PanelState = PanelLayoutConfig;

/** Panel Store 型 */
export type PanelStore = Store<PanelState>;

/** Panel Store 初期化オプション */
export interface PanelStoreOptions {
	initialState: PanelState;
}
