/**
 * Editor import hook
 *
 * Manages import operations:
 * - URL import (single board from query parameter)
 * - Multi-import from Viewer (via session storage)
 * - Import success notification
 */

import NiceModal from "@ebay/nice-modal-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	DuplicateBoardModal,
	type DuplicateBoardResult,
} from "@/components/editor";
import { useBoards, useFolders } from "@/lib/boards";
import type { StoredBoard } from "@/lib/boards/schema";
import {
	assignBoardObjectIds,
	type BoardData,
	decodeStgy,
	parseBoardData,
} from "@/lib/stgy";
import type { GridSettings } from "../types";
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

/** Import success notification data */
export interface ImportSuccess {
	count: number;
	folderName: string;
}

/** Options for useEditorImport */
export interface UseEditorImportOptions {
	/** Callback when single import creates a new board */
	onBoardCreated: (boardId: string, board: BoardData, stgyCode: string) => void;
	/** Callback to open an existing board (for duplicate detection) */
	onOpenBoard: (boardId: string) => boolean;
	/** Callback to create a new board (fallback) */
	onCreateNewBoard: () => Promise<string>;
	/** Navigation function to clear URL params */
	navigate: (options: { to: string; search: object; replace: boolean }) => void;
	/** Available boards (for fallback when import cancelled) */
	boards: StoredBoard[];
}

/** Return type for useEditorImport */
export interface UseEditorImportReturn {
	/** Board IDs to open in tabs after multi-import */
	pendingImportBoardIds: string[] | null;
	/** Success toast data */
	importSuccess: ImportSuccess | null;
	/** Import a single board from URL query parameter */
	importFromUrl: (code: string) => Promise<boolean>;
	/** Import multiple boards from session storage (from Viewer) */
	importMultiple: (
		sessionKey: string,
	) => Promise<{ boardIds: string[]; folderName: string }>;
	/** Clear pending import board IDs (after tabs consumed them) */
	clearPendingImport: () => void;
	/** Clear import success toast */
	clearImportSuccess: () => void;
	/** Set pending import board IDs and show success toast */
	setPendingImport: (boardIds: string[], folderName: string) => void;
}

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
 * Hook for managing editor import operations
 */
export function useEditorImport(
	options: UseEditorImportOptions,
): UseEditorImportReturn {
	const { onBoardCreated, onOpenBoard, onCreateNewBoard, navigate, boards } =
		options;
	const { t } = useTranslation();
	const { createBoard, findBoardByContent } = useBoards();
	const { createFolder, deleteFolder } = useFolders();

	// Import state
	const [pendingImportBoardIds, setPendingImportBoardIds] = useState<
		string[] | null
	>(null);
	const [importSuccess, setImportSuccess] = useState<ImportSuccess | null>(
		null,
	);

	// Import a single board from URL
	const importFromUrl = useCallback(
		async (code: string): Promise<boolean> => {
			const trimmedCode = code.trim();

			// Check for existing board with same content (ignores encryption key)
			const existingBoard = await findBoardByContent(trimmedCode);
			if (existingBoard) {
				// Show duplicate detection modal using nice-modal
				const result = (await NiceModal.show(DuplicateBoardModal, {
					existingBoard,
				})) as DuplicateBoardResult;

				// Clear URL parameter
				navigate({ to: "/editor", search: {}, replace: true });

				if (result === "open-existing") {
					onOpenBoard(existingBoard.id);
					return true;
				}
				if (result === "create-new") {
					const decodedBoard = decodeBoardFromStgy(trimmedCode);
					if (!decodedBoard) {
						console.warn("Failed to decode board from pending import");
						return false;
					}

					const boardName =
						decodedBoard.name || t("boardManager.defaultBoardName");
					const newBoardId = await createBoard(
						boardName,
						trimmedCode,
						[],
						DEFAULT_GRID_SETTINGS,
					);

					onBoardCreated(
						newBoardId,
						{ ...decodedBoard, name: boardName },
						trimmedCode,
					);
					return true;
				}

				// Cancelled - open most recent board or create new one
				if (boards.length > 0) {
					onOpenBoard(boards[0].id);
				} else {
					await onCreateNewBoard();
				}
				return false;
			}

			// Decode the stgy code
			const decodedBoard = decodeBoardFromStgy(trimmedCode);
			if (!decodedBoard) {
				console.warn("Failed to decode board from URL parameter");
				return false;
			}

			// Create a new board with the imported data
			const boardName = decodedBoard.name || t("boardManager.defaultBoardName");
			const newBoardId = await createBoard(
				boardName,
				trimmedCode,
				[],
				DEFAULT_GRID_SETTINGS,
			);

			onBoardCreated(
				newBoardId,
				{ ...decodedBoard, name: boardName },
				trimmedCode,
			);

			// Clear the URL parameter to prevent re-import on refresh
			navigate({ to: "/editor", search: {}, replace: true });

			return true;
		},
		[
			createBoard,
			t,
			navigate,
			findBoardByContent,
			boards,
			onOpenBoard,
			onCreateNewBoard,
			onBoardCreated,
		],
	);

	// Import multiple boards from Viewer
	const importMultiple = useCallback(
		async (
			sessionKey: string,
		): Promise<{ boardIds: string[]; folderName: string }> => {
			const storageKey = `board-import-${sessionKey}`;
			const data = sessionStorage.getItem(storageKey);
			if (!data) return { boardIds: [], folderName: "" };

			try {
				const parsed = JSON.parse(data) as {
					stgyCodes: string[];
					folderName: string;
				};
				const { stgyCodes, folderName } = parsed;

				if (!stgyCodes || stgyCodes.length === 0)
					return { boardIds: [], folderName: "" };

				// Create folder first
				const folderId = await createFolder(folderName);

				// Create boards
				const createdBoardIds: string[] = [];
				for (const stgyCode of stgyCodes) {
					const decodedBoard = decodeBoardFromStgy(stgyCode);
					if (!decodedBoard) continue;

					const boardName =
						decodedBoard.name || t("boardManager.defaultBoardName");
					const newBoardId = await createBoard(
						boardName,
						stgyCode,
						[],
						DEFAULT_GRID_SETTINGS,
						folderId,
					);
					createdBoardIds.push(newBoardId);
				}

				// Clear session storage
				sessionStorage.removeItem(storageKey);

				// If no boards were created, delete the empty folder
				if (createdBoardIds.length === 0) {
					deleteFolder(folderId);
					return { boardIds: [], folderName: "" };
				}

				return { boardIds: createdBoardIds, folderName };
			} catch (error) {
				console.warn("Failed to parse multi-import data:", error);
				sessionStorage.removeItem(storageKey);
				return { boardIds: [], folderName: "" };
			}
		},
		[createBoard, createFolder, deleteFolder, t],
	);

	// Clear pending import board IDs
	const clearPendingImport = useCallback(() => {
		setPendingImportBoardIds(null);
	}, []);

	// Clear import success toast
	const clearImportSuccess = useCallback(() => {
		setImportSuccess(null);
	}, []);

	// Set pending import and show success toast
	const setPendingImport = useCallback(
		(boardIds: string[], folderName: string) => {
			setPendingImportBoardIds(boardIds);
			setImportSuccess({ count: boardIds.length, folderName });
		},
		[],
	);

	// Auto-dismiss import success toast after 5 seconds
	useEffect(() => {
		if (importSuccess) {
			const timer = setTimeout(() => {
				setImportSuccess(null);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [importSuccess]);

	return {
		pendingImportBoardIds,
		importSuccess,
		importFromUrl,
		importMultiple,
		clearPendingImport,
		clearImportSuccess,
		setPendingImport,
	};
}
