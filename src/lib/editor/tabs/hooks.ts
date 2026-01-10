/**
 * React hooks for tab store
 */

import { useStore } from "@tanstack/react-store";
import { useCallback, useContext } from "react";
import * as actions from "./actions";
import type { TabStore } from "./store";
import { TabStoreContext } from "./TabStoreProvider";
import { MAX_TABS, type TabState } from "./types";

/**
 * Get tab store from context
 * @throws Error if used outside TabStoreProvider
 */
export function useTabStoreContext(): TabStore {
	const store = useContext(TabStoreContext);
	if (!store) {
		throw new Error("useTabStoreContext must be used within TabStoreProvider");
	}
	return store;
}

/**
 * Subscribe to tab state with selector
 */
export function useTabSelector<T>(selector: (state: TabState) => T): T {
	const store = useTabStoreContext();
	return useStore(store, selector);
}

/**
 * Get open tabs
 */
export function useOpenTabs(): string[] {
	return useTabSelector((s) => s.openTabs);
}

/**
 * Get active tab ID
 */
export function useActiveTabId(): string | null {
	return useTabSelector((s) => s.activeTabId);
}

/**
 * Check if at tab limit
 */
export function useIsAtTabLimit(): boolean {
	const openTabs = useOpenTabs();
	return openTabs.length >= MAX_TABS;
}

/**
 * Check if a specific tab is the only tab
 */
export function useIsOnlyTab(boardId: string): boolean {
	const openTabs = useOpenTabs();
	return openTabs.length === 1 && openTabs[0] === boardId;
}

/**
 * Tab actions hook
 */
export function useTabActions() {
	const store = useTabStoreContext();

	const addTab = useCallback(
		(boardId: string) => actions.addTab(store, boardId),
		[store],
	);

	const closeTab = useCallback(
		(boardId: string) => actions.closeTab(store, boardId),
		[store],
	);

	const switchTab = useCallback(
		(boardId: string) => actions.switchTab(store, boardId),
		[store],
	);

	const closeOtherTabs = useCallback(
		(boardId: string) => actions.closeOtherTabs(store, boardId),
		[store],
	);

	const closeTabsToRight = useCallback(
		(boardId: string) => actions.closeTabsToRight(store, boardId),
		[store],
	);

	const reorderTabs = useCallback(
		(fromIndex: number, toIndex: number) =>
			actions.reorderTabs(store, fromIndex, toIndex),
		[store],
	);

	const removeDeletedBoardTab = useCallback(
		(deletedBoardId: string, replacementBoardId?: string) =>
			actions.removeDeletedBoardTab(store, deletedBoardId, replacementBoardId),
		[store],
	);

	const initializeTabs = useCallback(
		(
			persistedTabs: string[],
			persistedActiveId: string | null,
			existingBoardIds: Set<string>,
		) =>
			actions.initializeTabs(
				store,
				persistedTabs,
				persistedActiveId,
				existingBoardIds,
			),
		[store],
	);

	const setInitialTab = useCallback(
		(boardId: string) => actions.setInitialTab(store, boardId),
		[store],
	);

	const replaceAllTabs = useCallback(
		(boardIds: string[]) => actions.replaceAllTabs(store, boardIds),
		[store],
	);

	return {
		addTab,
		closeTab,
		switchTab,
		closeOtherTabs,
		closeTabsToRight,
		reorderTabs,
		removeDeletedBoardTab,
		initializeTabs,
		setInitialTab,
		replaceAllTabs,
	};
}
