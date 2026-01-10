/**
 * React hooks for folder storage operations
 */

import { useLiveQuery } from "@tanstack/react-db";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBoardsContext } from "./BoardsProvider";
import type { StoredFolder } from "./schema";

/** Sort options for folder list */
export type FolderSortOption = "order" | "name" | "updatedAt";

/** Sort direction */
export type FolderSortDirection = "asc" | "desc";

/** Options for useFolders hook */
export interface UseFoldersOptions {
	sortBy?: FolderSortOption;
	sortDirection?: FolderSortDirection;
}

/** Undo timeout in milliseconds */
const UNDO_TIMEOUT_MS = 5000;

/**
 * Main hook for folder CRUD operations with live query
 */
export function useFolders(options: UseFoldersOptions = {}) {
	const { sortBy = "order", sortDirection = "asc" } = options;

	// Get collection from context
	const { foldersCollection, storageMode, isInitializing } = useBoardsContext();

	// Live Query: Get all folders
	const { data: rawData, isLoading: isQueryLoading } = useLiveQuery((q) =>
		q.from({ folder: foldersCollection }),
	);

	// Cast to correct type
	const data = rawData as StoredFolder[] | undefined;

	// Combined loading state
	const isLoading = isInitializing || isQueryLoading;

	// Local state for collapsed folders (not persisted to DB to avoid flicker)
	const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

	// Client-side sorting and apply local collapsed state
	const folders = (data ?? [])
		.map((folder) => ({
			...folder,
			// Override DB collapsed with local state
			collapsed: collapsedIds.has(folder.id),
		}))
		.sort((a, b) => {
			let comparison = 0;
			if (sortBy === "name") {
				comparison = a.name.localeCompare(b.name);
			} else if (sortBy === "updatedAt") {
				comparison =
					new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
			} else {
				// order
				comparison = a.order - b.order;
			}
			return sortDirection === "desc" ? -comparison : comparison;
		});

	const [deletedFolder, setDeletedFolder] = useState<StoredFolder | null>(null);
	const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Clear undo timeout on unmount
	useEffect(() => {
		return () => {
			if (undoTimeoutRef.current) {
				clearTimeout(undoTimeoutRef.current);
			}
		};
	}, []);

	// Create a new folder
	const createFolder = useCallback(
		async (name: string): Promise<string> => {
			const id = crypto.randomUUID();
			const now = new Date().toISOString();
			// Get max order
			const maxOrder = folders.reduce((max, f) => Math.max(max, f.order), 0);
			foldersCollection.insert({
				id,
				name,
				parentId: null, // Currently always null for flat structure
				order: maxOrder + 1,
				collapsed: false,
				createdAt: now,
				updatedAt: now,
			});
			return id;
		},
		[foldersCollection, folders],
	);

	// Update an existing folder
	const updateFolder = useCallback(
		async (
			id: string,
			updates: Partial<Pick<StoredFolder, "name" | "collapsed" | "order">>,
		): Promise<void> => {
			foldersCollection.update(id, (draft: StoredFolder) => {
				if (updates.name !== undefined) draft.name = updates.name;
				if (updates.collapsed !== undefined)
					draft.collapsed = updates.collapsed;
				if (updates.order !== undefined) draft.order = updates.order;
				draft.updatedAt = new Date().toISOString();
			});
		},
		[foldersCollection],
	);

	// Delete a folder (with undo support)
	// Note: Boards in the folder should be moved to root before calling this
	const deleteFolder = useCallback(
		(id: string) => {
			// Find the folder before deleting
			const folderToDelete = folders.find((f) => f.id === id);
			if (!folderToDelete) return;

			// Clear previous undo timeout
			if (undoTimeoutRef.current) {
				clearTimeout(undoTimeoutRef.current);
			}

			// Store for undo
			setDeletedFolder(folderToDelete);

			// Delete from collection
			foldersCollection.delete(id);

			// Set timeout to clear undo
			undoTimeoutRef.current = setTimeout(() => {
				setDeletedFolder(null);
			}, UNDO_TIMEOUT_MS);
		},
		[folders, foldersCollection],
	);

	const undoDelete = useCallback(() => {
		if (!deletedFolder) return;

		// Clear timeout
		if (undoTimeoutRef.current) {
			clearTimeout(undoTimeoutRef.current);
			undoTimeoutRef.current = null;
		}

		// Re-insert the folder
		foldersCollection.insert(deletedFolder);

		// Clear undo state
		setDeletedFolder(null);
	}, [deletedFolder, foldersCollection]);

	// Dismiss undo toast
	const dismissUndo = useCallback(() => {
		if (undoTimeoutRef.current) {
			clearTimeout(undoTimeoutRef.current);
			undoTimeoutRef.current = null;
		}
		setDeletedFolder(null);
	}, []);

	// Reorder folders
	const reorderFolders = useCallback(
		async (orderedIds: string[]): Promise<void> => {
			// Update order for each folder
			for (let i = 0; i < orderedIds.length; i++) {
				const id = orderedIds[i];
				foldersCollection.update(id, (draft: StoredFolder) => {
					draft.order = i;
					draft.updatedAt = new Date().toISOString();
				});
			}
		},
		[foldersCollection],
	);

	// Toggle collapsed state (local only, not persisted)
	const toggleCollapsed = useCallback((id: string): void => {
		setCollapsedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	// Get folder by ID
	const getFolder = useCallback(
		(id: string): StoredFolder | undefined => {
			return folders.find((f) => f.id === id);
		},
		[folders],
	);

	return {
		folders,
		isLoading,
		storageMode,
		createFolder,
		updateFolder,
		deleteFolder,
		reorderFolders,
		toggleCollapsed,
		getFolder,
		// Undo support
		deletedFolder,
		undoDelete,
		dismissUndo,
	};
}
