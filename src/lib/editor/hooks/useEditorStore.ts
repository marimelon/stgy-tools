/**
 * エディターストアへのアクセスフック
 *
 * TanStack Store の useStore を使用した選択的購読
 */

import { shallow, useStore } from "@tanstack/react-store";
import type { BoardData, BoardObject } from "@/lib/stgy";
import { getEditorStore, isEditorStoreInitialized } from "../store/editorStore";
import type {
	CircularModeState,
	EditorError,
	EditorState,
	GridSettings,
	HistoryEntry,
	ObjectGroup,
} from "../types";

/**
 * ストアが初期化されているかを確認するフック
 * パネルレイアウト変更時などのタイミング問題を検出するために使用
 */
export function useIsEditorStoreInitialized(): boolean {
	return isEditorStoreInitialized();
}

/**
 * 状態の一部を選択的に購読するフック
 * 選択した値が変更された場合のみ再レンダリング
 */
export function useEditorSelector<T>(selector: (state: EditorState) => T): T {
	const store = getEditorStore();
	return useStore(store, selector);
}

/**
 * 状態の一部を選択的に購読するフック（shallow比較版）
 * オブジェクトや配列の比較にshallow比較を使用
 */
export function useEditorSelectorShallow<T>(
	selector: (state: EditorState) => T,
): T {
	const store = getEditorStore();
	return useStore(store, selector, { equal: shallow });
}

/**
 * 全状態を購読するフック（非推奨：パフォーマンス上の理由）
 * @deprecated useEditorSelector を使用して必要な部分のみ購読してください
 */
export function useEditorState(): EditorState {
	const store = getEditorStore();
	return useStore(store, (s) => s);
}

// ============================================
// 事前定義セレクタ
// ============================================

/** 事前定義セレクタ */
export const selectors = {
	/** ボードデータ全体 */
	board: (s: EditorState): BoardData => s.board,

	/** オブジェクト配列 */
	objects: (s: EditorState): BoardObject[] => s.board.objects,

	/** 背景ID */
	backgroundId: (s: EditorState): number => s.board.backgroundId,

	/** ボード名 */
	boardName: (s: EditorState): string => s.board.name,

	/** 選択中のインデックス配列 */
	selectedIndices: (s: EditorState): number[] => s.selectedIndices,

	/** 選択数 */
	selectionCount: (s: EditorState): number => s.selectedIndices.length,

	/** 何か選択されているか */
	hasSelection: (s: EditorState): boolean => s.selectedIndices.length > 0,

	/** 単一選択か */
	hasSingleSelection: (s: EditorState): boolean =>
		s.selectedIndices.length === 1,

	/** グリッド設定 */
	gridSettings: (s: EditorState): GridSettings => s.gridSettings,

	/** グループ配列 */
	groups: (s: EditorState): ObjectGroup[] => s.groups,

	/** 履歴配列 */
	history: (s: EditorState): HistoryEntry[] => s.history,

	/** 現在の履歴インデックス */
	historyIndex: (s: EditorState): number => s.historyIndex,

	/** 変更があるか */
	isDirty: (s: EditorState): boolean => s.isDirty,

	/** クリップボード */
	clipboard: (s: EditorState): BoardObject[] | null => s.clipboard,

	/** クリップボードに内容があるか */
	hasClipboard: (s: EditorState): boolean =>
		s.clipboard !== null && s.clipboard.length > 0,

	/** 編集中のテキストインデックス */
	editingTextIndex: (s: EditorState): number | null => s.editingTextIndex,

	/** テキスト編集中か */
	isEditingText: (s: EditorState): boolean => s.editingTextIndex !== null,

	/** フォーカス中のグループID */
	focusedGroupId: (s: EditorState): string | null => s.focusedGroupId,

	/** 円形配置モード状態 */
	circularMode: (s: EditorState): CircularModeState | null => s.circularMode,

	/** 最後のエラー */
	lastError: (s: EditorState): EditorError | null => s.lastError,
} as const;

// ============================================
// 便利なフック
// ============================================

/** ボードを取得 */
export function useBoard(): BoardData {
	return useEditorSelector(selectors.board);
}

/** オブジェクト配列を取得 */
export function useObjects(): BoardObject[] {
	return useEditorSelectorShallow(selectors.objects);
}

/** 選択インデックスを取得 */
export function useSelectedIndices(): number[] {
	return useEditorSelectorShallow(selectors.selectedIndices);
}

/** グリッド設定を取得 */
export function useGridSettings(): GridSettings {
	return useEditorSelector(selectors.gridSettings);
}

/** グループ配列を取得 */
export function useGroups(): ObjectGroup[] {
	return useEditorSelectorShallow(selectors.groups);
}

/** 履歴を取得 */
export function useHistory(): {
	history: HistoryEntry[];
	historyIndex: number;
} {
	const history = useEditorSelectorShallow(selectors.history);
	const historyIndex = useEditorSelector(selectors.historyIndex);
	return { history, historyIndex };
}

/** クリップボードを取得 */
export function useClipboard(): BoardObject[] | null {
	return useEditorSelectorShallow(selectors.clipboard);
}

/** 円形配置モードを取得 */
export function useCircularMode(): CircularModeState | null {
	return useEditorSelector(selectors.circularMode);
}

/** 最後のエラーを取得 */
export function useLastError(): EditorError | null {
	return useEditorSelector(selectors.lastError);
}

/** 編集中のテキストインデックスを取得 */
export function useEditingTextIndex(): number | null {
	return useEditorSelector(selectors.editingTextIndex);
}

/** フォーカス中のグループIDを取得 */
export function useFocusedGroupId(): string | null {
	return useEditorSelector(selectors.focusedGroupId);
}

/** isDirtyを取得 */
export function useIsDirty(): boolean {
	return useEditorSelector(selectors.isDirty);
}
