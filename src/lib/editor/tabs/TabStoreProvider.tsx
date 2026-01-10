/**
 * Tab store provider component
 */

import { createContext, type ReactNode, useEffect, useMemo } from "react";
import { loadTabState, saveTabState } from "./persistence";
import { createTabStore, type TabStore } from "./store";

/** Tab store context */
export const TabStoreContext = createContext<TabStore | null>(null);

interface TabStoreProviderProps {
	children: ReactNode;
	/** If provided, ignore persisted state and initialize with these board IDs */
	initialBoardIds?: string[] | null;
}

/**
 * Tab store provider
 * Initializes store and handles persistence
 */
export function TabStoreProvider({
	children,
	initialBoardIds,
}: TabStoreProviderProps) {
	// Create store with persisted state or initial board IDs
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only run on mount
	const store = useMemo(() => {
		// If initialBoardIds provided, use them instead of persisted state
		if (initialBoardIds && initialBoardIds.length > 0) {
			return createTabStore({
				openTabs: initialBoardIds,
				activeTabId: initialBoardIds[0],
			});
		}
		const persisted = loadTabState();
		return createTabStore(persisted ?? undefined);
	}, []);

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
