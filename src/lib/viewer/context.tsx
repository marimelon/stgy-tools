import { Store } from "@tanstack/store";
import { nanoid } from "nanoid";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";
import { assignBoardObjectIds, decodeStgy, parseBoardData } from "@/lib/stgy";
import {
	initialViewerState,
	MAX_BOARDS,
	type ViewerBoard,
	type ViewerMode,
	type ViewerState,
} from "./types";

type ViewerStore = Store<ViewerState>;

const ViewerStoreContext = createContext<ViewerStore | null>(null);

function createViewerBoard(stgyCode: string, index: number): ViewerBoard {
	const id = nanoid();
	const trimmedCode = stgyCode.trim();

	if (!trimmedCode) {
		return {
			id,
			stgyCode: "",
			boardData: null,
			error: "Empty code",
			name: `Board ${index + 1}`,
		};
	}

	try {
		const binary = decodeStgy(trimmedCode);
		const parsed = parseBoardData(binary);
		const data = assignBoardObjectIds(parsed);
		return {
			id,
			stgyCode: trimmedCode,
			boardData: data,
			error: null,
			name: data.name || `Board ${index + 1}`,
		};
	} catch (e) {
		return {
			id,
			stgyCode: trimmedCode,
			boardData: null,
			error: e instanceof Error ? e.message : "Unknown error",
			name: `Board ${index + 1}`,
		};
	}
}

/**
 * Parse multiple stgy codes (newline separated) into ViewerBoard array
 */
export function parseMultipleStgyCodes(input: string): ViewerBoard[] {
	const lines = input
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	const limitedLines = lines.slice(0, MAX_BOARDS);

	return limitedLines.map((code, index) => createViewerBoard(code, index));
}

interface ViewerStoreProviderProps {
	children: React.ReactNode;
	initialBoards?: ViewerBoard[];
	initialActiveId?: string | null;
	initialViewMode?: ViewerMode;
}

export function ViewerStoreProvider({
	children,
	initialBoards = [],
	initialActiveId = null,
	initialViewMode = "tab",
}: ViewerStoreProviderProps) {
	const storeRef = useRef<ViewerStore | null>(null);

	if (!storeRef.current) {
		const state: ViewerState = {
			...initialViewerState,
			boards: initialBoards,
			activeId: initialActiveId ?? initialBoards[0]?.id ?? null,
			viewMode: initialViewMode,
		};
		storeRef.current = new Store(state);
	}

	return (
		<ViewerStoreContext.Provider value={storeRef.current}>
			{children}
		</ViewerStoreContext.Provider>
	);
}

export function useViewerStoreInstance(): ViewerStore {
	const store = useContext(ViewerStoreContext);
	if (!store) {
		throw new Error("useViewerStore must be used within ViewerStoreProvider");
	}
	return store;
}

/**
 * Subscribe to state using a selector.
 *
 * Note: Selector reference must be stable. For inline selectors,
 * only use those returning primitive values. For complex selectors,
 * memoize with useCallback or use predefined selectors from hooks.ts.
 */
export function useViewerSelector<T>(selector: (state: ViewerState) => T): T {
	const store = useViewerStoreInstance();

	const subscribe = useCallback(
		(callback: () => void) => store.subscribe(callback),
		[store],
	);

	const getSnapshot = useCallback(
		() => selector(store.state),
		[store, selector],
	);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useViewerActions() {
	const store = useViewerStoreInstance();

	return useMemo(
		() => ({
			loadBoards: (input: string) => {
				const boards = parseMultipleStgyCodes(input);
				store.setState((state) => ({
					...state,
					boards,
					activeId: boards[0]?.id ?? null,
					selectedObjectIds: {},
				}));
			},

			addBoard: (stgyCode: string) => {
				const currentBoards = store.state.boards;
				if (currentBoards.length >= MAX_BOARDS) {
					return false;
				}
				const newBoard = createViewerBoard(stgyCode, currentBoards.length);
				store.setState((state) => ({
					...state,
					boards: [...state.boards, newBoard],
					activeId: newBoard.id,
				}));
				return true;
			},

			removeBoard: (id: string) => {
				store.setState((state) => {
					const newBoards = state.boards.filter((b) => b.id !== id);
					const newSelectedObjectIds = { ...state.selectedObjectIds };
					delete newSelectedObjectIds[id];

					let newActiveId = state.activeId;
					if (state.activeId === id) {
						const deletedIndex = state.boards.findIndex((b) => b.id === id);
						newActiveId =
							newBoards[deletedIndex]?.id ??
							newBoards[deletedIndex - 1]?.id ??
							null;
					}

					return {
						...state,
						boards: newBoards,
						activeId: newActiveId,
						selectedObjectIds: newSelectedObjectIds,
					};
				});
			},

			setActiveBoard: (id: string) => {
				store.setState((state) => ({
					...state,
					activeId: id,
				}));
			},

			setViewMode: (mode: ViewerMode) => {
				store.setState((state) => ({
					...state,
					viewMode: mode,
				}));
			},

			setSelectedObject: (boardId: string, objectId: string | null) => {
				store.setState((state) => ({
					...state,
					selectedObjectIds: {
						...state.selectedObjectIds,
						[boardId]: objectId,
					},
				}));
			},

			clearBoards: () => {
				store.setState((state) => ({
					...state,
					boards: [],
					activeId: null,
					selectedObjectIds: {},
				}));
			},

			reorderBoards: (fromIndex: number, toIndex: number) => {
				store.setState((state) => {
					const { boards } = state;
					if (
						fromIndex < 0 ||
						fromIndex >= boards.length ||
						toIndex < 0 ||
						toIndex >= boards.length ||
						fromIndex === toIndex
					) {
						return state;
					}
					const newBoards = [...boards];
					const [removed] = newBoards.splice(fromIndex, 1);
					newBoards.splice(toIndex, 0, removed);
					return { ...state, boards: newBoards };
				});
			},
		}),
		[store],
	);
}
