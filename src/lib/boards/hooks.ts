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
import { boardsCollection } from "./collection";
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
export type BoardsErrorType =
	| "indexeddb_unavailable"
	| "load_failed"
	| "unknown";

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

	// Error state
	const [error, setError] = useState<BoardsError | null>(null);

	// Live Query: Get all boards
	const { data, isLoading, isError, status } = useLiveQuery((q) =>
		q.from({ board: boardsCollection }),
	);

	// Handle query errors
	useEffect(() => {
		if (isError) {
			// Detect IndexedDB unavailability (common in private browsing)
			if (
				status.includes("IndexedDB") ||
				status.includes("IDBDatabase") ||
				status.includes("access denied") ||
				status.includes("QuotaExceededError")
			) {
				setError({
					type: "indexeddb_unavailable",
					message: status,
				});
			} else {
				setError({
					type: "load_failed",
					message: status,
				});
			}
		} else {
			setError(null);
		}
	}, [isError, status]);

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
		): Promise<string> => {
			const id = crypto.randomUUID();
			const now = new Date().toISOString();
			const contentHash = await generateContentHash(stgyCode);
			boardsCollection.insert({
				id,
				name,
				stgyCode,
				// encodeKey は保存しない（CRC32から決定的に計算されるため不要）
				groups,
				gridSettings,
				createdAt: now,
				updatedAt: now,
				contentHash: contentHash ?? undefined,
			});
			return id;
		},
		[],
	);

	// Update an existing board (with index-based groups for storage)
	const updateBoard = useCallback(
		async (
			id: string,
			updates: Partial<
				Pick<StoredBoard, "name" | "stgyCode" | "groups" | "gridSettings">
			>,
		): Promise<void> => {
			// If stgyCode is being updated, regenerate the content hash
			const contentHash = updates.stgyCode
				? await generateContentHash(updates.stgyCode)
				: undefined;

			boardsCollection.update(id, (draft) => {
				if (updates.name !== undefined) draft.name = updates.name;
				if (updates.stgyCode !== undefined) draft.stgyCode = updates.stgyCode;
				if (updates.groups !== undefined) draft.groups = updates.groups;
				if (updates.gridSettings !== undefined)
					draft.gridSettings = updates.gridSettings;
				if (contentHash != null) draft.contentHash = contentHash;
				draft.updatedAt = new Date().toISOString();
			});
		},
		[],
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
			boardsCollection.delete(id);

			// Set timeout to clear undo
			undoTimeoutRef.current = setTimeout(() => {
				setDeletedBoard(null);
			}, UNDO_TIMEOUT_MS);
		},
		[boards],
	);

	const undoDelete = useCallback(() => {
		if (!deletedBoard) return;

		// Clear timeout
		if (undoTimeoutRef.current) {
			clearTimeout(undoTimeoutRef.current);
			undoTimeoutRef.current = null;
		}

		// Re-insert the board
		boardsCollection.insert(deletedBoard);

		// Clear undo state
		setDeletedBoard(null);
	}, [deletedBoard]);

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
			boardsCollection.insert({
				...original,
				id: newId,
				name: `${original.name} (Copy)`,
				createdAt: now,
				updatedAt: now,
			});
			return newId;
		},
		[boards],
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
		createBoard,
		updateBoard,
		deleteBoard,
		duplicateBoard,
		getBoard,
		findBoardByContent,
		// ID-based operations
		loadBoard,
		saveBoard,
		createAndSaveBoard,
		// Undo support
		deletedBoard,
		undoDelete,
		dismissUndo,
	};
}
