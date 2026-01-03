/**
 * クリップボード操作ハンドラー
 */

import i18n from "@/lib/i18n";
import { readFromClipboard, writeToClipboard } from "../../clipboard";
import { duplicateObject } from "../../factory";
import type { EditorState } from "../../types";
import { canAddObjects } from "../businessLogic/validation";
import { cloneBoard, pushHistory } from "../utils";

/**
 * オブジェクトをコピー
 */
export function handleCopyObjects(state: EditorState): EditorState {
	if (state.selectedIds.length === 0) return state;

	const selectedIdSet = new Set(state.selectedIds);
	const copiedObjects = state.board.objects
		.filter((obj) => selectedIdSet.has(obj.id))
		.map((obj) => structuredClone(obj));

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

	// ペーストするオブジェクトを準備（新しいIDを生成）
	const pastedObjects = clipboardObjects.map((obj) => {
		const offset = payload.position
			? {
					x: payload.position.x - obj.position.x,
					y: payload.position.y - obj.position.y,
				}
			: { x: 10, y: 10 };
		return duplicateObject(obj, offset);
	});

	// 配列の先頭に追加（最前面レイヤーに配置）
	newBoard.objects.unshift(...pastedObjects);

	// 新しいIDを取得
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
}
