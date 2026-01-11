/**
 * React hooks for board storage operations
 */

import { useLiveQuery } from "@tanstack/react-db";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GridSettings, ObjectGroup } from "@/lib/editor/types";
import {
	assignBoardObjectIdsDeterministic,
	decodeStgy,
	encodeStgy,
	parseBoardData,
} from "@/lib/stgy";
import type { BoardData } from "@/lib/stgy/types";
import { useBoardsContext } from "./BoardsProvider";
import {
	convertGroupsToIdBased,
	convertGroupsToIndexBased,
	type StoredObjectGroup,
} from "./groupConversion";
import { generateContentHash } from "./hash";
import { DEFAULT_GRID_SETTINGS, type StoredBoard } from "./schema";

/** Sort options for board list */
export type BoardSortOption = "updatedAt" | "createdAt" | "name";

/** Sort direction */
export type SortDirection = "asc" | "desc";

/** Options for useBoards hook */
export interface UseBoardsOptions {
	sortBy?: BoardSortOption;
	sortDirection?: SortDirection;
	searchQuery?: string;
}

/** Undo timeout in milliseconds */
const UNDO_TIMEOUT_MS = 5000;

/** Error types for board operations */
export type BoardsErrorType = "load_failed" | "unknown";

export interface BoardsError {
	type: BoardsErrorType;
	message: string;
	originalError?: unknown;
}

/**
 * Main hook for board CRUD operations with live query
 */
export function useBoards(options: UseBoardsOptions = {}) {
	const {
		sortBy = "updatedAt",
		sortDirection = "desc",
		searchQuery = "",
	} = options;

	// Get collection from context
	const { collection, storageMode, isInitializing } = useBoardsContext();

	// Error state
	const [error, setError] = useState<BoardsError | null>(null);

	// Track if we've attempted auto-repair (to prevent infinite loops)
	const [autoRepairAttempted, setAutoRepairAttempted] = useState(false);

	// Live Query: Get all boards
	const {
		data: rawData,
		isLoading: isQueryLoading,
		isError,
		status,
	} = useLiveQuery((q) => q.from({ board: collection }));

	// Cast to correct type (collection type varies between Dexie and localOnly)
	const data = rawData as StoredBoard[] | undefined;

	// Handle query errors
	useEffect(() => {
		if (isError) {
			// Schema validation error - attempt one auto-reload
			// The Zod schema with .catch() should auto-repair corrupted data
			if (!autoRepairAttempted && status.includes("Schema validation failed")) {
				console.warn(
					"Schema validation error detected. Auto-reloading to repair data...",
				);
				setAutoRepairAttempted(true);
				// Reload after a short delay to allow state updates
				setTimeout(() => {
					window.location.reload();
				}, 1000);
				return;
			}

			// Show error for other failures
			setError({
				type: "load_failed",
				message: status,
			});
		} else {
			setError(null);
		}
	}, [isError, status, autoRepairAttempted]);

	// Combined loading state
	const isLoading = isInitializing || isQueryLoading;

	// Client-side filtering and sorting
	const boards = (data ?? [])
		.filter((board) => {
			if (!searchQuery) return true;
			return board.name.toLowerCase().includes(searchQuery.toLowerCase());
		})
		.sort((a, b) => {
			let comparison = 0;
			if (sortBy === "name") {
				comparison = a.name.localeCompare(b.name);
			} else if (sortBy === "createdAt") {
				comparison =
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			} else {
				comparison =
					new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
			}
			return sortDirection === "desc" ? -comparison : comparison;
		});

	const [deletedBoard, setDeletedBoard] = useState<StoredBoard | null>(null);
	const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Clear undo timeout on unmount
	useEffect(() => {
		return () => {
			if (undoTimeoutRef.current) {
				clearTimeout(undoTimeoutRef.current);
			}
		};
	}, []);

	// Create a new board (with index-based groups for storage)
	const createBoard = useCallback(
		async (
			name: string,
			stgyCode: string,
			groups: StoredObjectGroup[] = [],
			gridSettings: GridSettings = DEFAULT_GRID_SETTINGS,
			folderId: string | null = null,
		): Promise<string> => {
			const id = crypto.randomUUID();
			const now = new Date().toISOString();
			const contentHash = await generateContentHash(stgyCode);
			collection.insert({
				id,
				name,
				stgyCode,
				// encodeKey は保存しない（CRC32から決定的に計算されるため不要）
				groups,
				gridSettings,
				folderId,
				createdAt: now,
				updatedAt: now,
				contentHash: contentHash ?? undefined,
			});
			return id;
		},
		[collection],
	);

	// Update an existing board (with index-based groups for storage)
	const updateBoard = useCallback(
		async (
			id: string,
			updates: Partial<
				Pick<
					StoredBoard,
					"name" | "stgyCode" | "groups" | "gridSettings" | "folderId"
				>
			>,
		): Promise<void> => {
			// If stgyCode is being updated, regenerate the content hash
			const contentHash = updates.stgyCode
				? await generateContentHash(updates.stgyCode)
				: undefined;

			collection.update(id, (draft: StoredBoard) => {
				if (updates.name !== undefined) draft.name = updates.name;
				if (updates.stgyCode !== undefined) draft.stgyCode = updates.stgyCode;
				if (updates.groups !== undefined) draft.groups = updates.groups;
				if (updates.gridSettings !== undefined)
					draft.gridSettings = updates.gridSettings;
				if (updates.folderId !== undefined) draft.folderId = updates.folderId;
				if (contentHash != null) draft.contentHash = contentHash;
				draft.updatedAt = new Date().toISOString();
			});
		},
		[collection],
	);

	// Move a board to a folder (or to root if folderId is null)
	const moveBoardToFolder = useCallback(
		async (boardId: string, folderId: string | null): Promise<void> => {
			await updateBoard(boardId, { folderId });
		},
		[updateBoard],
	);

	// Get boards by folder ID (null = root/uncategorized)
	const getBoardsByFolder = useCallback(
		(folderId: string | null): StoredBoard[] => {
			return boards.filter((b) => b.folderId === folderId);
		},
		[boards],
	);

	// Delete a board (with undo support)
	const deleteBoard = useCallback(
		(id: string) => {
			// Find the board before deleting
			const boardToDelete = boards.find((b) => b.id === id);
			if (!boardToDelete) return;

			// Clear previous undo timeout
			if (undoTimeoutRef.current) {
				clearTimeout(undoTimeoutRef.current);
			}

			// Store for undo
			setDeletedBoard(boardToDelete);

			// Delete from collection
			collection.delete(id);

			// Set timeout to clear undo
			undoTimeoutRef.current = setTimeout(() => {
				setDeletedBoard(null);
			}, UNDO_TIMEOUT_MS);
		},
		[boards, collection],
	);

	// Delete board permanently without undo support (for batch operations like folder deletion)
	const deleteBoardPermanently = useCallback(
		(id: string) => {
			collection.delete(id);
		},
		[collection],
	);

	const undoDelete = useCallback(() => {
		if (!deletedBoard) return;

		// Clear timeout
		if (undoTimeoutRef.current) {
			clearTimeout(undoTimeoutRef.current);
			undoTimeoutRef.current = null;
		}

		// Re-insert the board
		collection.insert(deletedBoard);

		// Clear undo state
		setDeletedBoard(null);
	}, [deletedBoard, collection]);

	// Dismiss undo toast
	const dismissUndo = useCallback(() => {
		if (undoTimeoutRef.current) {
			clearTimeout(undoTimeoutRef.current);
			undoTimeoutRef.current = null;
		}
		setDeletedBoard(null);
	}, []);

	// Duplicate a board
	const duplicateBoard = useCallback(
		(id: string): string | null => {
			const original = boards.find((b) => b.id === id);
			if (!original) return null;

			const newId = crypto.randomUUID();
			const now = new Date().toISOString();
			collection.insert({
				...original,
				id: newId,
				name: `${original.name} (Copy)`,
				createdAt: now,
				updatedAt: now,
			});
			return newId;
		},
		[boards, collection],
	);

	const getBoard = useCallback(
		(id: string): StoredBoard | undefined => {
			return boards.find((b) => b.id === id);
		},
		[boards],
	);

	// Find a board by content (uses hash for fast comparison, falls back to binary for old data)
	const findBoardByContent = useCallback(
		async (stgyCode: string): Promise<StoredBoard | undefined> => {
			// Generate hash for the incoming stgy code
			const incomingHash = await generateContentHash(stgyCode);
			if (!incomingHash) return undefined;

			// First, try to find by hash (fast path)
			const matchByHash = boards.find((b) => b.contentHash === incomingHash);
			if (matchByHash) return matchByHash;

			// Fallback: check boards without contentHash using binary comparison
			const boardsWithoutHash = boards.filter((b) => !b.contentHash);
			if (boardsWithoutHash.length === 0) return undefined;

			// Decode incoming stgy code for binary comparison
			let incomingBinary: Uint8Array;
			try {
				incomingBinary = decodeStgy(stgyCode);
			} catch {
				return undefined;
			}

			// Compare with each board's decoded binary
			return boardsWithoutHash.find((board) => {
				try {
					const existingBinary = decodeStgy(board.stgyCode);
					if (incomingBinary.length !== existingBinary.length) return false;
					return incomingBinary.every(
						(byte, index) => byte === existingBinary[index],
					);
				} catch {
					return false;
				}
			});
		},
		[boards],
	);

	// Clear error
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	/**
	 * Load board with ID assignment (index → ID conversion)
	 * 決定論的ID生成を使用（同じstgyCode → 同じID）
	 * @param id Board ID
	 * @returns Board data with IDs assigned, or null if not found
	 */
	const loadBoard = useCallback(
		(
			id: string,
		): {
			board: BoardData;
			groups: ObjectGroup[];
			gridSettings: GridSettings;
		} | null => {
			const stored = boards.find((b) => b.id === id);
			if (!stored) return null;

			try {
				const binary = decodeStgy(stored.stgyCode);
				const parsed = parseBoardData(binary);

				// Assign deterministic IDs to objects
				const board = assignBoardObjectIdsDeterministic(parsed);

				// Convert groups from index-based to ID-based
				const groups = convertGroupsToIdBased(
					stored.groups as StoredObjectGroup[],
					board.objects,
				);

				return {
					board,
					groups,
					gridSettings: stored.gridSettings,
				};
			} catch {
				return null;
			}
		},
		[boards],
	);

	/**
	 * Save board with ID removal (ID → index conversion)
	 * @param id Board ID
	 * @param data Board data with IDs
	 */
	const saveBoard = useCallback(
		async (
			id: string,
			data: {
				board: BoardData;
				groups: ObjectGroup[];
				gridSettings: GridSettings;
				encodeKey: number;
			},
		): Promise<void> => {
			// Convert groups from ID-based to index-based
			const storedGroups = convertGroupsToIndexBased(
				data.groups,
				data.board.objects,
			);

			// Encode board (IDs are not included in binary format)
			const stgyCode = encodeStgy(data.board);

			await updateBoard(id, {
				stgyCode,
				groups: storedGroups,
				gridSettings: data.gridSettings,
			});
		},
		[updateBoard],
	);

	/**
	 * Create and save a new board with ID-based data
	 * @returns New board ID
	 */
	const createAndSaveBoard = useCallback(
		async (
			name: string,
			data: {
				board: BoardData;
				groups: ObjectGroup[];
				gridSettings: GridSettings;
				encodeKey: number;
			},
		): Promise<string> => {
			// Convert groups from ID-based to index-based
			const storedGroups = convertGroupsToIndexBased(
				data.groups,
				data.board.objects,
			);

			// Encode board (IDs are not included in binary format)
			const stgyCode = encodeStgy(data.board);

			return createBoard(name, stgyCode, storedGroups, data.gridSettings);
		},
		[createBoard],
	);

	return {
		boards,
		isLoading,
		error,
		clearError,
		storageMode,
		createBoard,
		updateBoard,
		deleteBoard,
		deleteBoardPermanently,
		duplicateBoard,
		getBoard,
		findBoardByContent,
		// ID-based operations
		loadBoard,
		saveBoard,
		createAndSaveBoard,
		// Folder operations
		moveBoardToFolder,
		getBoardsByFolder,
		// Undo support
		deletedBoard,
		undoDelete,
		dismissUndo,
	};
}
