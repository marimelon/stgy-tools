/**
 * 履歴・ボード操作ハンドラー
 */

import type { BoardData } from "@/lib/stgy";
import type { EditorState } from "../types";
import { cloneBoard, generateHistoryId, pushHistory } from "./utils";

/**
 * ボードを設定
 */
export function handleSetBoard(
	state: EditorState,
	payload: { board: BoardData },
): EditorState {
	return {
		...state,
		board: payload.board,
		selectedIndices: [],
		groups: [],
		isDirty: false,
		history: [
			{
				id: generateHistoryId(),
				board: structuredClone(payload.board),
				groups: [],
				description: "初期状態",
			},
		],
		historyIndex: 0,
	};
}

/**
 * ボードメタデータを更新
 */
export function handleUpdateBoardMeta(
	state: EditorState,
	payload: { updates: { name?: string; backgroundId?: number } },
): EditorState {
	const newBoard = cloneBoard(state.board);
	if (payload.updates.name !== undefined) {
		newBoard.name = payload.updates.name;
	}
	if (payload.updates.backgroundId !== undefined) {
		newBoard.backgroundId = payload.updates.backgroundId;
	}
	return {
		...state,
		board: newBoard,
		isDirty: true,
	};
}

/**
 * 履歴をコミット
 */
export function handleCommitHistory(
	state: EditorState,
	payload: { description: string },
): EditorState {
	return {
		...state,
		...pushHistory(state, payload.description),
	};
}

/**
 * 元に戻す
 */
export function handleUndo(state: EditorState): EditorState {
	if (state.historyIndex <= 0) return state;

	const newIndex = state.historyIndex - 1;
	const entry = state.history[newIndex];
	return {
		...state,
		board: structuredClone(entry.board),
		groups: structuredClone(entry.groups ?? []),
		historyIndex: newIndex,
		selectedIndices: [],
		isDirty: newIndex > 0,
	};
}

/**
 * やり直す
 */
export function handleRedo(state: EditorState): EditorState {
	if (state.historyIndex >= state.history.length - 1) return state;

	const newIndex = state.historyIndex + 1;
	const entry = state.history[newIndex];
	return {
		...state,
		board: structuredClone(entry.board),
		groups: structuredClone(entry.groups ?? []),
		historyIndex: newIndex,
		selectedIndices: [],
		isDirty: true,
	};
}

/**
 * 任意の履歴位置に移動
 */
export function handleJumpToHistory(
	state: EditorState,
	payload: { index: number },
): EditorState {
	const { index } = payload;

	// 範囲チェック
	if (index < 0 || index >= state.history.length) {
		return state;
	}

	// 同じ位置なら何もしない
	if (index === state.historyIndex) {
		return state;
	}

	const entry = state.history[index];
	return {
		...state,
		board: structuredClone(entry.board),
		groups: structuredClone(entry.groups ?? []),
		historyIndex: index,
		selectedIndices: [],
		isDirty: index > 0,
	};
}

/**
 * 履歴をクリア（現在の状態を維持し、履歴のみリセット）
 */
export function handleClearHistory(state: EditorState): EditorState {
	return {
		...state,
		history: [
			{
				id: generateHistoryId(),
				board: structuredClone(state.board),
				groups: structuredClone(state.groups),
				description: "初期状態",
			},
		],
		historyIndex: 0,
	};
}
