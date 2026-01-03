/**
 * エディター初期状態の生成
 */

import i18n from "@/lib/i18n";
import type { BoardData } from "@/lib/stgy";
import {
	DEFAULT_OVERLAY_SETTINGS,
	type EditorState,
	type GridSettings,
	type HistoryEntry,
	type ObjectGroup,
} from "./types";
import { generateHistoryId } from "./utils";

/** デフォルトのグリッド設定 */
const DEFAULT_GRID_SETTINGS: GridSettings = {
	enabled: false,
	size: 16,
	showGrid: false,
	overlayType: "none",
	showBackground: true,
	canvasColor: "slate-800",
	overlaySettings: DEFAULT_OVERLAY_SETTINGS,
};

/**
 * 初期状態生成オプション
 */
export interface CreateInitialStateOptions {
	board: BoardData;
	groups?: ObjectGroup[];
	gridSettings?: GridSettings;
	/** 復元する履歴（グローバル履歴ストアから） */
	history?: HistoryEntry[];
	/** 復元する履歴インデックス（グローバル履歴ストアから） */
	historyIndex?: number;
}

/**
 * 初期状態を生成
 */
export function createInitialState(board: BoardData): EditorState {
	return createInitialStateWithOptions({ board });
}

/**
 * オプション付きで初期状態を生成
 */
export function createInitialStateWithOptions(
	options: CreateInitialStateOptions,
): EditorState {
	const { board, groups = [], gridSettings, history, historyIndex } = options;
	const initialGroups = structuredClone(groups);
	const initialGridSettings = gridSettings
		? { ...gridSettings }
		: { ...DEFAULT_GRID_SETTINGS };

	// 復元された履歴があればそれを使用、なければ初期履歴を作成
	const initialHistory = history ?? [
		{
			id: generateHistoryId(),
			board: structuredClone(board),
			groups: initialGroups,
			description: i18n.t("history.initial"),
		},
	];
	const initialHistoryIndex = historyIndex ?? 0;

	// 履歴から現在のボード状態を復元
	const currentEntry = initialHistory[initialHistoryIndex];
	const currentBoard = currentEntry
		? structuredClone(currentEntry.board)
		: structuredClone(board);
	const currentGroups = currentEntry
		? structuredClone(currentEntry.groups)
		: initialGroups;

	return {
		board: currentBoard,
		selectedIds: [],
		groups: currentGroups,
		gridSettings: initialGridSettings,
		history: initialHistory,
		historyIndex: initialHistoryIndex,
		isDirty: initialHistoryIndex > 0,
		editingTextId: null,
		lastError: null,
		focusedGroupId: null,
		circularMode: null,
	};
}
