/**
 * 履歴・ボード操作アクション
 */

import i18n from "@/lib/i18n";
import type { BoardData } from "@/lib/stgy";
import type { CircularModeState, EditorState } from "../../types";
import { cloneBoard, generateHistoryId, pushHistory } from "../../utils";
import { getCurrentBoardId } from "../editorStore";
import { saveHistory } from "../globalHistoryStore";
import type { EditorStore } from "../types";

/**
 * 履歴をグローバルストアに同期
 */
function syncToGlobalHistory(state: EditorState): void {
	const boardId = getCurrentBoardId();
	saveHistory(boardId, state.history, state.historyIndex);
}

/**
 * 円形配置モードをボード状態から再計算
 * Undo/Redo後に円形モードを維持するために使用
 */
function recalculateCircularMode(
	board: BoardData,
	circularMode: CircularModeState,
): CircularModeState {
	const { participatingIds } = circularMode;

	// 有効なオブジェクトのみフィルタ（IDで検索）
	const boardIdSet = new Set(board.objects.map((obj) => obj.id));
	const validIds = participatingIds.filter((id) => boardIdSet.has(id));

	if (validIds.length === 0) {
		return circularMode;
	}

	// 参加オブジェクトの位置を取得
	const positions = validIds
		.map((id) => board.objects.find((obj) => obj.id === id)?.position)
		.filter((pos): pos is NonNullable<typeof pos> => pos !== undefined);

	if (positions.length === 0) {
		return circularMode;
	}

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
	const objectAngles = new Map<string, number>();
	for (const id of validIds) {
		const obj = board.objects.find((o) => o.id === id);
		if (obj) {
			const angle = Math.atan2(
				obj.position.y - centerY,
				obj.position.x - centerX,
			);
			objectAngles.set(id, angle);
		}
	}

	return {
		center: { x: centerX, y: centerY },
		radius,
		participatingIds: validIds,
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
		store.setState((state) => {
			const newState = {
				...state,
				board,
				selectedIds: [],
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
			};
			syncToGlobalHistory(newState);
			return newState;
		});
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
		store.setState((state) => {
			const newState = {
				...state,
				...pushHistory(state, description),
			};
			syncToGlobalHistory(newState);
			return newState;
		});
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

			const newState = {
				...state,
				board: newBoard,
				groups: structuredClone(entry.groups ?? []),
				historyIndex: newIndex,
				selectedIds: [],
				isDirty: newIndex > 0,
				circularMode: newCircularMode,
			};
			syncToGlobalHistory(newState);
			return newState;
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

			const newState = {
				...state,
				board: newBoard,
				groups: structuredClone(entry.groups ?? []),
				historyIndex: newIndex,
				selectedIds: [],
				isDirty: true,
				circularMode: newCircularMode,
			};
			syncToGlobalHistory(newState);
			return newState;
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

			const newState = {
				...state,
				board: newBoard,
				groups: structuredClone(entry.groups ?? []),
				historyIndex: index,
				selectedIds: [],
				isDirty: index > 0,
				circularMode: newCircularMode,
			};
			syncToGlobalHistory(newState);
			return newState;
		});
	};

	/**
	 * 履歴をクリア（現在の状態を維持し、履歴のみリセット）
	 */
	const clearHistory = () => {
		store.setState((state) => {
			const newState = {
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
			syncToGlobalHistory(newState);
			return newState;
		});
	};

	/**
	 * デバッグパネルからボードを更新
	 * グループ・選択を調整しつつ履歴に追加
	 */
	const updateBoardFromDebug = (board: BoardData) => {
		store.setState((state) => {
			// ボード内のオブジェクトIDセット
			const boardIdSet = new Set(board.objects.map((obj) => obj.id));

			// グループIDの調整（存在しないオブジェクトを除外）
			const newGroups = state.groups
				.map((group) => ({
					...group,
					objectIds: group.objectIds.filter((id) => boardIdSet.has(id)),
				}))
				.filter((group) => group.objectIds.length > 0);

			// 選択IDの調整
			const newSelectedIds = state.selectedIds.filter((id) =>
				boardIdSet.has(id),
			);

			const intermediateState = {
				...state,
				board,
				groups: newGroups,
				selectedIds: newSelectedIds,
				isDirty: true,
				circularMode: null, // デバッグ編集時は円形配置モードをリセット
			};

			const newState = {
				...intermediateState,
				...pushHistory(intermediateState, i18n.t("history.debugPanelEdit")),
			};
			syncToGlobalHistory(newState);
			return newState;
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
