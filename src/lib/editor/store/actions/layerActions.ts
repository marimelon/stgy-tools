/**
 * レイヤー操作アクション
 */

import i18n from "@/lib/i18n";
import { cloneBoard, pushHistory } from "../../utils";
import type { EditorStore } from "../types";

/** レイヤー移動方向 */
export type LayerDirection = "front" | "back" | "forward" | "backward";

/**
 * レイヤーアクションを作成
 */
export function createLayerActions(store: EditorStore) {
	/**
	 * レイヤーを移動
	 */
	const moveLayer = (objectId: string, direction: LayerDirection) => {
		store.setState((state) => {
			const objects = state.board.objects;
			const index = objects.findIndex((obj) => obj.id === objectId);

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
		});
	};

	/**
	 * 選択中オブジェクトのレイヤーを移動
	 */
	const moveSelectedLayer = (direction: LayerDirection) => {
		const state = store.state;
		if (state.selectedIds.length !== 1) return;
		moveLayer(state.selectedIds[0], direction);
	};

	/**
	 * レイヤーを任意の位置に移動（ドラッグ&ドロップ用）
	 */
	const reorderLayer = (objectId: string, toIndex: number) => {
		store.setState((state) => {
			const objects = state.board.objects;
			const fromIndex = objects.findIndex((obj) => obj.id === objectId);

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

			return {
				...state,
				board: newBoard,
				selectedIds: [objectId],
				...pushHistory(
					{ ...state, board: newBoard },
					i18n.t("history.reorderLayers"),
				),
			};
		});
	};

	/**
	 * グループ全体を任意の位置に移動
	 */
	const reorderGroup = (groupId: string, toIndex: number) => {
		store.setState((state) => {
			// グループを探す
			const group = state.groups.find((g) => g.id === groupId);
			if (!group) return state;

			const newBoard = cloneBoard(state.board);

			// グループ内オブジェクトの現在のインデックスを取得（配列順）
			const groupIndices = group.objectIds
				.map((id) => newBoard.objects.findIndex((obj) => obj.id === id))
				.filter((idx) => idx !== -1)
				.sort((a, b) => a - b);

			if (groupIndices.length === 0) return state;

			const groupSize = groupIndices.length;
			const firstIndex = groupIndices[0];

			// 同じ位置への移動は無視
			if (toIndex === firstIndex || toIndex === firstIndex + groupSize) {
				return state;
			}

			// グループ内オブジェクトを取り出す（インデックス順）
			const groupObjects = groupIndices.map((i) => newBoard.objects[i]);

			// 削除（後ろから削除してインデックスがずれないように）
			for (let i = groupIndices.length - 1; i >= 0; i--) {
				newBoard.objects.splice(groupIndices[i], 1);
			}

			// 挿入位置を計算（削除によりインデックスがずれる可能性）
			let insertAt = toIndex;
			if (toIndex > firstIndex) {
				// 削除された分を差し引く
				insertAt = toIndex - groupSize;
			}

			// 挿入
			newBoard.objects.splice(insertAt, 0, ...groupObjects);

			// 選択を更新（IDは変わらない）
			const newSelectedIds = groupObjects.map((obj) => obj.id);

			return {
				...state,
				board: newBoard,
				selectedIds: newSelectedIds,
				...pushHistory(
					{ ...state, board: newBoard },
					i18n.t("history.groupMove"),
				),
			};
		});
	};

	return {
		moveLayer,
		moveSelectedLayer,
		reorderLayer,
		reorderGroup,
	};
}

export type LayerActions = ReturnType<typeof createLayerActions>;
