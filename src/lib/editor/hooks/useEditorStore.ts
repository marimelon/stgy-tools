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

	/** 選択中のID配列 */
	selectedIds: (s: EditorState): string[] => s.selectedIds,

	/** 選択数 */
	selectionCount: (s: EditorState): number => s.selectedIds.length,

	/** 何か選択されているか */
	hasSelection: (s: EditorState): boolean => s.selectedIds.length > 0,

	/** 単一選択か */
	hasSingleSelection: (s: EditorState): boolean => s.selectedIds.length === 1,

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

	/** 編集中のテキストID */
	editingTextId: (s: EditorState): string | null => s.editingTextId,

	/** テキスト編集中か */
	isEditingText: (s: EditorState): boolean => s.editingTextId !== null,

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

/**
 * ボードを取得
 * 注意: オブジェクト移動時など頻繁に再レンダリングが発生します
 * 特定のプロパティのみ必要な場合は、useBoardName, useBackgroundId, useObjects を使用してください
 */
export function useBoard(): BoardData {
	return useEditorSelector(selectors.board);
}

/** ボード名を取得（オブジェクト移動で再レンダリングしない） */
export function useBoardName(): string {
	return useEditorSelector(selectors.boardName);
}

/** 背景IDを取得（オブジェクト移動で再レンダリングしない） */
export function useBackgroundId(): number {
	return useEditorSelector(selectors.backgroundId);
}

/** オブジェクト配列を取得 */
export function useObjects(): BoardObject[] {
	return useEditorSelectorShallow(selectors.objects);
}

/** 選択IDを取得 */
export function useSelectedIds(): string[] {
	return useEditorSelectorShallow(selectors.selectedIds);
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

/** 円形配置モードを取得 */
export function useCircularMode(): CircularModeState | null {
	return useEditorSelector(selectors.circularMode);
}

/** 最後のエラーを取得 */
export function useLastError(): EditorError | null {
	return useEditorSelector(selectors.lastError);
}

/** 編集中のテキストIDを取得 */
export function useEditingTextId(): string | null {
	return useEditorSelector(selectors.editingTextId);
}

/** フォーカス中のグループIDを取得 */
export function useFocusedGroupId(): string | null {
	return useEditorSelector(selectors.focusedGroupId);
}

/** isDirtyを取得 */
export function useIsDirty(): boolean {
	return useEditorSelector(selectors.isDirty);
}
