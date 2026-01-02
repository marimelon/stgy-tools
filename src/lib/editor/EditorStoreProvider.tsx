/**
 * EditorStoreProvider
 *
 * TanStack Store ベースのエディター状態管理Provider
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
 * EditorStoreを取得するフック
 * @throws Provider外で使用した場合
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
 * EditorStoreProviderのProps
 */
interface EditorStoreProviderProps {
	children: ReactNode;
	/** 初期ボードデータ */
	initialBoard: BoardData;
	/** 初期グループ情報（セッション復元用） */
	initialGroups?: ObjectGroup[];
	/** 初期グリッド設定（セッション復元用） */
	initialGridSettings?: GridSettings;
	/** ボードID（グローバル履歴ストアとの同期に使用、null = memory-only mode） */
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
	// Storeを初期化（初回マウント時のみ）
	// biome-ignore lint/correctness/useExhaustiveDependencies: Store should only be created once on mount
	const store = useMemo(() => {
		// グローバル履歴ストアから履歴を復元
		const storedHistory = getHistory(boardId);

		const initialState = createInitialStateWithOptions({
			board: initialBoard,
			groups: initialGroups,
			gridSettings: initialGridSettings,
			// 復元された履歴があれば使用
			history: storedHistory?.history,
			historyIndex: storedHistory?.historyIndex,
		});
		return createEditorStore(initialState, boardId);
	}, []);

	// クリーンアップはStoreのリセットを行わない
	// シングルトンパターンなので、再マウント時にcreateEditorStoreで上書きされる
	// アンマウント時にリセットすると、パネルレイアウト変更時などに
	// コンポーネントがストアにアクセスしようとしてエラーになる可能性がある

	return (
		<EditorStoreContext.Provider value={store}>
			{children}
		</EditorStoreContext.Provider>
	);
}
