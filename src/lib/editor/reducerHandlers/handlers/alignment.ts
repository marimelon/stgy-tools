/**
 * 整列操作ハンドラー
 */

import i18n from "@/lib/i18n";
import type {
	AlignmentType,
	CircularModeState,
	EditorState,
} from "../../types";
import { cloneBoard, pushHistory, updateObjectInBoard } from "../utils";

/** 整列タイプの説明キー */
const ALIGNMENT_DESCRIPTION_KEYS: Record<AlignmentType, string> = {
	left: "history.alignLeft",
	center: "history.alignCenterH",
	right: "history.alignRight",
	top: "history.alignTop",
	middle: "history.alignCenterV",
	bottom: "history.alignBottom",
	"distribute-h": "history.distributeH",
	"distribute-v": "history.distributeV",
	circular: "history.circularArrangement",
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
		case "circular": {
			// 重心を計算（選択オブジェクトの平均座標）
			const sumX = positions.reduce((sum, p) => sum + p.x, 0);
			const sumY = positions.reduce((sum, p) => sum + p.y, 0);
			const centroidX = sumX / positions.length;
			const centroidY = sumY / positions.length;

			// 最大距離を半径とする（現在の広がりを維持）
			// 最小半径は50に制限
			const calculatedRadius = Math.max(
				...positions.map((p) =>
					Math.sqrt((p.x - centroidX) ** 2 + (p.y - centroidY) ** 2),
				),
			);
			const circularRadius = Math.max(50, calculatedRadius);

			// 各オブジェクトの角度を計算・保存
			const objectAngles = new Map<number, number>();

			// 各オブジェクトの元の角度を保持したまま、半径だけを揃えて円周上に配置
			for (let i = 0; i < validIndices.length; i++) {
				const idx = validIndices[i];
				const pos = positions[i];
				// 現在の角度を計算
				const angle = Math.atan2(pos.y - centroidY, pos.x - centroidX);
				objectAngles.set(idx, angle);
				// 同じ角度で半径を揃える
				newBoard = updateObjectInBoard(newBoard, idx, {
					position: {
						x: centroidX + circularRadius * Math.cos(angle),
						y: centroidY + circularRadius * Math.sin(angle),
					},
				});
			}

			// 円形配置モードを有効化
			const circularModeState: CircularModeState = {
				center: { x: centroidX, y: centroidY },
				radius: circularRadius,
				participatingIndices: validIndices,
				objectAngles,
			};

			return {
				...state,
				board: newBoard,
				circularMode: circularModeState,
				...pushHistory(state, i18n.t(ALIGNMENT_DESCRIPTION_KEYS[alignment])),
			};
		}
	}

	return {
		...state,
		board: newBoard,
		...pushHistory(state, i18n.t(ALIGNMENT_DESCRIPTION_KEYS[alignment])),
	};
}
