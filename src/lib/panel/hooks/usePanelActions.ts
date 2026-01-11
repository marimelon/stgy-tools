/**
 * PanelActions hook
 */

import { useMemo } from "react";
import { createPanelActions, type PanelActions } from "../store/actions";
import { getPanelStore } from "../store/panelStore";

/**
 * Get panel actions
 */
export function usePanelActions(): PanelActions {
	const store = getPanelStore();

	return useMemo(() => createPanelActions(store), [store]);
}
