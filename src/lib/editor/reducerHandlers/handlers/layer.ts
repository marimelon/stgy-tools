/**
 * レイヤー操作ハンドラー
 */

import i18n from "@/lib/i18n";
import type { EditorState } from "../../types";
import { cloneBoard, findObjectIndex, pushHistory } from "../utils";

/** レイヤー移動方向 */
export type LayerDirection = "front" | "back" | "forward" | "backward";

/**
 * レイヤーを移動
 */
export function handleMoveLayer(
	state: EditorState,
	payload: { objectId: string; direction: LayerDirection },
): EditorState {
	const { objectId, direction } = payload;
	const index = findObjectIndex(state.board, objectId);

	// 見つからない場合は無視
	if (index === -1) return state;

	const newBoard = cloneBoard(state.board);
	const [movedObject] = newBoard.objects.splice(index, 1);

	let newIndex: number;
	switch (direction) {
		case "front":
			// 最前面（配列の先頭）
			newIndex = 0;
			break;
		case "back":
			// 最背面（配列の末尾）
			newIndex = newBoard.objects.length;
			break;
		case "forward":
			// 1つ前面へ（配列で前へ）
			newIndex = Math.max(0, index - 1);
			break;
		case "backward":
			// 1つ背面へ（配列で後ろへ）
			newIndex = Math.min(newBoard.objects.length, index + 1);
			break;
	}

	newBoard.objects.splice(newIndex, 0, movedObject);

	// ID-basedなのでグループのインデックス更新は不要

	const descriptions: Record<LayerDirection, string> = {
		front: i18n.t("history.bringToFront"),
		back: i18n.t("history.sendToBack"),
		forward: i18n.t("history.bringForward"),
		backward: i18n.t("history.sendBackward"),
	};

	return {
		...state,
		board: newBoard,
		selectedIds: [objectId],
		...pushHistory({ ...state, board: newBoard }, descriptions[direction]),
	};
}

/**
 * レイヤーを任意の位置に移動（ドラッグ&ドロップ用）
 */
export function handleReorderLayer(
	state: EditorState,
	payload: { fromIndex: number; toIndex: number },
): EditorState {
	const { fromIndex, toIndex } = payload;
	const objects = state.board.objects;

	// 範囲外チェック
	if (fromIndex < 0 || fromIndex >= objects.length) return state;
	if (toIndex < 0 || toIndex > objects.length) return state;
	// 同じ位置への移動は無視
	if (fromIndex === toIndex || fromIndex === toIndex - 1) return state;

	const newBoard = cloneBoard(state.board);
	const [movedObject] = newBoard.objects.splice(fromIndex, 1);

	// fromIndex より後ろに挿入する場合、削除により位置がずれるので調整
	const adjustedToIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
	newBoard.objects.splice(adjustedToIndex, 0, movedObject);

	// ID-basedなのでグループのインデックス更新は不要

	return {
		...state,
		board: newBoard,
		selectedIds: [movedObject.id],
		...pushHistory(
			{ ...state, board: newBoard },
			i18n.t("history.reorderLayers"),
		),
	};
}

/**
 * グループ全体を任意の位置に移動
 */
export function handleReorderGroup(
	state: EditorState,
	payload: { groupId: string; toIndex: number },
): EditorState {
	const { groupId, toIndex } = payload;

	// グループを探す
	const group = state.groups.find((g) => g.id === groupId);
	if (!group) return state;

	// グループ内オブジェクトのインデックスを取得（配列順でソート）
	const groupObjectIndices: number[] = [];
	for (let i = 0; i < state.board.objects.length; i++) {
		if (group.objectIds.includes(state.board.objects[i].id)) {
			groupObjectIndices.push(i);
		}
	}

	if (groupObjectIndices.length === 0) return state;

	const groupSize = groupObjectIndices.length;
	const firstIndex = groupObjectIndices[0];

	// 同じ位置への移動は無視
	if (toIndex === firstIndex || toIndex === firstIndex + groupSize) {
		return state;
	}

	const newBoard = cloneBoard(state.board);

	// グループ内オブジェクトを取り出す（インデックス順）
	const groupObjects = groupObjectIndices.map((i) => newBoard.objects[i]);

	// 削除（後ろから削除してインデックスがずれないように）
	for (let i = groupObjectIndices.length - 1; i >= 0; i--) {
		newBoard.objects.splice(groupObjectIndices[i], 1);
	}

	// 挿入位置を計算（削除によりインデックスがずれる可能性）
	let insertAt = toIndex;
	if (toIndex > firstIndex) {
		// 削除された分を差し引く
		insertAt = toIndex - groupSize;
	}

	// 挿入
	newBoard.objects.splice(insertAt, 0, ...groupObjects);

	// ID-basedなのでグループのインデックス更新は不要
	// 選択を移動したグループ内オブジェクトに設定
	const selectedIds = groupObjects.map((obj) => obj.id);

	return {
		...state,
		board: newBoard,
		selectedIds,
		...pushHistory({ ...state, board: newBoard }, i18n.t("history.groupMove")),
	};
}
