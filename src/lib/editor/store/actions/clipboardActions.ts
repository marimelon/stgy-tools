/**
 * クリップボード操作アクション
 */

import type { Position } from "@/lib/stgy";
import { canAddObjects } from "../../reducerHandlers/businessLogic/validation";
import { cloneBoard, pushHistory } from "../../reducerHandlers/utils";
import type { EditorStore } from "../types";

/**
 * クリップボードアクションを作成
 */
export function createClipboardActions(store: EditorStore) {
	/**
	 * オブジェクトをコピー
	 */
	const copyObjects = () => {
		store.setState((state) => {
			if (state.selectedIndices.length === 0) return state;

			const copiedObjects = state.selectedIndices
				.filter((i) => i >= 0 && i < state.board.objects.length)
				.map((i) => structuredClone(state.board.objects[i]));

			return {
				...state,
				clipboard: copiedObjects,
			};
		});
	};

	/**
	 * 選択オブジェクトをコピー
	 */
	const copySelected = () => {
		copyObjects();
	};

	/**
	 * オブジェクトを貼り付け
	 */
	const paste = (position?: Position) => {
		store.setState((state) => {
			if (!state.clipboard || state.clipboard.length === 0) return state;

			// バリデーション
			const validation = canAddObjects(state.board, state.clipboard);
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
			const newIndices: number[] = [];

			for (const obj of state.clipboard) {
				const pasted = structuredClone(obj);
				// 位置をオフセット
				if (position) {
					pasted.position = position;
				} else {
					pasted.position.x += 10;
					pasted.position.y += 10;
				}
				newBoard.objects.push(pasted);
				newIndices.push(newBoard.objects.length - 1);
			}

			return {
				...state,
				board: newBoard,
				selectedIndices: newIndices,
				lastError: null,
				...pushHistory(state, "オブジェクト貼り付け"),
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
