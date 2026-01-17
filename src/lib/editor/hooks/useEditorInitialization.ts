/**
 * Editor initialization hook
 *
 * Orchestrates editor startup:
 * - Multi-import from Viewer
 * - Single import from URL
 * - Open last edited board
 * - Create first board
 */

import { useEffect, useRef, useState } from "react";
import type { BoardsError } from "@/lib/boards";
import type { StoredBoard } from "@/lib/boards/schema";
import type { UseEditorBoardManagerReturn } from "./useEditorBoardManager";
import type { UseEditorImportReturn } from "./useEditorImport";

/** URL search params for editor page */
export interface EditorSearchParams {
	stgy?: string;
	import?: string;
	key?: string;
}

/** Options for useEditorInitialization */
export interface UseEditorInitializationOptions {
	/** Board manager hooks */
	boardManager: UseEditorBoardManagerReturn;
	/** Import hooks */
	importManager: UseEditorImportReturn;
	/** URL search params */
	searchParams: EditorSearchParams;
	/** Navigation function to clear URL params */
	navigate: (options: { to: string; search: object; replace: boolean }) => void;
	/** Whether boards are loading from IndexedDB */
	isLoadingBoards: boolean;
	/** Storage error if any */
	storageError: BoardsError | null;
	/** Available boards from useBoards */
	boards: StoredBoard[];
}

/** Return type for useEditorInitialization */
export interface UseEditorInitializationReturn {
	/** Whether initialization is complete */
	isInitialized: boolean;
}

/**
 * Hook for orchestrating editor initialization
 */
export function useEditorInitialization(
	options: UseEditorInitializationOptions,
): UseEditorInitializationReturn {
	const {
		boardManager,
		importManager,
		searchParams,
		navigate,
		isLoadingBoards,
		storageError,
		boards,
	} = options;

	const {
		stgy: codeFromUrl,
		import: importMode,
		key: importKey,
	} = searchParams;
	const { openBoard, createNewBoard, currentBoardId } = boardManager;
	const { importFromUrl, importMultiple, setPendingImport } = importManager;

	const [isInitialized, setIsInitialized] = useState(false);
	const initializingRef = useRef(false);

	// Auto-initialize: handle imports or open/create board
	useEffect(() => {
		// Wait for loading to complete, skip if error
		if (isLoadingBoards || isInitialized || storageError) return;

		// Prevent multiple initialization attempts (race condition with boards update)
		if (initializingRef.current) return;
		initializingRef.current = true;

		const initializeEditor = async () => {
			// Check for multi-import from viewer
			if (importMode === "multi" && importKey) {
				// Clear URL parameter immediately
				navigate({ to: "/editor", search: {}, replace: true });

				const { boardIds, folderName } = await importMultiple(importKey);
				if (boardIds.length > 0) {
					// Set pending board IDs to be opened in tabs
					setPendingImport(boardIds, folderName);
					// Open the first imported board
					openBoard(boardIds[0]);
					setIsInitialized(true);
					return;
				}
				// No boards created, continue to normal flow
			}

			// Check for stgy code in URL query parameter (from Image Generator page)
			if (codeFromUrl) {
				// Clear URL parameter immediately to prevent re-processing on state updates
				navigate({ to: "/editor", search: {}, replace: true });

				const result = await importFromUrl(codeFromUrl);
				if (result) {
					// Import successful
					setIsInitialized(true);
					return;
				}
				// result === false: decode failed or cancelled, continue to normal flow
			}

			if (boards.length === 0) {
				// First time: auto-create a new board
				await createNewBoard();
				setIsInitialized(true);
			} else if (!currentBoardId) {
				// Revisit: open the most recently updated board
				const mostRecentBoard = boards[0]; // Already sorted by updatedAt desc
				openBoard(mostRecentBoard.id);
				setIsInitialized(true);
			} else {
				// Already have a board open
				setIsInitialized(true);
			}
		};

		initializeEditor();
	}, [
		isLoadingBoards,
		isInitialized,
		boards,
		currentBoardId,
		storageError,
		codeFromUrl,
		importMode,
		importKey,
		createNewBoard,
		openBoard,
		importFromUrl,
		importMultiple,
		setPendingImport,
		navigate,
	]);

	return {
		isInitialized,
	};
}
