/**
 * Editor store
 *
 * Core of editor state management using TanStack Store
 */

import { Store } from "@tanstack/store";
import type { EditorState } from "../types";
import type { EditorStore } from "./types";

let store: EditorStore | null = null;

/** Currently editing board ID (null = memory-only mode) */
let currentBoardId: string | null = null;

/**
 * Create editor store
 * @param boardId Board ID (used for global history store synchronization)
 */
export function createEditorStore(
	initialState: EditorState,
	boardId: string | null,
): EditorStore {
	currentBoardId = boardId;
	store = new Store<EditorState>(initialState);
	return store;
}

export function getCurrentBoardId(): string | null {
	return currentBoardId;
}

/**
 * @throws If store is not initialized
 */
export function getEditorStore(): EditorStore {
	if (!store) {
		throw new Error(
			"Editor store not initialized. Ensure EditorStoreProvider is mounted.",
		);
	}
	return store;
}

/**
 * Safely get store (allows null).
 * Use to avoid timing issues during panel layout changes.
 */
export function getEditorStoreSafe(): EditorStore | null {
	return store;
}

/**
 * Reset store (used on Provider unmount)
 */
export function resetEditorStore(): void {
	store = null;
}

export function isEditorStoreInitialized(): boolean {
	return store !== null;
}
