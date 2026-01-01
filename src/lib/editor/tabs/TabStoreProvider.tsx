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
}

/**
 * Tab store provider
 * Initializes store and handles persistence
 */
export function TabStoreProvider({ children }: TabStoreProviderProps) {
	// Create store with persisted state
	const store = useMemo(() => {
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
