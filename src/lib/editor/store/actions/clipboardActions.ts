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
	 * オブジェクトをコピー（グローバルクリップボードに保存）
	 */
	const copyObjects = () => {
		const state = store.state;
		if (state.selectedIds.length === 0) return;

		const copiedObjects = state.selectedIds
			.map((id) => state.board.objects.find((obj) => obj.id === id))
			.filter((obj): obj is NonNullable<typeof obj> => obj !== undefined)
			.map((obj) => structuredClone(obj));

		if (copiedObjects.length === 0) return;

		// グローバルストアに保存（タブ間共有）
		writeToClipboard(copiedObjects);
	};

	/**
	 * 選択オブジェクトをコピー
	 */
	const copySelected = () => {
		copyObjects();
	};

	/**
	 * オブジェクトを貼り付け（グローバルクリップボードから）
	 */
	const paste = (position?: Position) => {
		const clipboardObjects = readFromClipboard();

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

			// ペーストするオブジェクトを準備（新しいIDを生成）
			const pastedObjects = clipboardObjects.map((obj) => {
				const pasted = structuredClone(obj);
				// 新しいIDを生成
				pasted.id = crypto.randomUUID();
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

			// 新しいIDを収集
			const newIds = pastedObjects.map((obj) => obj.id);

			// 連続ペースト用にグローバルクリップボードも更新
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
