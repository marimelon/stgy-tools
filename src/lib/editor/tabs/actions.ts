/**
 * Tab store actions
 */

import type { TabStore } from "./store";
import { MAX_TABS } from "./types";

/**
 * Add a new tab
 * @returns true if tab was added, false if already exists or at limit
 */
export function addTab(store: TabStore, boardId: string): boolean {
	const state = store.state;

	// Check if already open
	if (state.openTabs.includes(boardId)) {
		// Switch to existing tab
		store.setState((s) => ({ ...s, activeTabId: boardId }));
		return false;
	}

	// Check tab limit
	if (state.openTabs.length >= MAX_TABS) {
		return false;
	}

	store.setState((s) => ({
		...s,
		openTabs: [...s.openTabs, boardId],
		activeTabId: boardId,
	}));
	return true;
}

/**
 * Close a tab
 * @returns true if tab was closed, false if it's the last tab
 */
export function closeTab(store: TabStore, boardId: string): boolean {
	const state = store.state;
	const tabIndex = state.openTabs.indexOf(boardId);

	if (tabIndex === -1) return false;

	// Cannot close last tab
	if (state.openTabs.length <= 1) {
		return false;
	}

	const newOpenTabs = state.openTabs.filter((id) => id !== boardId);

	// Determine new active tab if closing active
	let newActiveTabId = state.activeTabId;
	if (state.activeTabId === boardId) {
		// Prefer next tab, fall back to previous
		if (tabIndex < newOpenTabs.length) {
			newActiveTabId = newOpenTabs[tabIndex];
		} else {
			newActiveTabId = newOpenTabs[newOpenTabs.length - 1];
		}
	}

	store.setState((s) => ({
		...s,
		openTabs: newOpenTabs,
		activeTabId: newActiveTabId,
	}));
	return true;
}

/**
 * Switch to a tab
 */
export function switchTab(store: TabStore, boardId: string): void {
	const state = store.state;

	if (!state.openTabs.includes(boardId)) return;

	store.setState((s) => ({ ...s, activeTabId: boardId }));
}

/**
 * Close all tabs except the specified one
 */
export function closeOtherTabs(store: TabStore, boardId: string): void {
	store.setState((s) => ({
		...s,
		openTabs: s.openTabs.includes(boardId) ? [boardId] : s.openTabs,
		activeTabId: s.openTabs.includes(boardId) ? boardId : s.activeTabId,
	}));
}

/**
 * Close all tabs to the right of the specified one
 */
export function closeTabsToRight(store: TabStore, boardId: string): void {
	const state = store.state;
	const tabIndex = state.openTabs.indexOf(boardId);

	if (tabIndex === -1) return;

	const newOpenTabs = state.openTabs.slice(0, tabIndex + 1);

	// Update active tab if it was closed
	let newActiveTabId = state.activeTabId;
	if (newActiveTabId && !newOpenTabs.includes(newActiveTabId)) {
		newActiveTabId = boardId;
	}

	store.setState((s) => ({
		...s,
		openTabs: newOpenTabs,
		activeTabId: newActiveTabId,
	}));
}

/**
 * Reorder tabs (for drag and drop)
 */
export function reorderTabs(
	store: TabStore,
	fromIndex: number,
	toIndex: number,
): void {
	const state = store.state;

	if (
		fromIndex < 0 ||
		fromIndex >= state.openTabs.length ||
		toIndex < 0 ||
		toIndex >= state.openTabs.length
	) {
		return;
	}

	const newOpenTabs = [...state.openTabs];
	const [moved] = newOpenTabs.splice(fromIndex, 1);
	newOpenTabs.splice(toIndex, 0, moved);

	store.setState((s) => ({
		...s,
		openTabs: newOpenTabs,
	}));
}

/**
 * Remove a tab when a board is deleted
 * Similar to closeTab but allows closing the last tab if a replacement is provided
 */
export function removeDeletedBoardTab(
	store: TabStore,
	deletedBoardId: string,
	replacementBoardId?: string,
): void {
	const state = store.state;

	if (!state.openTabs.includes(deletedBoardId)) return;

	const newOpenTabs = state.openTabs.filter((id) => id !== deletedBoardId);

	// Handle case where deleted board was the last open tab
	if (newOpenTabs.length === 0 && replacementBoardId) {
		store.setState((s) => ({
			...s,
			openTabs: [replacementBoardId],
			activeTabId: replacementBoardId,
		}));
		return;
	}

	// Determine new active tab if closing active
	let newActiveTabId = state.activeTabId;
	if (state.activeTabId === deletedBoardId) {
		const tabIndex = state.openTabs.indexOf(deletedBoardId);
		if (tabIndex < newOpenTabs.length) {
			newActiveTabId = newOpenTabs[tabIndex];
		} else if (newOpenTabs.length > 0) {
			newActiveTabId = newOpenTabs[newOpenTabs.length - 1];
		} else {
			newActiveTabId = null;
		}
	}

	store.setState((s) => ({
		...s,
		openTabs: newOpenTabs,
		activeTabId: newActiveTabId,
	}));
}

/**
 * Initialize tabs from persisted state, filtering out deleted boards
 */
export function initializeTabs(
	store: TabStore,
	persistedTabs: string[],
	persistedActiveId: string | null,
	existingBoardIds: Set<string>,
): void {
	// Filter out boards that no longer exist
	const validTabs = persistedTabs.filter((id) => existingBoardIds.has(id));

	// Validate active tab
	const activeTabId =
		persistedActiveId && validTabs.includes(persistedActiveId)
			? persistedActiveId
			: validTabs.length > 0
				? validTabs[0]
				: null;

	store.setState((s) => ({
		...s,
		openTabs: validTabs,
		activeTabId,
	}));
}

/**
 * Set a single tab as the only open tab (for initial state)
 */
export function setInitialTab(store: TabStore, boardId: string): void {
	store.setState((s) => ({
		...s,
		openTabs: [boardId],
		activeTabId: boardId,
	}));
}
