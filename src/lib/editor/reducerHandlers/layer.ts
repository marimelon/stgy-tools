/**
 * レイヤー操作ハンドラー
 */

import type { EditorState } from "../types";
import { cloneBoard, pushHistory } from "./utils";

/** レイヤー移動方向 */
export type LayerDirection = "front" | "back" | "forward" | "backward";

/**
 * レイヤーを移動
 */
export function handleMoveLayer(
	state: EditorState,
	payload: { index: number; direction: LayerDirection },
): EditorState {
	const { index, direction } = payload;
	const objects = state.board.objects;

	// 範囲外チェック
	if (index < 0 || index >= objects.length) return state;

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

	// グループのインデックスを更新
	const updatedGroups = state.groups.map((group) => ({
		...group,
		objectIndices: group.objectIndices.map((i) => {
			if (i === index) return newIndex;
			if (index < newIndex) {
				// 下に移動: index+1 ~ newIndex の範囲を -1
				if (i > index && i <= newIndex) return i - 1;
			} else {
				// 上に移動: newIndex ~ index-1 の範囲を +1
				if (i >= newIndex && i < index) return i + 1;
			}
			return i;
		}),
	}));

	const descriptions: Record<LayerDirection, string> = {
		front: "最前面へ移動",
		back: "最背面へ移動",
		forward: "前面へ移動",
		backward: "背面へ移動",
	};

	return {
		...state,
		board: newBoard,
		groups: updatedGroups,
		selectedIndices: [newIndex],
		...pushHistory(
			{ ...state, groups: updatedGroups },
			descriptions[direction],
		),
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

	// グループのインデックスを更新
	const updatedGroups = state.groups.map((group) => ({
		...group,
		objectIndices: group.objectIndices.map((i) => {
			if (i === fromIndex) return adjustedToIndex;
			// fromIndex から adjustedToIndex への移動によるシフト
			if (fromIndex < adjustedToIndex) {
				// 下に移動: fromIndex+1 ~ adjustedToIndex の範囲を -1
				if (i > fromIndex && i <= adjustedToIndex) return i - 1;
			} else {
				// 上に移動: adjustedToIndex ~ fromIndex-1 の範囲を +1
				if (i >= adjustedToIndex && i < fromIndex) return i + 1;
			}
			return i;
		}),
	}));

	return {
		...state,
		board: newBoard,
		groups: updatedGroups,
		selectedIndices: [adjustedToIndex],
		...pushHistory({ ...state, groups: updatedGroups }, "レイヤー順序変更"),
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

	const sortedIndices = [...group.objectIndices].sort((a, b) => a - b);
	const groupSize = sortedIndices.length;
	const firstIndex = sortedIndices[0];

	// 同じ位置への移動は無視
	if (toIndex === firstIndex || toIndex === firstIndex + groupSize) {
		return state;
	}

	const newBoard = cloneBoard(state.board);

	// グループ内オブジェクトを取り出す（インデックス順）
	const groupObjects = sortedIndices.map((i) => newBoard.objects[i]);

	// 削除（後ろから削除してインデックスがずれないように）
	for (let i = sortedIndices.length - 1; i >= 0; i--) {
		newBoard.objects.splice(sortedIndices[i], 1);
	}

	// 挿入位置を計算（削除によりインデックスがずれる可能性）
	let insertAt = toIndex;
	if (toIndex > firstIndex) {
		// 削除された分を差し引く
		insertAt = toIndex - groupSize;
	}

	// 挿入
	newBoard.objects.splice(insertAt, 0, ...groupObjects);

	// 新しいグループのインデックス
	const newGroupIndices = groupObjects.map((_, i) => insertAt + i);

	// 全グループのインデックスを再計算
	const updatedGroups = state.groups.map((g) => {
		if (g.id === groupId) {
			return { ...g, objectIndices: newGroupIndices };
		}

		// 他のグループのインデックスも調整
		const newIndices = g.objectIndices.map((idx) => {
			// 削除された範囲にあったインデックスの調整
			let newIdx = idx;

			// 削除による影響
			const deletedBefore = sortedIndices.filter((si) => si < idx).length;
			newIdx -= deletedBefore;

			// 挿入による影響
			if (newIdx >= insertAt) {
				newIdx += groupSize;
			}

			return newIdx;
		});

		return { ...g, objectIndices: newIndices };
	});

	return {
		...state,
		board: newBoard,
		groups: updatedGroups,
		selectedIndices: newGroupIndices,
		...pushHistory({ ...state, groups: updatedGroups }, "グループ移動"),
	};
}
