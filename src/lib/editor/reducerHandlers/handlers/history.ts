/**
 * 履歴・ボード操作ハンドラー
 */

import i18n from "@/lib/i18n";
import type { BoardData } from "@/lib/stgy";
import type { CircularModeState, EditorState } from "../../types";
import { cloneBoard, generateHistoryId, pushHistory } from "../utils";

/**
 * 円形配置モードをボード状態から再計算
 * Undo/Redo後に円形モードを維持するために使用
 */
function recalculateCircularMode(
	board: BoardData,
	circularMode: CircularModeState,
): CircularModeState {
	const { participatingIndices } = circularMode;

	// 有効なオブジェクトのみフィルタ
	const validIndices = participatingIndices.filter(
		(idx) => idx >= 0 && idx < board.objects.length,
	);

	if (validIndices.length === 0) {
		return circularMode;
	}

	// 参加オブジェクトの位置を取得
	const positions = validIndices.map((idx) => board.objects[idx].position);

	// 重心を中心として計算
	const sumX = positions.reduce((sum, p) => sum + p.x, 0);
	const sumY = positions.reduce((sum, p) => sum + p.y, 0);
	const centerX = sumX / positions.length;
	const centerY = sumY / positions.length;

	// 平均距離を半径として計算
	const distances = positions.map((p) =>
		Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2),
	);
	const avgRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length;
	const radius = Math.max(10, avgRadius);

	// 各オブジェクトの角度を再計算
	const objectAngles = new Map<number, number>();
	for (const idx of validIndices) {
		const pos = board.objects[idx].position;
		const angle = Math.atan2(pos.y - centerY, pos.x - centerX);
		objectAngles.set(idx, angle);
	}

	return {
		center: { x: centerX, y: centerY },
		radius,
		participatingIndices: validIndices,
		objectAngles,
	};
}

/**
 * ボードを設定
 * 円形配置モードをリセット
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
				description: i18n.t("history.initial"),
			},
		],
		historyIndex: 0,
		// 円形配置モードをリセット
		circularMode: null,
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
 * 円形配置モード中は円形モードを維持（パラメータを再計算）
 */
export function handleUndo(state: EditorState): EditorState {
	if (state.historyIndex <= 0) return state;

	const newIndex = state.historyIndex - 1;
	const entry = state.history[newIndex];
	const newBoard = structuredClone(entry.board);

	// 円形配置モード中は再計算して維持
	const newCircularMode = state.circularMode
		? recalculateCircularMode(newBoard, state.circularMode)
		: null;

	return {
		...state,
		board: newBoard,
		groups: structuredClone(entry.groups ?? []),
		historyIndex: newIndex,
		selectedIndices: [],
		isDirty: newIndex > 0,
		circularMode: newCircularMode,
	};
}

/**
 * やり直す
 * 円形配置モード中は円形モードを維持（パラメータを再計算）
 */
export function handleRedo(state: EditorState): EditorState {
	if (state.historyIndex >= state.history.length - 1) return state;

	const newIndex = state.historyIndex + 1;
	const entry = state.history[newIndex];
	const newBoard = structuredClone(entry.board);

	// 円形配置モード中は再計算して維持
	const newCircularMode = state.circularMode
		? recalculateCircularMode(newBoard, state.circularMode)
		: null;

	return {
		...state,
		board: newBoard,
		groups: structuredClone(entry.groups ?? []),
		historyIndex: newIndex,
		selectedIndices: [],
		isDirty: true,
		circularMode: newCircularMode,
	};
}

/**
 * 任意の履歴位置に移動
 * 円形配置モード中は円形モードを維持（パラメータを再計算）
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
	const newBoard = structuredClone(entry.board);

	// 円形配置モード中は再計算して維持
	const newCircularMode = state.circularMode
		? recalculateCircularMode(newBoard, state.circularMode)
		: null;

	return {
		...state,
		board: newBoard,
		groups: structuredClone(entry.groups ?? []),
		historyIndex: index,
		selectedIndices: [],
		isDirty: index > 0,
		circularMode: newCircularMode,
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
				description: i18n.t("history.initial"),
			},
		],
		historyIndex: 0,
	};
}
