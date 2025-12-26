/**
 * 整列操作ハンドラー
 */

import type { AlignmentType, EditorState } from "../../types";
import { cloneBoard, pushHistory, updateObjectInBoard } from "../utils";

/** 整列タイプの説明 */
const ALIGNMENT_DESCRIPTIONS: Record<AlignmentType, string> = {
	left: "左揃え",
	center: "左右中央揃え",
	right: "右揃え",
	top: "上揃え",
	middle: "上下中央揃え",
	bottom: "下揃え",
	"distribute-h": "水平方向に均等配置",
	"distribute-v": "垂直方向に均等配置",
};

/**
 * オブジェクトを整列
 */
export function handleAlignObjects(
	state: EditorState,
	payload: { indices: number[]; alignment: AlignmentType },
): EditorState {
	const { indices, alignment } = payload;
	if (indices.length < 2) return state;

	// 有効なインデックスのみフィルタ
	const validIndices = indices.filter(
		(i) => i >= 0 && i < state.board.objects.length,
	);
	if (validIndices.length < 2) return state;

	const objects = validIndices.map((i) => state.board.objects[i]);

	// 位置の境界を計算
	const positions = objects.map((obj) => obj.position);
	const minX = Math.min(...positions.map((p) => p.x));
	const maxX = Math.max(...positions.map((p) => p.x));
	const minY = Math.min(...positions.map((p) => p.y));
	const maxY = Math.max(...positions.map((p) => p.y));
	const centerX = (minX + maxX) / 2;
	const centerY = (minY + maxY) / 2;

	let newBoard = cloneBoard(state.board);

	// 整列タイプに応じて位置を更新
	switch (alignment) {
		case "left":
			for (const idx of validIndices) {
				newBoard = updateObjectInBoard(newBoard, idx, {
					position: { ...newBoard.objects[idx].position, x: minX },
				});
			}
			break;
		case "center":
			for (const idx of validIndices) {
				newBoard = updateObjectInBoard(newBoard, idx, {
					position: { ...newBoard.objects[idx].position, x: centerX },
				});
			}
			break;
		case "right":
			for (const idx of validIndices) {
				newBoard = updateObjectInBoard(newBoard, idx, {
					position: { ...newBoard.objects[idx].position, x: maxX },
				});
			}
			break;
		case "top":
			for (const idx of validIndices) {
				newBoard = updateObjectInBoard(newBoard, idx, {
					position: { ...newBoard.objects[idx].position, y: minY },
				});
			}
			break;
		case "middle":
			for (const idx of validIndices) {
				newBoard = updateObjectInBoard(newBoard, idx, {
					position: { ...newBoard.objects[idx].position, y: centerY },
				});
			}
			break;
		case "bottom":
			for (const idx of validIndices) {
				newBoard = updateObjectInBoard(newBoard, idx, {
					position: { ...newBoard.objects[idx].position, y: maxY },
				});
			}
			break;
		case "distribute-h": {
			// X座標でソート
			const sortedByX = [...validIndices].sort(
				(a, b) =>
					newBoard.objects[a].position.x - newBoard.objects[b].position.x,
			);
			if (sortedByX.length >= 2) {
				const step = (maxX - minX) / (sortedByX.length - 1);
				for (let i = 0; i < sortedByX.length; i++) {
					const idx = sortedByX[i];
					newBoard = updateObjectInBoard(newBoard, idx, {
						position: { ...newBoard.objects[idx].position, x: minX + step * i },
					});
				}
			}
			break;
		}
		case "distribute-v": {
			// Y座標でソート
			const sortedByY = [...validIndices].sort(
				(a, b) =>
					newBoard.objects[a].position.y - newBoard.objects[b].position.y,
			);
			if (sortedByY.length >= 2) {
				const step = (maxY - minY) / (sortedByY.length - 1);
				for (let i = 0; i < sortedByY.length; i++) {
					const idx = sortedByY[i];
					newBoard = updateObjectInBoard(newBoard, idx, {
						position: { ...newBoard.objects[idx].position, y: minY + step * i },
					});
				}
			}
			break;
		}
	}

	return {
		...state,
		board: newBoard,
		...pushHistory(state, ALIGNMENT_DESCRIPTIONS[alignment]),
	};
}
