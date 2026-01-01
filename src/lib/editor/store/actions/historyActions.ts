/**
 * 履歴・ボード操作アクション
 */

import i18n from "@/lib/i18n";
import type { BoardData } from "@/lib/stgy";
import {
	cloneBoard,
	generateHistoryId,
	pushHistory,
} from "../../reducerHandlers/utils";
import type { CircularModeState } from "../../types";
import type { EditorStore } from "../types";

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
 * 履歴アクションを作成
 */
export function createHistoryActions(store: EditorStore) {
	/**
	 * ボードを設定（円形配置モードをリセット）
	 */
	const setBoard = (board: BoardData) => {
		store.setState((state) => ({
			...state,
			board,
			selectedIndices: [],
			groups: [],
			isDirty: false,
			history: [
				{
					id: generateHistoryId(),
					board: structuredClone(board),
					groups: [],
					description: i18n.t("history.initial"),
				},
			],
			historyIndex: 0,
			circularMode: null,
		}));
	};

	/**
	 * ボードメタデータを更新
	 */
	const updateBoardMeta = (updates: {
		name?: string;
		backgroundId?: number;
	}) => {
		store.setState((state) => {
			const newBoard = cloneBoard(state.board);
			if (updates.name !== undefined) {
				newBoard.name = updates.name;
			}
			if (updates.backgroundId !== undefined) {
				newBoard.backgroundId = updates.backgroundId;
			}
			return {
				...state,
				board: newBoard,
				isDirty: true,
			};
		});
	};

	/**
	 * 履歴をコミット
	 */
	const commitHistory = (description: string) => {
		store.setState((state) => ({
			...state,
			...pushHistory(state, description),
		}));
	};

	/**
	 * 元に戻す
	 */
	const undo = () => {
		store.setState((state) => {
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
		});
	};

	/**
	 * やり直す
	 */
	const redo = () => {
		store.setState((state) => {
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
		});
	};

	/**
	 * 任意の履歴位置に移動
	 */
	const jumpToHistory = (index: number) => {
		store.setState((state) => {
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
		});
	};

	/**
	 * 履歴をクリア（現在の状態を維持し、履歴のみリセット）
	 */
	const clearHistory = () => {
		store.setState((state) => ({
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
		}));
	};

	/**
	 * デバッグパネルからボードを更新
	 * グループ・選択を調整しつつ履歴に追加
	 */
	const updateBoardFromDebug = (board: BoardData) => {
		store.setState((state) => {
			const objectCount = board.objects.length;

			// グループインデックスの調整（オブジェクト数変更対応）
			const newGroups = state.groups
				.map((group) => ({
					...group,
					objectIndices: group.objectIndices.filter((idx) => idx < objectCount),
				}))
				.filter((group) => group.objectIndices.length > 0);

			// 選択インデックスの調整
			const newSelectedIndices = state.selectedIndices.filter(
				(idx) => idx < objectCount,
			);

			const newState = {
				...state,
				board,
				groups: newGroups,
				selectedIndices: newSelectedIndices,
				isDirty: true,
				circularMode: null, // デバッグ編集時は円形配置モードをリセット
			};

			return {
				...newState,
				...pushHistory(newState, i18n.t("history.debugPanelEdit")),
			};
		});
	};

	return {
		setBoard,
		updateBoardMeta,
		commitHistory,
		undo,
		redo,
		jumpToHistory,
		clearHistory,
		updateBoardFromDebug,
	};
}

export type HistoryActions = ReturnType<typeof createHistoryActions>;
