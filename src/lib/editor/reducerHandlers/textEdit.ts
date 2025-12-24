/**
 * テキスト編集アクションハンドラー
 */

import i18n from "@/lib/i18n";
import { ObjectIds } from "@/lib/stgy";
import type { EditorState } from "../types";

/**
 * テキスト編集を開始
 */
export function handleStartTextEdit(
	state: EditorState,
	payload: { index: number },
): EditorState {
	const { index } = payload;
	const obj = state.board.objects[index];

	// テキストオブジェクトのみ編集可能
	if (!obj || obj.objectId !== ObjectIds.Text) {
		return state;
	}

	// ロック中は編集不可
	if (obj.flags.locked) {
		return state;
	}

	return {
		...state,
		editingTextIndex: index,
		selectedIndices: [index],
	};
}

/**
 * テキスト編集を終了
 */
export function handleEndTextEdit(
	state: EditorState,
	payload: { save: boolean; text?: string },
): EditorState {
	const { save, text } = payload;

	if (state.editingTextIndex === null) {
		return state;
	}

	const editingIndex = state.editingTextIndex;
	const currentText = state.board.objects[editingIndex]?.text;

	let newState: EditorState = { ...state, editingTextIndex: null };

	// テキストが実際に変更された場合のみ更新
	if (save && text !== undefined && text !== currentText) {
		// 空文字の場合はデフォルトテキストに戻す
		const finalText = text.trim() === "" ? i18n.t("common.defaultText") : text;
		const newObjects = [...state.board.objects];
		newObjects[editingIndex] = {
			...newObjects[editingIndex],
			text: finalText,
		};
		newState = {
			...newState,
			board: { ...state.board, objects: newObjects },
		};
	}

	return newState;
}
