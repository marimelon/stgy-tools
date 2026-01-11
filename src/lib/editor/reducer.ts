/**
 * Editor initial state generation
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

/** Default grid settings */
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
 * Initial state generation options
 */
export interface CreateInitialStateOptions {
	board: BoardData;
	groups?: ObjectGroup[];
	gridSettings?: GridSettings;
	/** History to restore (from global history store) */
	history?: HistoryEntry[];
	/** History index to restore (from global history store) */
	historyIndex?: number;
}

/**
 * Generate initial state
 */
export function createInitialState(board: BoardData): EditorState {
	return createInitialStateWithOptions({ board });
}

/**
 * Generate initial state with options
 */
export function createInitialStateWithOptions(
	options: CreateInitialStateOptions,
): EditorState {
	const { board, groups = [], gridSettings, history, historyIndex } = options;
	const initialGroups = structuredClone(groups);
	const initialGridSettings = gridSettings
		? { ...gridSettings }
		: { ...DEFAULT_GRID_SETTINGS };

	// Use restored history if available, otherwise create initial history
	const initialHistory = history ?? [
		{
			id: generateHistoryId(),
			board: structuredClone(board),
			groups: initialGroups,
			description: i18n.t("history.initial"),
		},
	];
	const initialHistoryIndex = historyIndex ?? 0;

	// Restore current board state from history
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
