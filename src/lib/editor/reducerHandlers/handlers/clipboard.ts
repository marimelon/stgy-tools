/**
 * クリップボード操作ハンドラー
 */

import i18n from "@/lib/i18n";
import { readFromClipboard, writeToClipboard } from "../../clipboard";
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

	// グローバルクリップボードに保存
	writeToClipboard(copiedObjects);

	return state;
}

/**
 * オブジェクトを貼り付け
 */
export function handlePasteObjects(
	state: EditorState,
	payload: { position?: { x: number; y: number } },
): EditorState {
	const clipboardObjects = readFromClipboard();
	if (!clipboardObjects || clipboardObjects.length === 0) return state;

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

	// 連続ペースト用にグローバルクリップボードも更新
	writeToClipboard(pastedObjects);

	return {
		...state,
		board: newBoard,
		selectedIndices: newIndices,
		lastError: null,
		...pushHistory(state, i18n.t("history.pasteObject")),
	};
}
