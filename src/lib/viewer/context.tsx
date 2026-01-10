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

// ストアの型
type ViewerStore = Store<ViewerState>;

// コンテキスト
const ViewerStoreContext = createContext<ViewerStore | null>(null);

/**
 * stgyコードをデコードしてViewerBoardを生成
 */
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
 * 複数のstgyコードをパースしてViewerBoard配列を生成
 * 改行区切りで複数コードを受け付ける
 */
export function parseMultipleStgyCodes(input: string): ViewerBoard[] {
	const lines = input
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	// 上限を超えた場合は切り捨て
	const limitedLines = lines.slice(0, MAX_BOARDS);

	return limitedLines.map((code, index) => createViewerBoard(code, index));
}

interface ViewerStoreProviderProps {
	children: React.ReactNode;
	initialBoards?: ViewerBoard[];
	initialActiveId?: string | null;
	initialViewMode?: ViewerMode;
}

/**
 * ViewerStoreProvider
 * Viewer画面の状態管理を提供
 */
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

/**
 * ストアインスタンスを取得するフック
 */
export function useViewerStoreInstance(): ViewerStore {
	const store = useContext(ViewerStoreContext);
	if (!store) {
		throw new Error("useViewerStore must be used within ViewerStoreProvider");
	}
	return store;
}

/**
 * セレクタを使って状態を購読するフック
 *
 * 注意: selectorは参照が安定している必要があります。
 * インラインで渡す場合は、プリミティブな値を返すセレクタのみ使用してください。
 * 複雑なセレクタはuseCallbackでメモ化するか、hooks.tsの事前定義セレクタを使用してください。
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

/**
 * Viewerのアクション関数を返すフック
 */
export function useViewerActions() {
	const store = useViewerStoreInstance();

	return useMemo(
		() => ({
			/**
			 * 複数のstgyコードをボードとして読み込む
			 * 既存のボードは置き換えられる
			 */
			loadBoards: (input: string) => {
				const boards = parseMultipleStgyCodes(input);
				store.setState((state) => ({
					...state,
					boards,
					activeId: boards[0]?.id ?? null,
					selectedObjectIds: {},
				}));
			},

			/**
			 * 単一ボードを追加
			 */
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

			/**
			 * ボードを削除
			 */
			removeBoard: (id: string) => {
				store.setState((state) => {
					const newBoards = state.boards.filter((b) => b.id !== id);
					const newSelectedObjectIds = { ...state.selectedObjectIds };
					delete newSelectedObjectIds[id];

					// 削除したのがアクティブだった場合、次のボードをアクティブに
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

			/**
			 * アクティブなボードを変更
			 */
			setActiveBoard: (id: string) => {
				store.setState((state) => ({
					...state,
					activeId: id,
				}));
			},

			/**
			 * 表示モードを変更
			 */
			setViewMode: (mode: ViewerMode) => {
				store.setState((state) => ({
					...state,
					viewMode: mode,
				}));
			},

			/**
			 * ボードの選択オブジェクトを設定
			 */
			setSelectedObject: (boardId: string, objectId: string | null) => {
				store.setState((state) => ({
					...state,
					selectedObjectIds: {
						...state.selectedObjectIds,
						[boardId]: objectId,
					},
				}));
			},

			/**
			 * 全ボードをクリア
			 */
			clearBoards: () => {
				store.setState((state) => ({
					...state,
					boards: [],
					activeId: null,
					selectedObjectIds: {},
				}));
			},
		}),
		[store],
	);
}
