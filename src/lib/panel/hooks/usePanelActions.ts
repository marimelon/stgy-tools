/**
 * PanelActions フック
 */

import { useMemo } from "react";
import { createPanelActions, type PanelActions } from "../store/actions";
import { getPanelStore } from "../store/panelStore";

/**
 * パネルアクションを取得
 */
export function usePanelActions(): PanelActions {
	const store = getPanelStore();

	return useMemo(() => createPanelActions(store), [store]);
}
