/**
 * Clipboard operation actions
 */

import i18n from "@/lib/i18n";
import type { Position } from "@/lib/stgy";
import { readFromClipboard, writeToClipboard } from "../../clipboard";
import { cloneBoard, pushHistory } from "../../utils";
import { canAddObjects } from "../../utils/validation";
import type { EditorStore } from "../types";

export function createClipboardActions(store: EditorStore) {
	const copyObjects = () => {
		const state = store.state;
		if (state.selectedIds.length === 0) return;

		const copiedObjects = state.selectedIds
			.map((id) => state.board.objects.find((obj) => obj.id === id))
			.filter((obj): obj is NonNullable<typeof obj> => obj !== undefined)
			.map((obj) => structuredClone(obj));

		if (copiedObjects.length === 0) return;

		// Save to global store (shared across tabs)
		writeToClipboard(copiedObjects);
	};

	const copySelected = () => {
		copyObjects();
	};

	const paste = (position?: Position) => {
		const clipboardObjects = readFromClipboard();

		if (!clipboardObjects || clipboardObjects.length === 0) {
			return;
		}

		store.setState((state) => {
			const validation = canAddObjects(state.board, clipboardObjects);
			if (!validation.canAdd) {
				return {
					...state,
					lastError: {
						key: validation.errorKey ?? "editor.errors.unknown",
						params: validation.errorParams,
					},
				};
			}

			const newBoard = cloneBoard(state.board);

			const pastedObjects = clipboardObjects.map((obj) => {
				const pasted = structuredClone(obj);
				pasted.id = crypto.randomUUID();
				if (position) {
					pasted.position = { ...position };
				} else {
					pasted.position.x += 10;
					pasted.position.y += 10;
				}
				return pasted;
			});

			// Insert at front (topmost layer)
			newBoard.objects.unshift(...pastedObjects);

			const newIds = pastedObjects.map((obj) => obj.id);

			// Update clipboard for consecutive paste
			writeToClipboard(pastedObjects);

			return {
				...state,
				board: newBoard,
				selectedIds: newIds,
				lastError: null,
				...pushHistory(state, i18n.t("history.pasteObject")),
			};
		});
	};

	return {
		copyObjects,
		copySelected,
		paste,
	};
}

export type ClipboardActions = ReturnType<typeof createClipboardActions>;
