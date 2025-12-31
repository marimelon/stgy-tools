/**
 * Panel アクション集約
 */

import type { PanelStore } from "../types";
import { createLayoutActions, type LayoutActions } from "./layoutActions";

/** 全アクションのインターフェース */
export interface PanelActions extends LayoutActions {}

/**
 * 全アクションを作成
 */
export function createPanelActions(store: PanelStore): PanelActions {
	return {
		...createLayoutActions(store),
	};
}

export type { LayoutActions } from "./layoutActions";
