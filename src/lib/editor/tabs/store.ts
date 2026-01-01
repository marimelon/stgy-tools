/**
 * Tab store using TanStack Store
 */

import { Store } from "@tanstack/store";
import type { TabState } from "./types";

/**
 * Create initial tab state
 */
export function createInitialTabState(): TabState {
	return {
		openTabs: [],
		activeTabId: null,
	};
}

/**
 * Create tab store instance
 */
export function createTabStore(
	initialState?: Partial<TabState>,
): Store<TabState> {
	return new Store<TabState>({
		...createInitialTabState(),
		...initialState,
	});
}

/** Tab store type */
export type TabStore = Store<TabState>;
