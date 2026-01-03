/**
 * オブジェクト操作ハンドラー
 */

import i18n from "@/lib/i18n";
import { type BoardObject, ObjectIds } from "@/lib/stgy";
import { duplicateObject } from "../../factory";
import type { BatchUpdatePayload, EditorState } from "../../types";
import { canAddObject, canAddObjects } from "../businessLogic/validation";
import {
	cloneBoard,
	findObjectById,
	pushHistory,
	updateGroupsAfterDelete,
	updateObjectInBoard,
} from "../utils";

/**
 * オブジェクトを更新
 */
export function handleUpdateObject(
	state: EditorState,
	payload: { objectId: string; updates: Partial<BoardObject> },
): EditorState {
	const newBoard = updateObjectInBoard(
		state.board,
		payload.objectId,
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
	// ID-basedなのでグループのインデックス更新は不要
	return {
		...state,
		board: newBoard,
		selectedIds: [payload.object.id],
		lastError: null,
		...pushHistory({ ...state, board: newBoard }, i18n.t("history.addObject")),
	};
}

/**
 * オブジェクトを削除
 */
export function handleDeleteObjects(
	state: EditorState,
	payload: { objectIds: string[] },
): EditorState {
	if (payload.objectIds.length === 0) return state;

	const newBoard = cloneBoard(state.board);
	const idsToDelete = new Set(payload.objectIds);
	newBoard.objects = newBoard.objects.filter((obj) => !idsToDelete.has(obj.id));
	// グループを更新
	const updatedGroups = updateGroupsAfterDelete(
		state.groups,
		payload.objectIds,
	);
	return {
		...state,
		board: newBoard,
		groups: updatedGroups,
		selectedIds: [],
		...pushHistory(
			{ ...state, board: newBoard, groups: updatedGroups },
			i18n.t("history.deleteObject"),
		),
	};
}

/**
 * オブジェクトを複製
 */
export function handleDuplicateObjects(
	state: EditorState,
	payload: { objectIds: string[] },
): EditorState {
	if (payload.objectIds.length === 0) return state;

	// 複製対象のオブジェクトを収集
	const objectsToDuplicate: BoardObject[] = [];
	for (const objectId of payload.objectIds) {
		const obj = findObjectById(state.board, objectId);
		if (obj) {
			objectsToDuplicate.push(obj);
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
	const newIds: string[] = [];

	for (const obj of objectsToDuplicate) {
		const duplicated = duplicateObject(obj);
		newBoard.objects.push(duplicated);
		newIds.push(duplicated.id);
	}

	return {
		...state,
		board: newBoard,
		selectedIds: newIds,
		lastError: null,
		...pushHistory(
			{ ...state, board: newBoard },
			i18n.t("history.duplicateObject"),
		),
	};
}

/**
 * オブジェクトを移動
 */
export function handleMoveObjects(
	state: EditorState,
	payload: { objectIds: string[]; deltaX: number; deltaY: number },
): EditorState {
	if (payload.objectIds.length === 0) return state;

	let newBoard = state.board;
	for (const objectId of payload.objectIds) {
		const obj = findObjectById(newBoard, objectId);
		if (obj) {
			// Lineオブジェクトの場合は終点座標（param1, param2）も移動
			if (obj.objectId === ObjectIds.Line) {
				const deltaX10 = Math.round(payload.deltaX * 10);
				const deltaY10 = Math.round(payload.deltaY * 10);
				newBoard = updateObjectInBoard(newBoard, objectId, {
					position: {
						x: obj.position.x + payload.deltaX,
						y: obj.position.y + payload.deltaY,
					},
					param1: (obj.param1 ?? obj.position.x * 10 + 2560) + deltaX10,
					param2: (obj.param2 ?? obj.position.y * 10) + deltaY10,
				});
			} else {
				newBoard = updateObjectInBoard(newBoard, objectId, {
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
	payload: { objectIds: string[]; updates: BatchUpdatePayload },
): EditorState {
	const { objectIds, updates } = payload;
	if (objectIds.length === 0 || Object.keys(updates).length === 0) {
		return state;
	}

	const idsToUpdate = new Set(objectIds);

	// 単一クローンで効率的にバッチ更新
	const newBoard = cloneBoard(state.board);

	for (let i = 0; i < newBoard.objects.length; i++) {
		const obj = newBoard.objects[i];
		if (!idsToUpdate.has(obj.id)) continue;

		// 更新を適用（ネストされたオブジェクトは適切にマージ）
		newBoard.objects[i] = {
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
