/**
 * Reducer用ユーティリティ関数
 */

import type { BoardData, BoardObject } from "@/lib/stgy";
import {
	type EditorState,
	type HistoryEntry,
	MAX_HISTORY_SIZE,
	type ObjectGroup,
} from "../types";

/**
 * 履歴の最大保持数
 * @deprecated MAX_HISTORY_SIZE を使用してください
 */
export const MAX_HISTORY = MAX_HISTORY_SIZE;

/**
 * 履歴エントリ用のユニークIDを生成
 */
export function generateHistoryId(): string {
	return `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 履歴エントリを追加
 */
export function pushHistory(
	state: EditorState,
	description: string,
): Pick<EditorState, "history" | "historyIndex" | "isDirty"> {
	// 現在位置以降の履歴を削除
	const newHistory = state.history.slice(0, state.historyIndex + 1);

	// 新しいエントリを追加
	const entry: HistoryEntry = {
		id: generateHistoryId(),
		board: structuredClone(state.board),
		groups: structuredClone(state.groups),
		description,
	};
	newHistory.push(entry);

	// 履歴が多すぎる場合は古いものを削除
	if (newHistory.length > MAX_HISTORY_SIZE) {
		newHistory.shift();
	}

	return {
		history: newHistory,
		historyIndex: newHistory.length - 1,
		isDirty: true,
	};
}

/**
 * グループIDを生成
 */
export function generateGroupId(): string {
	return `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * オブジェクト追加時にグループのインデックスを更新（先頭追加）
 */
export function shiftGroupIndices(
	groups: ObjectGroup[],
	count: number,
): ObjectGroup[] {
	return groups.map((group) => ({
		...group,
		objectIndices: group.objectIndices.map((i) => i + count),
	}));
}

/**
 * オブジェクト削除時にグループを更新
 */
export function updateGroupsAfterDelete(
	groups: ObjectGroup[],
	deletedIndices: number[],
): ObjectGroup[] {
	const sortedDeleted = [...deletedIndices].sort((a, b) => b - a);

	return groups
		.map((group) => {
			let newIndices = group.objectIndices.filter(
				(i) => !deletedIndices.includes(i),
			);

			// 削除されたインデックスより大きいインデックスを調整
			for (const deleted of sortedDeleted) {
				newIndices = newIndices.map((i) => (i > deleted ? i - 1 : i));
			}

			return {
				...group,
				objectIndices: newIndices,
			};
		})
		.filter((group) => group.objectIndices.length > 0); // 空のグループを削除
}

/**
 * ボードデータをディープコピー
 */
export function cloneBoard(board: BoardData): BoardData {
	return structuredClone(board);
}

/**
 * オブジェクトを更新
 */
export function updateObjectInBoard(
	board: BoardData,
	index: number,
	updates: Partial<BoardObject>,
): BoardData {
	const newBoard = cloneBoard(board);
	if (index >= 0 && index < newBoard.objects.length) {
		newBoard.objects[index] = {
			...newBoard.objects[index],
			...updates,
			// ネストしたオブジェクトは個別にマージ
			flags: {
				...newBoard.objects[index].flags,
				...(updates.flags ?? {}),
			},
			color: {
				...newBoard.objects[index].color,
				...(updates.color ?? {}),
			},
			position: {
				...newBoard.objects[index].position,
				...(updates.position ?? {}),
			},
		};
	}
	return newBoard;
}
