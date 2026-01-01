/**
 * Reducer用ユーティリティ関数
 */

import type {
	BoardData,
	BoardObject,
	Color,
	ObjectFlags,
	Position,
} from "@/lib/stgy";
import {
	type EditorState,
	type HistoryEntry,
	MAX_HISTORY_SIZE,
	type ObjectGroup,
} from "../types";
import {
	removeIndices,
	shiftIndicesDown,
} from "./businessLogic/indexManagement";

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

// ============================================
// 状態比較用 deepEqual 関数群
// ============================================

function equalPosition(a: Position, b: Position): boolean {
	return a.x === b.x && a.y === b.y;
}

function equalColor(a: Color, b: Color): boolean {
	return a.r === b.r && a.g === b.g && a.b === b.b && a.opacity === b.opacity;
}

function equalObjectFlags(a: ObjectFlags, b: ObjectFlags): boolean {
	return (
		a.visible === b.visible &&
		a.flipHorizontal === b.flipHorizontal &&
		a.flipVertical === b.flipVertical &&
		a.locked === b.locked
	);
}

function equalBoardObject(a: BoardObject, b: BoardObject): boolean {
	return (
		a.objectId === b.objectId &&
		a.text === b.text &&
		equalObjectFlags(a.flags, b.flags) &&
		equalPosition(a.position, b.position) &&
		a.rotation === b.rotation &&
		a.size === b.size &&
		equalColor(a.color, b.color) &&
		a.param1 === b.param1 &&
		a.param2 === b.param2 &&
		a.param3 === b.param3
	);
}

function deepEqualBoardData(a: BoardData, b: BoardData): boolean {
	if (
		a.version !== b.version ||
		a.name !== b.name ||
		a.backgroundId !== b.backgroundId ||
		a.objects.length !== b.objects.length
	) {
		return false;
	}
	for (let i = 0; i < a.objects.length; i++) {
		if (!equalBoardObject(a.objects[i], b.objects[i])) {
			return false;
		}
	}
	return true;
}

function equalObjectGroup(a: ObjectGroup, b: ObjectGroup): boolean {
	if (
		a.id !== b.id ||
		a.name !== b.name ||
		a.collapsed !== b.collapsed ||
		a.objectIndices.length !== b.objectIndices.length
	) {
		return false;
	}
	for (let i = 0; i < a.objectIndices.length; i++) {
		if (a.objectIndices[i] !== b.objectIndices[i]) {
			return false;
		}
	}
	return true;
}

function deepEqualGroups(a: ObjectGroup[], b: ObjectGroup[]): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (!equalObjectGroup(a[i], b[i])) return false;
	}
	return true;
}

/**
 * 履歴エントリを追加
 */
export function pushHistory(
	state: EditorState,
	description: string,
): Pick<EditorState, "history" | "historyIndex" | "isDirty"> {
	// 現在位置の履歴エントリと比較し、変更がなければスキップ
	const currentEntry = state.history[state.historyIndex];
	if (
		currentEntry &&
		deepEqualBoardData(currentEntry.board, state.board) &&
		deepEqualGroups(currentEntry.groups, state.groups)
	) {
		return {
			history: state.history,
			historyIndex: state.historyIndex,
			isDirty: state.isDirty,
		};
	}

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
 * @deprecated Use shiftIndicesDown from businessLogic/indexManagement instead
 */
export function shiftGroupIndices(
	groups: ObjectGroup[],
	count: number,
): ObjectGroup[] {
	return shiftIndicesDown(groups, count);
}

/**
 * オブジェクト削除時にグループを更新
 * @deprecated Use removeIndices from businessLogic/indexManagement instead
 */
export function updateGroupsAfterDelete(
	groups: ObjectGroup[],
	deletedIndices: number[],
): ObjectGroup[] {
	return removeIndices(groups, deletedIndices);
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
