/**
 * クリップボード操作アクション
 */

import i18n from "@/lib/i18n";
import type { Position } from "@/lib/stgy";
import { readFromClipboard, writeToClipboard } from "../../clipboard";
import { canAddObjects } from "../../reducerHandlers/businessLogic/validation";
import { cloneBoard, pushHistory } from "../../reducerHandlers/utils";
import type { EditorStore } from "../types";

/**
 * クリップボードアクションを作成
 */
export function createClipboardActions(store: EditorStore) {
	/**
	 * オブジェクトをコピー（システムクリップボードへ + ローカルステート）
	 */
	const copyObjects = async () => {
		const state = store.state;
		if (state.selectedIndices.length === 0) return;

		const copiedObjects = state.selectedIndices
			.filter((i) => i >= 0 && i < state.board.objects.length)
			.map((i) => structuredClone(state.board.objects[i]));

		if (copiedObjects.length === 0) return;

		// ローカルステートも更新（UI判定用）
		store.setState((s) => ({
			...s,
			clipboard: copiedObjects,
		}));

		try {
			await writeToClipboard(copiedObjects);
		} catch (error) {
			console.error("Copy failed:", error);
		}
	};

	/**
	 * 選択オブジェクトをコピー
	 */
	const copySelected = async () => {
		await copyObjects();
	};

	/**
	 * オブジェクトを貼り付け（システムクリップボードから）
	 */
	const paste = async (position?: Position) => {
		let clipboardObjects: Awaited<ReturnType<typeof readFromClipboard>>;

		try {
			clipboardObjects = await readFromClipboard();
		} catch (error) {
			console.error("Paste failed:", error);
			return;
		}

		if (!clipboardObjects || clipboardObjects.length === 0) {
			return;
		}

		store.setState((state) => {
			// バリデーション
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

			// ペーストするオブジェクトを準備
			const pastedObjects = clipboardObjects.map((obj) => {
				const pasted = structuredClone(obj);
				// 位置をオフセット
				if (position) {
					pasted.position = { ...position };
				} else {
					pasted.position.x += 10;
					pasted.position.y += 10;
				}
				return pasted;
			});

			// 配列の先頭に追加（最前面レイヤーに配置）
			newBoard.objects.unshift(...pastedObjects);

			// 新しいインデックスは 0 から pastedObjects.length - 1
			const newIndices = pastedObjects.map((_, i) => i);

			return {
				...state,
				board: newBoard,
				selectedIndices: newIndices,
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
