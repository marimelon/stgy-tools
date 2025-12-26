/**
 * React hooks for asset storage operations
 */

import { useLiveQuery } from "@tanstack/react-db";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardObject } from "@/lib/stgy";
import { assetsCollection } from "./collection";
import {
	ASSET_SCHEMA_VERSION,
	type AssetCategory,
	type StoredAsset,
} from "./schema";
import { calculateAssetBounds } from "./utils";

/** Sort options for asset list */
export type AssetSortOption = "updatedAt" | "createdAt" | "name";

/** Sort direction */
export type SortDirection = "asc" | "desc";

/** Options for useAssets hook */
export interface UseAssetsOptions {
	sortBy?: AssetSortOption;
	sortDirection?: SortDirection;
	searchQuery?: string;
	category?: AssetCategory | string;
}

/** Undo timeout in milliseconds */
const UNDO_TIMEOUT_MS = 5000;

/** Error types for asset operations */
export type AssetsErrorType =
	| "indexeddb_unavailable"
	| "load_failed"
	| "unknown";

export interface AssetsError {
	type: AssetsErrorType;
	message: string;
	originalError?: unknown;
}

/**
 * Main hook for asset CRUD operations with live query
 */
export function useAssets(options: UseAssetsOptions = {}) {
	const {
		sortBy = "updatedAt",
		sortDirection = "desc",
		searchQuery = "",
		category,
	} = options;

	// Error state
	const [error, setError] = useState<AssetsError | null>(null);

	// Live Query: Get all assets
	const { data, isLoading, isError, status } = useLiveQuery((q) =>
		q.from({ asset: assetsCollection }),
	);

	// Handle query errors
	useEffect(() => {
		if (isError) {
			// Set generic error when query fails
			setError({
				type: "load_failed",
				message: `Failed to load assets: ${status}`,
			});
		} else {
			setError(null);
		}
	}, [isError, status]);

	// Client-side filtering and sorting
	const assets = (data ?? [])
		.filter((asset) => {
			// Filter by search query
			if (searchQuery) {
				const matchesSearch = asset.name
					.toLowerCase()
					.includes(searchQuery.toLowerCase());
				if (!matchesSearch) return false;
			}
			// Filter by category
			if (category) {
				if (asset.category !== category) return false;
			}
			return true;
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
	const [deletedAsset, setDeletedAsset] = useState<StoredAsset | null>(null);
	const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Clear undo timeout on unmount
	useEffect(() => {
		return () => {
			if (undoTimeoutRef.current) {
				clearTimeout(undoTimeoutRef.current);
			}
		};
	}, []);

	// Create a new asset
	const createAsset = useCallback(
		(
			name: string,
			objects: BoardObject[],
			category?: AssetCategory | string,
		): string => {
			const id = crypto.randomUUID();
			const now = new Date().toISOString();
			const bounds = calculateAssetBounds(objects);

			assetsCollection.insert({
				id,
				version: ASSET_SCHEMA_VERSION,
				name,
				category,
				objects: structuredClone(objects),
				bounds,
				createdAt: now,
				updatedAt: now,
			});

			return id;
		},
		[],
	);

	// Update an existing asset
	const updateAsset = useCallback(
		(
			id: string,
			updates: Partial<Pick<StoredAsset, "name" | "category" | "objects">>,
		): void => {
			assetsCollection.update(id, (draft) => {
				if (updates.name !== undefined) draft.name = updates.name;
				if (updates.category !== undefined) draft.category = updates.category;
				if (updates.objects !== undefined) {
					draft.objects = structuredClone(updates.objects);
					draft.bounds = calculateAssetBounds(updates.objects);
				}
				draft.updatedAt = new Date().toISOString();
			});
		},
		[],
	);

	// Delete an asset (with undo support)
	const deleteAsset = useCallback(
		(id: string) => {
			// Find the asset before deleting
			const assetToDelete = assets.find((a) => a.id === id);
			if (!assetToDelete) return;

			// Clear previous undo timeout
			if (undoTimeoutRef.current) {
				clearTimeout(undoTimeoutRef.current);
			}

			// Store for undo
			setDeletedAsset(assetToDelete);

			// Delete from collection
			assetsCollection.delete(id);

			// Set timeout to clear undo
			undoTimeoutRef.current = setTimeout(() => {
				setDeletedAsset(null);
			}, UNDO_TIMEOUT_MS);
		},
		[assets],
	);

	// Undo delete
	const undoDelete = useCallback(() => {
		if (!deletedAsset) return;

		// Clear timeout
		if (undoTimeoutRef.current) {
			clearTimeout(undoTimeoutRef.current);
			undoTimeoutRef.current = null;
		}

		// Re-insert the asset
		assetsCollection.insert(deletedAsset);

		// Clear undo state
		setDeletedAsset(null);
	}, [deletedAsset]);

	// Dismiss undo toast
	const dismissUndo = useCallback(() => {
		if (undoTimeoutRef.current) {
			clearTimeout(undoTimeoutRef.current);
			undoTimeoutRef.current = null;
		}
		setDeletedAsset(null);
	}, []);

	// Duplicate an asset
	const duplicateAsset = useCallback(
		(id: string): string | null => {
			const original = assets.find((a) => a.id === id);
			if (!original) return null;

			const newId = crypto.randomUUID();
			const now = new Date().toISOString();
			assetsCollection.insert({
				...structuredClone(original),
				id: newId,
				name: `${original.name} (Copy)`,
				createdAt: now,
				updatedAt: now,
			});
			return newId;
		},
		[assets],
	);

	// Get a single asset by ID
	const getAsset = useCallback(
		(id: string): StoredAsset | undefined => {
			return assets.find((a) => a.id === id);
		},
		[assets],
	);

	// Clear error
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return {
		assets,
		isLoading,
		error,
		clearError,
		createAsset,
		updateAsset,
		deleteAsset,
		duplicateAsset,
		getAsset,
		// Undo support
		deletedAsset,
		undoDelete,
		dismissUndo,
	};
}
