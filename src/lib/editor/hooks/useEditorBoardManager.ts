/**
 * Editor board management hook
 *
 * Manages editor state for board CRUD operations:
 * - Opening/closing boards
 * - Creating new boards
 * - Saving board state
 * - Duplicating boards
 * - Handling decode errors
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBoards } from "@/lib/boards";
import {
	convertGroupsToIdBased,
	convertGroupsToIndexBased,
	type StoredObjectGroup,
} from "@/lib/boards/groupConversion";
import {
	assignBoardObjectIds,
	type BoardData,
	type BoardObject,
	decodeStgy,
	encodeStgy,
	parseBoardData,
} from "@/lib/stgy";
import { createEmptyBoard, recalculateBoardSize } from "../factory";
import type { GridSettings, ObjectGroup } from "../types";
import { DEFAULT_OVERLAY_SETTINGS } from "../types";

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

/** Decode error information */
export interface DecodeError {
	boardId: string;
	boardName: string;
}

/** Editor board state */
export interface EditorBoardState {
	/** Currently active board ID */
	currentBoardId: string | null;
	/** Board data for EditorStoreProvider initialization */
	initialBoard: BoardData;
	/** Groups for EditorStoreProvider initialization */
	initialGroups: ObjectGroup[];
	/** Grid settings for EditorStoreProvider initialization */
	initialGridSettings: GridSettings;
	/** Key to force re-render EditorProvider when switching boards */
	editorKey: number;
	/** Decode error for corrupted boards */
	decodeError: DecodeError | null;
}

/** Editor board actions */
export interface EditorBoardActions {
	/** Open an existing board by ID. Returns false if decode fails. */
	openBoard: (boardId: string) => boolean;
	/** Create a new empty board */
	createNewBoard: () => Promise<string>;
	/** Save current board state (for auto-save callback) */
	saveBoard: (
		name: string,
		stgyCode: string,
		groups: ObjectGroup[],
		gridSettings: GridSettings,
		objects: BoardObject[],
	) => void;
	/** Duplicate an existing board */
	duplicateBoard: (boardId: string) => void;
	/** Create a new board from imported stgy code */
	createBoardFromImport: (name: string, stgyCode: string) => Promise<void>;
	/** Clear decode error */
	clearDecodeError: () => void;
	/** Set board directly (for import operations) */
	setBoard: (
		boardId: string,
		board: BoardData,
		groups?: ObjectGroup[],
		gridSettings?: GridSettings,
	) => void;
}

/** Return type for useEditorBoardManager */
export interface UseEditorBoardManagerReturn
	extends EditorBoardState,
		EditorBoardActions {}

/**
 * Decode board from stgyCode
 */
function decodeBoardFromStgy(stgyCode: string): BoardData | null {
	try {
		const binary = decodeStgy(stgyCode);
		const parsed = parseBoardData(binary);
		return assignBoardObjectIds(parsed);
	} catch (error) {
		console.warn("Failed to decode stgy code:", error);
		return null;
	}
}

/**
 * Hook for managing editor board state
 */
export function useEditorBoardManager(): UseEditorBoardManagerReturn {
	const { t } = useTranslation();
	const { getBoard, createBoard, updateBoard } = useBoards();

	// Board state
	const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
	const [initialBoard, setInitialBoard] = useState<BoardData>(() =>
		createEmptyBoard(),
	);
	const [initialGroups, setInitialGroups] = useState<ObjectGroup[]>([]);
	const [initialGridSettings, setInitialGridSettings] = useState<GridSettings>(
		DEFAULT_GRID_SETTINGS,
	);
	const [editorKey, setEditorKey] = useState(0);
	const [decodeError, setDecodeError] = useState<DecodeError | null>(null);

	// Open an existing board
	const openBoard = useCallback(
		(boardId: string): boolean => {
			const board = getBoard(boardId);
			if (!board) return false;

			const decodedBoard = decodeBoardFromStgy(board.stgyCode);
			if (!decodedBoard) {
				// Show decode error dialog
				setDecodeError({ boardId: board.id, boardName: board.name });
				return false;
			}

			setDecodeError(null);
			setCurrentBoardId(boardId);
			// Use stored board name (may have been renamed) instead of decoded name
			setInitialBoard({ ...decodedBoard, name: board.name });
			// Convert stored groups (index-based) to runtime groups (ID-based)
			const runtimeGroups = convertGroupsToIdBased(
				board.groups as StoredObjectGroup[],
				decodedBoard.objects,
			);
			setInitialGroups(runtimeGroups);
			setInitialGridSettings(board.gridSettings);

			setEditorKey((prev) => prev + 1);
			return true;
		},
		[getBoard],
	);

	// Create a new empty board
	const createNewBoard = useCallback(async (): Promise<string> => {
		const defaultName = t("boardManager.defaultBoardName");
		const newBoard = createEmptyBoard(defaultName);

		const { width, height } = recalculateBoardSize(newBoard);
		const boardToSave = { ...newBoard, width, height };
		const stgyCode = encodeStgy(boardToSave);

		const newBoardId = await createBoard(
			newBoard.name,
			stgyCode,
			[],
			DEFAULT_GRID_SETTINGS,
		);

		setCurrentBoardId(newBoardId);
		setInitialBoard(newBoard);
		setInitialGroups([]);
		setInitialGridSettings(DEFAULT_GRID_SETTINGS);

		setEditorKey((prev) => prev + 1);
		return newBoardId;
	}, [createBoard, t]);

	// Save current board state
	const saveBoard = useCallback(
		(
			name: string,
			stgyCode: string,
			groups: ObjectGroup[],
			gridSettings: GridSettings,
			objects: BoardObject[],
		) => {
			if (currentBoardId) {
				const storedGroups = convertGroupsToIndexBased(groups, objects);
				void updateBoard(currentBoardId, {
					name,
					stgyCode,
					groups: storedGroups,
					gridSettings,
				});
			}
		},
		[currentBoardId, updateBoard],
	);

	// Duplicate an existing board
	const duplicateBoard = useCallback(
		(boardId: string) => {
			const board = getBoard(boardId);
			if (!board) return;
			void createBoard(
				`${board.name} (Copy)`,
				board.stgyCode,
				board.groups,
				board.gridSettings,
			);
		},
		[getBoard, createBoard],
	);

	// Create a new board from imported stgy code
	const createBoardFromImport = useCallback(
		async (name: string, stgyCode: string): Promise<void> => {
			const decodedBoard = decodeBoardFromStgy(stgyCode);
			if (!decodedBoard) {
				console.warn("Failed to decode imported board");
				return;
			}

			// Save new board to IndexedDB
			const newBoardId = await createBoard(
				name,
				stgyCode,
				[],
				DEFAULT_GRID_SETTINGS,
			);

			// Initialize editor directly (don't wait for IndexedDB reflection)
			setCurrentBoardId(newBoardId);
			setInitialBoard({ ...decodedBoard, name });
			setInitialGroups([]);
			setInitialGridSettings(DEFAULT_GRID_SETTINGS);

			setEditorKey((prev) => prev + 1);
		},
		[createBoard],
	);

	// Set board directly (for import operations)
	const setBoard = useCallback(
		(
			boardId: string,
			board: BoardData,
			groups: ObjectGroup[] = [],
			gridSettings: GridSettings = DEFAULT_GRID_SETTINGS,
		) => {
			setCurrentBoardId(boardId);
			setInitialBoard(board);
			setInitialGroups(groups);
			setInitialGridSettings(gridSettings);
			setEditorKey((prev) => prev + 1);
		},
		[],
	);

	// Clear decode error
	const clearDecodeError = useCallback(() => {
		setDecodeError(null);
	}, []);

	return {
		// State
		currentBoardId,
		initialBoard,
		initialGroups,
		initialGridSettings,
		editorKey,
		decodeError,
		// Actions
		openBoard,
		createNewBoard,
		saveBoard,
		duplicateBoard,
		createBoardFromImport,
		clearDecodeError,
		setBoard,
	};
}
