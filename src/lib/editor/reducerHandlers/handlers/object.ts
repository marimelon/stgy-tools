/**
 * オブジェクト操作ハンドラー
 */

import { type BoardObject, ObjectIds } from "@/lib/stgy";
import { duplicateObject } from "../../factory";
import type { BatchUpdatePayload, EditorState } from "../../types";
import { canAddObject, canAddObjects } from "../businessLogic/validation";
import {
	cloneBoard,
	pushHistory,
	shiftGroupIndices,
	updateGroupsAfterDelete,
	updateObjectInBoard,
} from "../utils";

/**
 * オブジェクトを更新
 */
export function handleUpdateObject(
	state: EditorState,
	payload: { index: number; updates: Partial<BoardObject> },
): EditorState {
	const newBoard = updateObjectInBoard(
		state.board,
		payload.index,
		payload.updates,
	);
	return {
		...state,
		board: newBoard,
		isDirty: true,
	};
}

/**
 * オブジェクトを追加
 */
export function handleAddObject(
	state: EditorState,
	payload: { object: BoardObject },
): EditorState {
	// バリデーション
	const validation = canAddObject(state.board, payload.object.objectId);
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
	newBoard.objects.unshift(payload.object);
	// グループのインデックスを更新（先頭に追加するので全て+1）
	const updatedGroups = shiftGroupIndices(state.groups, 1);
	return {
		...state,
		board: newBoard,
		groups: updatedGroups,
		selectedIndices: [0],
		lastError: null,
		...pushHistory({ ...state, groups: updatedGroups }, "オブジェクト追加"),
	};
}

/**
 * オブジェクトを削除
 */
export function handleDeleteObjects(
	state: EditorState,
	payload: { indices: number[] },
): EditorState {
	if (payload.indices.length === 0) return state;

	const newBoard = cloneBoard(state.board);
	// インデックスを降順でソートして削除 (インデックスのずれを防ぐ)
	const sortedIndices = [...payload.indices].sort((a, b) => b - a);
	for (const index of sortedIndices) {
		if (index >= 0 && index < newBoard.objects.length) {
			newBoard.objects.splice(index, 1);
		}
	}
	// グループを更新
	const updatedGroups = updateGroupsAfterDelete(state.groups, payload.indices);
	return {
		...state,
		board: newBoard,
		groups: updatedGroups,
		selectedIndices: [],
		...pushHistory({ ...state, groups: updatedGroups }, "オブジェクト削除"),
	};
}

/**
 * オブジェクトを複製
 */
export function handleDuplicateObjects(
	state: EditorState,
	payload: { indices: number[] },
): EditorState {
	if (payload.indices.length === 0) return state;

	// 複製対象のオブジェクトを収集
	const objectsToDuplicate: BoardObject[] = [];
	for (const index of payload.indices) {
		if (index >= 0 && index < state.board.objects.length) {
			objectsToDuplicate.push(state.board.objects[index]);
		}
	}

	// バリデーション
	const validation = canAddObjects(state.board, objectsToDuplicate);
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
	const newIndices: number[] = [];

	for (const index of payload.indices) {
		if (index >= 0 && index < state.board.objects.length) {
			const original = state.board.objects[index];
			const duplicated = duplicateObject(original);
			newBoard.objects.push(duplicated);
			newIndices.push(newBoard.objects.length - 1);
		}
	}

	return {
		...state,
		board: newBoard,
		selectedIndices: newIndices,
		lastError: null,
		...pushHistory(state, "オブジェクト複製"),
	};
}

/**
 * オブジェクトを移動
 */
export function handleMoveObjects(
	state: EditorState,
	payload: { indices: number[]; deltaX: number; deltaY: number },
): EditorState {
	if (payload.indices.length === 0) return state;

	let newBoard = state.board;
	for (const index of payload.indices) {
		if (index >= 0 && index < newBoard.objects.length) {
			const obj = newBoard.objects[index];

			// Lineオブジェクトの場合は終点座標（param1, param2）も移動
			if (obj.objectId === ObjectIds.Line) {
				const deltaX10 = Math.round(payload.deltaX * 10);
				const deltaY10 = Math.round(payload.deltaY * 10);
				newBoard = updateObjectInBoard(newBoard, index, {
					position: {
						x: obj.position.x + payload.deltaX,
						y: obj.position.y + payload.deltaY,
					},
					param1: (obj.param1 ?? obj.position.x * 10 + 2560) + deltaX10,
					param2: (obj.param2 ?? obj.position.y * 10) + deltaY10,
				});
			} else {
				newBoard = updateObjectInBoard(newBoard, index, {
					position: {
						x: obj.position.x + payload.deltaX,
						y: obj.position.y + payload.deltaY,
					},
				});
			}
		}
	}

	return {
		...state,
		board: newBoard,
		isDirty: true,
	};
}

/**
 * 複数オブジェクトを一括更新
 *
 * 効率のため単一のボードクローンで全オブジェクトを更新
 */
export function handleUpdateObjectsBatch(
	state: EditorState,
	payload: { indices: number[]; updates: BatchUpdatePayload },
): EditorState {
	const { indices, updates } = payload;
	if (indices.length === 0 || Object.keys(updates).length === 0) {
		return state;
	}

	// 単一クローンで効率的にバッチ更新
	const newBoard = cloneBoard(state.board);

	for (const index of indices) {
		if (index < 0 || index >= newBoard.objects.length) continue;

		const obj = newBoard.objects[index];

		// 更新を適用（ネストされたオブジェクトは適切にマージ）
		newBoard.objects[index] = {
			...obj,
			...(updates.rotation !== undefined && { rotation: updates.rotation }),
			...(updates.size !== undefined && { size: updates.size }),
			...(updates.param1 !== undefined && { param1: updates.param1 }),
			...(updates.param2 !== undefined && { param2: updates.param2 }),
			...(updates.param3 !== undefined && { param3: updates.param3 }),
			flags: {
				...obj.flags,
				...(updates.flags ?? {}),
			},
			color: {
				...obj.color,
				...(updates.color ?? {}),
			},
		};
	}

	return {
		...state,
		board: newBoard,
		isDirty: true,
	};
}
