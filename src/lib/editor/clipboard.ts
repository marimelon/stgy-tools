/**
 * Global clipboard
 * In-memory store shared across all editor tabs in the app
 */

import { useSyncExternalStore } from "react";
import type { BoardObject } from "@/lib/stgy";

/** Global clipboard store */
let clipboardStore: BoardObject[] | null = null;

/** Set of subscribers */
const subscribers = new Set<() => void>();

/**
 * Subscribe to clipboard state changes
 * For useSyncExternalStore
 */
export function subscribeToClipboard(callback: () => void): () => void {
	subscribers.add(callback);
	return () => {
		subscribers.delete(callback);
	};
}

/**
 * Notify subscribers
 */
function notifySubscribers(): void {
	for (const callback of subscribers) {
		callback();
	}
}

/**
 * Save objects to clipboard
 */
export function writeToClipboard(objects: BoardObject[]): void {
	clipboardStore = structuredClone(objects);
	notifySubscribers();
}

/**
 * Read objects from clipboard
 * @returns Object array, or null if empty
 */
export function readFromClipboard(): BoardObject[] | null {
	if (!clipboardStore || clipboardStore.length === 0) {
		return null;
	}
	return clipboardStore;
}

/**
 * Check if clipboard has data
 */
export function hasClipboardData(): boolean {
	return clipboardStore !== null && clipboardStore.length > 0;
}

/**
 * Get clipboard state (snapshot for useSyncExternalStore)
 */
export function getClipboardSnapshot(): boolean {
	return hasClipboardData();
}

/**
 * Hook to monitor global clipboard state
 * Detects copies from other tabs since clipboard is shared across tabs
 */
export function useGlobalClipboard(): boolean {
	// Third argument is SSR snapshot (clipboard is always empty on server)
	return useSyncExternalStore(
		subscribeToClipboard,
		getClipboardSnapshot,
		() => false,
	);
}
