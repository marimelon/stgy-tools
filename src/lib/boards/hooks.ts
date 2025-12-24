/**
 * React hooks for board storage operations
 */

import { useLiveQuery } from "@tanstack/react-db";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GridSettings, ObjectGroup } from "@/lib/editor/types";
import { boardsCollection } from "./collection";
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
	const {
		data,
		isLoading,
		error: queryError,
	} = useLiveQuery((q) => q.from({ board: boardsCollection }));

	// Handle query errors
	useEffect(() => {
		if (queryError) {
			const errorMessage =
				queryError instanceof Error ? queryError.message : String(queryError);

			// Detect IndexedDB unavailability (common in private browsing)
			if (
				errorMessage.includes("IndexedDB") ||
				errorMessage.includes("IDBDatabase") ||
				errorMessage.includes("access denied") ||
				errorMessage.includes("QuotaExceededError")
			) {
				setError({
					type: "indexeddb_unavailable",
					message: errorMessage,
					originalError: queryError,
				});
			} else {
				setError({
					type: "load_failed",
					message: errorMessage,
					originalError: queryError,
				});
			}
		} else {
			setError(null);
		}
	}, [queryError]);

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

	// Undo state for delete
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

	// Create a new board
	const createBoard = useCallback(
		(
			name: string,
			stgyCode: string,
			encodeKey: number,
			groups: ObjectGroup[] = [],
			gridSettings: GridSettings = DEFAULT_GRID_SETTINGS,
		): string => {
			const id = crypto.randomUUID();
			const now = new Date().toISOString();
			boardsCollection.insert({
				id,
				name,
				stgyCode,
				encodeKey,
				groups,
				gridSettings,
				createdAt: now,
				updatedAt: now,
			});
			return id;
		},
		[],
	);

	// Update an existing board
	const updateBoard = useCallback(
		(
			id: string,
			updates: Partial<
				Pick<
					StoredBoard,
					"name" | "stgyCode" | "encodeKey" | "groups" | "gridSettings"
				>
			>,
		) => {
			boardsCollection.update(id, (draft) => {
				if (updates.name !== undefined) draft.name = updates.name;
				if (updates.stgyCode !== undefined) draft.stgyCode = updates.stgyCode;
				if (updates.encodeKey !== undefined)
					draft.encodeKey = updates.encodeKey;
				if (updates.groups !== undefined) draft.groups = updates.groups;
				if (updates.gridSettings !== undefined)
					draft.gridSettings = updates.gridSettings;
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

	// Undo delete
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

	// Get a single board by ID
	const getBoard = useCallback(
		(id: string): StoredBoard | undefined => {
			return boards.find((b) => b.id === id);
		},
		[boards],
	);

	// Clear error
	const clearError = useCallback(() => {
		setError(null);
	}, []);

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
		// Undo support
		deletedBoard,
		undoDelete,
		dismissUndo,
	};
}
