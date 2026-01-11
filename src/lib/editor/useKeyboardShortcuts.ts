/**
 * Editor keyboard shortcuts hook
 */

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useEditorActions } from "./hooks/useEditorActions";
import {
	useCanGroup,
	useCanRedo,
	useCanUndo,
	useIsCircularMode,
	useIsFocusMode,
	useSelectedGroup,
} from "./hooks/useEditorDerived";
import { useEditingTextId, useSelectedIds } from "./hooks/useEditorStore";

/** Movement step sizes */
const MOVE_STEP = 1;
const MOVE_STEP_LARGE = 10;

export function useKeyboardShortcuts() {
	const { t } = useTranslation();

	// State
	const selectedIds = useSelectedIds();
	const editingTextId = useEditingTextId();

	// Derived state
	const canUndo = useCanUndo();
	const canRedo = useCanRedo();
	const canGroup = useCanGroup();
	const selectedGroup = useSelectedGroup();
	const isFocusMode = useIsFocusMode();
	const isCircularMode = useIsCircularMode();

	// Actions
	const {
		undo,
		redo,
		deleteSelected,
		duplicateSelected,
		copySelected,
		paste,
		deselectAll,
		selectAll,
		moveObjects,
		commitHistory,
		groupSelected,
		ungroup,
		unfocus,
		exitCircularMode,
		moveSelectedLayer,
	} = useEditorActions();

	const hasSelection = selectedIds.length > 0;
	const hasSingleSelection = selectedIds.length === 1;

	const handleMove = (deltaX: number, deltaY: number) => {
		if (selectedIds.length === 0) return;
		moveObjects(selectedIds, deltaX, deltaY);
		commitHistory(t("history.moveObject"));
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		// Ignore during text editing
		if (editingTextId !== null) {
			return;
		}

		// Ignore when input field is focused
		const target = e.target as HTMLElement;
		if (
			target.tagName === "INPUT" ||
			target.tagName === "TEXTAREA" ||
			target.isContentEditable
		) {
			return;
		}

		const isMod = e.ctrlKey || e.metaKey;
		const isShift = e.shiftKey;

		// Ctrl/Cmd + Z: Undo
		if (isMod && !isShift && e.key === "z") {
			if (canUndo) {
				e.preventDefault();
				undo();
			}
			return;
		}

		// Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
		if ((isMod && e.key === "y") || (isMod && isShift && e.key === "z")) {
			if (canRedo) {
				e.preventDefault();
				redo();
			}
			return;
		}

		// Ctrl/Cmd + C: Copy
		if (isMod && e.key === "c") {
			if (hasSelection) {
				e.preventDefault();
				copySelected();
			}
			return;
		}

		// Ctrl/Cmd + V: Paste
		if (isMod && e.key === "v") {
			e.preventDefault();
			paste();
			return;
		}

		// Ctrl/Cmd + D: Duplicate
		if (isMod && e.key === "d") {
			if (hasSelection) {
				e.preventDefault();
				duplicateSelected();
			}
			return;
		}

		// Ctrl/Cmd + A: Select all
		if (isMod && e.key === "a") {
			e.preventDefault();
			selectAll();
			return;
		}

		// Ctrl/Cmd + G: Group
		if (isMod && !isShift && e.key === "g") {
			if (canGroup) {
				e.preventDefault();
				groupSelected();
			}
			return;
		}

		// Ctrl/Cmd + Shift + G: Ungroup
		if (isMod && isShift && e.key === "g") {
			if (selectedGroup) {
				e.preventDefault();
				ungroup(selectedGroup.id);
			}
			return;
		}

		// Delete / Backspace: Delete
		if (e.key === "Delete" || e.key === "Backspace") {
			if (hasSelection) {
				e.preventDefault();
				deleteSelected();
			}
			return;
		}

		// Escape: Exit circular mode -> Exit focus mode -> Deselect
		if (e.key === "Escape") {
			e.preventDefault();
			// Exit circular mode first if active
			if (isCircularMode) {
				exitCircularMode();
				return;
			}
			// Exit focus mode next if active
			if (isFocusMode) {
				unfocus();
				return;
			}
			// Deselect if there's a selection
			if (hasSelection) {
				deselectAll();
			}
			return;
		}

		// Ctrl/Cmd + ]: Bring forward / Ctrl/Cmd + Shift + ]: Bring to front
		if (isMod && e.key === "]") {
			if (hasSingleSelection) {
				e.preventDefault();
				moveSelectedLayer(isShift ? "front" : "forward");
			}
			return;
		}

		// Ctrl/Cmd + [: Send backward / Ctrl/Cmd + Shift + [: Send to back
		if (isMod && e.key === "[") {
			if (hasSingleSelection) {
				e.preventDefault();
				moveSelectedLayer(isShift ? "back" : "backward");
			}
			return;
		}

		// Arrow keys: Move
		if (hasSelection) {
			const step = isShift ? MOVE_STEP_LARGE : MOVE_STEP;

			switch (e.key) {
				case "ArrowUp":
					e.preventDefault();
					handleMove(0, -step);
					break;
				case "ArrowDown":
					e.preventDefault();
					handleMove(0, step);
					break;
				case "ArrowLeft":
					e.preventDefault();
					handleMove(-step, 0);
					break;
				case "ArrowRight":
					e.preventDefault();
					handleMove(step, 0);
					break;
			}
		}
	};

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});
}

/** Keyboard shortcuts reference */
export const KEYBOARD_SHORTCUTS = [
	{ key: "Ctrl+Z", description: "Undo" },
	{ key: "Ctrl+Y", description: "Redo" },
	{ key: "Ctrl+C", description: "Copy" },
	{ key: "Ctrl+V", description: "Paste" },
	{ key: "Ctrl+D", description: "Duplicate" },
	{ key: "Ctrl+A", description: "Select all" },
	{ key: "Ctrl+G", description: "Group" },
	{ key: "Ctrl+Shift+G", description: "Ungroup" },
	{ key: "Ctrl+]", description: "Bring forward" },
	{ key: "Ctrl+[", description: "Send backward" },
	{ key: "Ctrl+Shift+]", description: "Bring to front" },
	{ key: "Ctrl+Shift+[", description: "Send to back" },
	{ key: "Delete", description: "Delete" },
	{ key: "Escape", description: "Exit focus/Deselect" },
	{ key: "Arrow keys", description: "Move 1px" },
	{ key: "Shift+Arrow keys", description: "Move 10px" },
] as const;
