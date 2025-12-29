/**
 * エディター用キーボードショートカットフック
 */

import { useEffect } from "react";
import { useEditor } from "./EditorContext";

/** 移動量 */
const MOVE_STEP = 1;
const MOVE_STEP_LARGE = 10;

/**
 * キーボードショートカットを有効化するフック
 */
export function useKeyboardShortcuts() {
	const {
		state,
		undo,
		redo,
		canUndo,
		canRedo,
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
		canGroup,
		selectedGroup,
		isFocusMode,
		unfocus,
	} = useEditor();

	const { selectedIndices } = state;
	const hasSelection = selectedIndices.length > 0;

	/**
	 * オブジェクトを移動
	 */
	const handleMove = (deltaX: number, deltaY: number) => {
		if (selectedIndices.length === 0) return;
		moveObjects(selectedIndices, deltaX, deltaY);
		commitHistory("オブジェクト移動");
	};

	/**
	 * キーダウンイベントハンドラー
	 */
	const handleKeyDown = (e: KeyboardEvent) => {
		// テキスト編集中は無視
		if (state.editingTextIndex !== null) {
			return;
		}

		// 入力フィールドにフォーカス中は無視
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

		// Ctrl/Cmd + Z: 元に戻す
		if (isMod && !isShift && e.key === "z") {
			if (canUndo) {
				e.preventDefault();
				undo();
			}
			return;
		}

		// Ctrl/Cmd + Y または Ctrl/Cmd + Shift + Z: やり直す
		if ((isMod && e.key === "y") || (isMod && isShift && e.key === "z")) {
			if (canRedo) {
				e.preventDefault();
				redo();
			}
			return;
		}

		// Ctrl/Cmd + C: コピー
		if (isMod && e.key === "c") {
			if (hasSelection) {
				e.preventDefault();
				copySelected();
			}
			return;
		}

		// Ctrl/Cmd + V: 貼り付け
		if (isMod && e.key === "v") {
			e.preventDefault();
			paste();
			return;
		}

		// Ctrl/Cmd + D: 複製
		if (isMod && e.key === "d") {
			if (hasSelection) {
				e.preventDefault();
				duplicateSelected();
			}
			return;
		}

		// Ctrl/Cmd + A: 全選択
		if (isMod && e.key === "a") {
			e.preventDefault();
			selectAll();
			return;
		}

		// Ctrl/Cmd + G: グループ化
		if (isMod && !isShift && e.key === "g") {
			if (canGroup) {
				e.preventDefault();
				groupSelected();
			}
			return;
		}

		// Ctrl/Cmd + Shift + G: グループ解除
		if (isMod && isShift && e.key === "g") {
			if (selectedGroup) {
				e.preventDefault();
				ungroup(selectedGroup.id);
			}
			return;
		}

		// Delete / Backspace: 削除
		if (e.key === "Delete" || e.key === "Backspace") {
			if (hasSelection) {
				e.preventDefault();
				deleteSelected();
			}
			return;
		}

		// Escape: フォーカス解除 → 選択解除
		if (e.key === "Escape") {
			e.preventDefault();
			// フォーカスモード中は先にフォーカスを解除
			if (isFocusMode) {
				unfocus();
				return;
			}
			// 選択がある場合は選択解除
			if (hasSelection) {
				deselectAll();
			}
			return;
		}

		// 矢印キー: 移動
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

/**
 * ショートカット一覧
 */
export const KEYBOARD_SHORTCUTS = [
	{ key: "Ctrl+Z", description: "元に戻す" },
	{ key: "Ctrl+Y", description: "やり直す" },
	{ key: "Ctrl+C", description: "コピー" },
	{ key: "Ctrl+V", description: "貼り付け" },
	{ key: "Ctrl+D", description: "複製" },
	{ key: "Ctrl+A", description: "全選択" },
	{ key: "Ctrl+G", description: "グループ化" },
	{ key: "Ctrl+Shift+G", description: "グループ解除" },
	{ key: "Delete", description: "削除" },
	{ key: "Escape", description: "フォーカス解除/選択解除" },
	{ key: "↑↓←→", description: "1px移動" },
	{ key: "Shift+↑↓←→", description: "10px移動" },
] as const;
