/**
 * Auto-save hook
 *
 * Uses TanStack Store Effect to monitor EditorStore changes
 * and auto-save with debounce
 */

import { Effect } from "@tanstack/store";
import { useEffect, useRef, useState } from "react";
import { type BoardData, type BoardObject, encodeStgy } from "@/lib/stgy";
import { recalculateBoardSize } from "../factory";
import { getEditorStore } from "../store/editorStore";
import type { GridSettings, ObjectGroup } from "../types";

const AUTO_SAVE_DEBOUNCE_MS = 1000;

export type SaveBoardCallback = (
	name: string,
	stgyCode: string,
	groups: ObjectGroup[],
	gridSettings: GridSettings,
	objects: BoardObject[],
) => void;

export interface UseAutoSaveOptions {
	/** Board ID to save to (null = disabled) */
	currentBoardId: string | null;
	onSave: SaveBoardCallback;
}

/**
 * Auto-save hook
 *
 * Executes save with debounce when EditorStore's isDirty becomes true
 */
export function useAutoSave(options: UseAutoSaveOptions) {
	const { currentBoardId } = options;

	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

	// Keep options in ref to access latest values from Effect
	const optionsRef = useRef(options);
	optionsRef.current = options;

	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!currentBoardId) {
			return;
		}

		const store = getEditorStore();

		const executeSave = (
			board: BoardData,
			groups: ObjectGroup[],
			gridSettings: GridSettings,
		) => {
			const { currentBoardId, onSave } = optionsRef.current;
			if (!currentBoardId) return;

			const { width, height } = recalculateBoardSize(board);
			const boardToSave = { ...board, width, height };
			const stgyCode = encodeStgy(boardToSave);

			onSave(board.name, stgyCode, groups, gridSettings, board.objects);
			setLastSavedAt(new Date());
		};

		const autoSaveEffect = new Effect({
			deps: [store],
			fn: () => {
				const state = store.state;

				if (!state.isDirty) return;

				if (!optionsRef.current.currentBoardId) {
					return;
				}

				if (saveTimeoutRef.current) {
					clearTimeout(saveTimeoutRef.current);
				}

				saveTimeoutRef.current = setTimeout(() => {
					const currentState = store.state;
					if (currentState.isDirty) {
						executeSave(
							currentState.board,
							currentState.groups,
							currentState.gridSettings,
						);
					}
				}, AUTO_SAVE_DEBOUNCE_MS);
			},
			eager: false,
		});

		const unmount = autoSaveEffect.mount();

		return () => {
			unmount();
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
				saveTimeoutRef.current = null;
			}
		};
	}, [currentBoardId]);

	return { lastSavedAt };
}
