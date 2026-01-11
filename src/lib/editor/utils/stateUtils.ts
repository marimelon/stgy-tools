/**
 * Editor state manipulation utilities
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

/**
 * @deprecated Use MAX_HISTORY_SIZE instead
 */
export const MAX_HISTORY = MAX_HISTORY_SIZE;

export function generateHistoryId(): string {
	return `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Deep equality functions for state comparison
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
		a.objectIds.length !== b.objectIds.length
	) {
		return false;
	}
	for (let i = 0; i < a.objectIds.length; i++) {
		if (a.objectIds[i] !== b.objectIds[i]) {
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
 * Add history entry (skips if no changes detected)
 */
export function pushHistory(
	state: EditorState,
	description: string,
): Pick<EditorState, "history" | "historyIndex" | "isDirty"> {
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

	// Truncate future history
	const newHistory = state.history.slice(0, state.historyIndex + 1);

	const entry: HistoryEntry = {
		id: generateHistoryId(),
		board: structuredClone(state.board),
		groups: structuredClone(state.groups),
		description,
	};
	newHistory.push(entry);

	// Remove oldest entry if exceeding limit
	if (newHistory.length > MAX_HISTORY_SIZE) {
		newHistory.shift();
	}

	return {
		history: newHistory,
		historyIndex: newHistory.length - 1,
		isDirty: true,
	};
}

export function generateGroupId(): string {
	return `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Update groups after object deletion (removes empty groups)
 */
export function updateGroupsAfterDelete(
	groups: ObjectGroup[],
	deletedIds: string[],
): ObjectGroup[] {
	const deletedSet = new Set(deletedIds);
	return groups
		.map((group) => ({
			...group,
			objectIds: group.objectIds.filter((id) => !deletedSet.has(id)),
		}))
		.filter((group) => group.objectIds.length > 0);
}

export function cloneBoard(board: BoardData): BoardData {
	return structuredClone(board);
}

/**
 * Update object in board (merges nested objects)
 */
export function updateObjectInBoard(
	board: BoardData,
	objectId: string,
	updates: Partial<BoardObject>,
): BoardData {
	const newBoard = cloneBoard(board);
	const index = newBoard.objects.findIndex((obj) => obj.id === objectId);
	if (index !== -1) {
		newBoard.objects[index] = {
			...newBoard.objects[index],
			...updates,
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

export function findObjectById(
	board: BoardData,
	objectId: string,
): BoardObject | undefined {
	return board.objects.find((obj) => obj.id === objectId);
}

export function findObjectIndex(board: BoardData, objectId: string): number {
	return board.objects.findIndex((obj) => obj.id === objectId);
}
