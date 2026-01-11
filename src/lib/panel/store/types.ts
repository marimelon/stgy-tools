/**
 * PanelStore type definitions
 */

import type { Store } from "@tanstack/store";
import type { PanelLayoutConfig } from "../types";

/** Panel State (currently same as PanelLayoutConfig) */
export type PanelState = PanelLayoutConfig;

/** Panel Store type */
export type PanelStore = Store<PanelState>;
