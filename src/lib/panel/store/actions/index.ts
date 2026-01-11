/**
 * Panel actions aggregation
 */

import type { PanelStore } from "../types";
import { createLayoutActions, type LayoutActions } from "./layoutActions";

/** All actions interface */
export interface PanelActions extends LayoutActions {}

/**
 * Create all actions
 */
export function createPanelActions(store: PanelStore): PanelActions {
	return {
		...createLayoutActions(store),
	};
}

export type { LayoutActions } from "./layoutActions";
