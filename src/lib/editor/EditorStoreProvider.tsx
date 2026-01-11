/**
 * EditorStoreProvider
 *
 * TanStack Store based editor state management Provider
 */

import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { BoardData } from "@/lib/stgy";
import { createInitialStateWithOptions } from "./reducer";
import { createEditorStore } from "./store/editorStore";
import { getHistory } from "./store/globalHistoryStore";
import type { EditorStore } from "./store/types";
import type { GridSettings, ObjectGroup } from "./types";

/** StoreContext */
const EditorStoreContext = createContext<EditorStore | null>(null);

/**
 * Hook to get EditorStore
 * @throws When used outside Provider
 */
export function useEditorStoreContext(): EditorStore {
	const store = useContext(EditorStoreContext);
	if (!store) {
		throw new Error(
			"useEditorStoreContext must be used within EditorStoreProvider",
		);
	}
	return store;
}

/**
 * EditorStoreProvider Props
 */
interface EditorStoreProviderProps {
	children: ReactNode;
	/** Initial board data */
	initialBoard: BoardData;
	/** Initial group info (for session restoration) */
	initialGroups?: ObjectGroup[];
	/** Initial grid settings (for session restoration) */
	initialGridSettings?: GridSettings;
	/** Board ID (for sync with global history store, null = memory-only mode) */
	boardId: string | null;
}

/**
 * EditorStoreProvider
 *
 * TanStack Storeとその派生状態を管理するProvider
 */
export function EditorStoreProvider({
	children,
	initialBoard,
	initialGroups,
	initialGridSettings,
	boardId,
}: EditorStoreProviderProps) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: Store should only be created once on mount
	const store = useMemo(() => {
		// Restore history from global history store
		const storedHistory = getHistory(boardId);

		const initialState = createInitialStateWithOptions({
			board: initialBoard,
			groups: initialGroups,
			gridSettings: initialGridSettings,
			// Use restored history if available
			history: storedHistory?.history,
			historyIndex: storedHistory?.historyIndex,
		});
		return createEditorStore(initialState, boardId);
	}, []);

	return (
		<EditorStoreContext.Provider value={store}>
			{children}
		</EditorStoreContext.Provider>
	);
}
