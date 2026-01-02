/**
 * クリップボード操作ハンドラー
 */

import i18n from "@/lib/i18n";
import type { EditorState } from "../../types";
import { canAddObjects } from "../businessLogic/validation";
import { cloneBoard, pushHistory } from "../utils";

/**
 * オブジェクトをコピー
 */
export function handleCopyObjects(state: EditorState): EditorState {
	if (state.selectedIndices.length === 0) return state;

	const copiedObjects = state.selectedIndices
		.filter((i) => i >= 0 && i < state.board.objects.length)
		.map((i) => structuredClone(state.board.objects[i]));

	return {
		...state,
		clipboard: copiedObjects,
	};
}

/**
 * オブジェクトを貼り付け
 */
export function handlePasteObjects(
	state: EditorState,
	payload: { position?: { x: number; y: number } },
): EditorState {
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

	// ペーストするオブジェクトを準備
	const pastedObjects = state.clipboard.map((obj) => {
		const pasted = structuredClone(obj);
		// 位置をオフセット
		if (payload.position) {
			pasted.position = { ...payload.position };
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
}
