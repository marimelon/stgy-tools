/**
 * Tab store provider component
 */

import {
	createContext,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
} from "react";
import * as actions from "./actions";
import { loadTabState, saveTabState } from "./persistence";
import { createTabStore, type TabStore } from "./store";

/** Tab store context */
export const TabStoreContext = createContext<TabStore | null>(null);

interface TabStoreProviderProps {
	children: ReactNode;
	/** If provided, ignore persisted state and initialize with these board IDs */
	initialBoardIds?: string[] | null;
	/** Called after initialBoardIds has been consumed (applied to store) */
	onInitialBoardIdsConsumed?: () => void;
}

/** Compare arrays for equality */
function arraysEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((id, i) => id === b[i]);
}

/**
 * Tab store provider
 * Initializes store and handles persistence
 */
export function TabStoreProvider({
	children,
	initialBoardIds,
	onInitialBoardIdsConsumed,
}: TabStoreProviderProps) {
	// Track last applied initialBoardIds to detect changes
	const lastAppliedBoardIdsRef = useRef<string[] | null>(null);
	// Track callback to avoid stale closure in useMemo
	const onConsumedRef = useRef(onInitialBoardIdsConsumed);
	onConsumedRef.current = onInitialBoardIdsConsumed;

	// Create store with persisted state or initial board IDs
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only run on mount
	const store = useMemo(() => {
		// If initialBoardIds provided, use them instead of persisted state
		if (initialBoardIds && initialBoardIds.length > 0) {
			lastAppliedBoardIdsRef.current = initialBoardIds;
			// Notify parent that initialBoardIds has been consumed (deferred to avoid setState during render)
			queueMicrotask(() => onConsumedRef.current?.());
			return createTabStore({
				openTabs: initialBoardIds,
				activeTabId: initialBoardIds[0],
			});
		}
		const persisted = loadTabState();
		return createTabStore(persisted ?? undefined);
	}, []);

	// Apply initialBoardIds if it becomes available or changes after mount
	useEffect(() => {
		if (initialBoardIds && initialBoardIds.length > 0) {
			// Check if initialBoardIds has changed from last applied
			const lastApplied = lastAppliedBoardIdsRef.current;
			if (!lastApplied || !arraysEqual(initialBoardIds, lastApplied)) {
				lastAppliedBoardIdsRef.current = initialBoardIds;
				actions.replaceAllTabs(store, initialBoardIds);
				// Notify parent that initialBoardIds has been consumed
				onInitialBoardIdsConsumed?.();
			}
		}
	}, [initialBoardIds, store, onInitialBoardIdsConsumed]);

	// Subscribe to state changes and persist
	useEffect(() => {
		const unsubscribe = store.subscribe(() => {
			saveTabState(store.state);
		});
		return unsubscribe;
	}, [store]);

	return (
		<TabStoreContext.Provider value={store}>
			{children}
		</TabStoreContext.Provider>
	);
}
