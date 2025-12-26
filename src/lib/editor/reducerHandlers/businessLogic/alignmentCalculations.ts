/**
 * 整列計算ロジック
 */

import type { BoardObject, Position } from "@/lib/stgy";
import type { AlignmentType } from "../../types";

export interface AlignmentResult {
	/** オブジェクトインデックス → 新しい位置のマップ */
	positionUpdates: Map<number, Position>;
}

/**
 * 整列計算を実行
 * @param objects 全オブジェクト配列
 * @param indices 整列対象のインデックス配列
 * @param alignment 整列タイプ
 * @returns 位置更新のマップ
 */
export function calculateAlignment(
	objects: BoardObject[],
	indices: number[],
	alignment: AlignmentType,
): AlignmentResult {
	if (indices.length < 2) {
		return { positionUpdates: new Map() };
	}

	// 有効なインデックスのみフィルタ
	const validIndices = indices.filter((i) => i >= 0 && i < objects.length);
	if (validIndices.length < 2) {
		return { positionUpdates: new Map() };
	}

	const targetObjects = validIndices.map((i) => objects[i]);
	const positions = targetObjects.map((obj) => obj.position);
	const positionUpdates = new Map<number, Position>();

	// 位置の境界を計算
	const minX = Math.min(...positions.map((p) => p.x));
	const maxX = Math.max(...positions.map((p) => p.x));
	const minY = Math.min(...positions.map((p) => p.y));
	const maxY = Math.max(...positions.map((p) => p.y));
	const centerX = (minX + maxX) / 2;
	const centerY = (minY + maxY) / 2;

	// 整列タイプに応じて位置を計算
	switch (alignment) {
		case "left":
			for (const idx of validIndices) {
				positionUpdates.set(idx, {
					...objects[idx].position,
					x: minX,
				});
			}
			break;

		case "center":
			for (const idx of validIndices) {
				positionUpdates.set(idx, {
					...objects[idx].position,
					x: centerX,
				});
			}
			break;

		case "right":
			for (const idx of validIndices) {
				positionUpdates.set(idx, {
					...objects[idx].position,
					x: maxX,
				});
			}
			break;

		case "top":
			for (const idx of validIndices) {
				positionUpdates.set(idx, {
					...objects[idx].position,
					y: minY,
				});
			}
			break;

		case "middle":
			for (const idx of validIndices) {
				positionUpdates.set(idx, {
					...objects[idx].position,
					y: centerY,
				});
			}
			break;

		case "bottom":
			for (const idx of validIndices) {
				positionUpdates.set(idx, {
					...objects[idx].position,
					y: maxY,
				});
			}
			break;

		case "distribute-h": {
			// X座標でソート
			const sortedByX = [...validIndices].sort(
				(a, b) => objects[a].position.x - objects[b].position.x,
			);
			if (sortedByX.length >= 2) {
				const step = (maxX - minX) / (sortedByX.length - 1);
				for (let i = 0; i < sortedByX.length; i++) {
					const idx = sortedByX[i];
					positionUpdates.set(idx, {
						...objects[idx].position,
						x: minX + step * i,
					});
				}
			}
			break;
		}

		case "distribute-v": {
			// Y座標でソート
			const sortedByY = [...validIndices].sort(
				(a, b) => objects[a].position.y - objects[b].position.y,
			);
			if (sortedByY.length >= 2) {
				const step = (maxY - minY) / (sortedByY.length - 1);
				for (let i = 0; i < sortedByY.length; i++) {
					const idx = sortedByY[i];
					positionUpdates.set(idx, {
						...objects[idx].position,
						y: minY + step * i,
					});
				}
			}
			break;
		}
	}

	return { positionUpdates };
}
