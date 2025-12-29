/**
 * EditorStoreProvider
 *
 * TanStack Store ベースのエディター状態管理Provider
 */

import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { BoardData } from "@/lib/stgy";
import { createInitialStateWithOptions } from "./reducer";
import { createEditorStore, type EditorStore } from "./store/editorStore";
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
}: EditorStoreProviderProps) {
	// Storeを初期化（初回マウント時のみ）
	// biome-ignore lint/correctness/useExhaustiveDependencies: Store should only be created once on mount
	const store = useMemo(() => {
		const initialState = createInitialStateWithOptions({
			board: initialBoard,
			groups: initialGroups,
			gridSettings: initialGridSettings,
		});
		return createEditorStore(initialState);
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
