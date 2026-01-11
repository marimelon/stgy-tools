/**
 * PanelStore singleton instance management
 */

import { Store } from "@tanstack/store";
import type { PanelState, PanelStore } from "./types";

let store: PanelStore | null = null;

/**
 * Create PanelStore
 * Overwrites existing store if present
 */
export function createPanelStore(initialState: PanelState): PanelStore {
	store = new Store<PanelState>(initialState);
	return store;
}

/**
 * Get PanelStore
 * Throws error if store is not initialized
 */
export function getPanelStore(): PanelStore {
	if (!store) {
		throw new Error(
			"Panel store not initialized. Ensure PanelStoreProvider is mounted.",
		);
	}
	return store;
}

/**
 * Get PanelStore safely (null-safe)
 * Use where timing issues may occur
 */
export function getPanelStoreSafe(): PanelStore | null {
	return store;
}
