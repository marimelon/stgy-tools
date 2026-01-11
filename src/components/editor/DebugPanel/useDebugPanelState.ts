/**
 * Debug panel state management hook
 *
 * State management for displaying and editing BoardData in JSON format
 * - Auto sync (500ms debounce)
 * - External change detection
 * - Validation error display
 */

import { useEffect, useRef, useState } from "react";
import { useEditorActions } from "@/lib/editor/hooks/useEditorActions";
import { useBoard } from "@/lib/editor/hooks/useEditorStore";
import type { BoardData } from "@/lib/stgy";
import { assignBoardObjectIds } from "@/lib/stgy";
import { safeParseBoardData } from "@/lib/stgy/schema";

/** Sync status */
export type SyncStatus = "synced" | "pending" | "error";

/** Debug panel state */
export interface DebugPanelState {
	/** JSON string */
	jsonString: string;
	/** Update JSON string */
	setJsonString: (value: string) => void;
	/** Sync status */
	syncStatus: SyncStatus;
	/** Validation errors */
	validationErrors: string[] | null;
}

/** Debounce time (milliseconds) */
const DEBOUNCE_MS = 500;

/**
 * Debug panel state management hook
 */
export function useDebugPanelState(): DebugPanelState {
	const board = useBoard();
	const { updateBoardFromDebug } = useEditorActions();

	// Local JSON string state
	const [jsonString, setJsonStringInternal] = useState(() =>
		JSON.stringify(board, null, 2),
	);

	// Sync status
	const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

	// Validation errors
	const [validationErrors, setValidationErrors] = useState<string[] | null>(
		null,
	);

	// Ref for tracking external changes
	const lastExternalBoardRef = useRef<BoardData>(board);

	// Local edit flag (to distinguish from external changes)
	const isLocalEditRef = useRef(false);

	// Debounce timer ref
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Debounced sync
	useEffect(() => {
		if (syncStatus !== "pending") return;

		// Clear existing timer
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			const result = safeParseBoardData(jsonString);

			if (result.success) {
				isLocalEditRef.current = true;
				const boardData = assignBoardObjectIds(result.data);
				updateBoardFromDebug(boardData);
				lastExternalBoardRef.current = boardData;
				setSyncStatus("synced");
				setValidationErrors(null);
			} else {
				setSyncStatus("error");
				setValidationErrors(result.errors);
			}
		}, DEBOUNCE_MS);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [jsonString, syncStatus, updateBoardFromDebug]);

	// External change detection
	useEffect(() => {
		// Ignore changes caused by local edits
		if (isLocalEditRef.current) {
			isLocalEditRef.current = false;
			return;
		}

		// If there are external changes, update the JSON string
		setJsonStringInternal(JSON.stringify(board, null, 2));
		lastExternalBoardRef.current = board;
		setSyncStatus("synced");
		setValidationErrors(null);
	}, [board]);

	// JSON string change handler
	const setJsonString = (value: string) => {
		setJsonStringInternal(value);
		setSyncStatus("pending");
	};

	return {
		jsonString,
		setJsonString,
		syncStatus,
		validationErrors,
	};
}
