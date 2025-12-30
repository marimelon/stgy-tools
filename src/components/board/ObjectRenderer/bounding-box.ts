import {
	calculateLineEndpoint,
	DEFAULT_BBOX_SIZE,
	DEFAULT_PARAMS,
	getConeBoundingBox,
	getDonutConeBoundingBox,
	OBJECT_BBOX_SIZES,
} from "@/lib/board";
import { ObjectIds } from "@/lib/stgy";
import type { Position } from "@/lib/stgy/types";
import { CONE_RADIUS, TEXT } from "./constants";

// 共通モジュールからre-export（テスト互換性のため）
export { getConeBoundingBox, getDonutConeBoundingBox };

/**
 * オブジェクトのバウンディングボックスサイズとオフセットを取得
 */
export function getObjectBoundingBox(
	objectId: number,
	param1?: number,
	param2?: number,
	param3?: number,
	text?: string,
	position?: Position,
): { width: number; height: number; offsetX?: number; offsetY?: number } {
	// 扇形攻撃（動的計算）
	if (objectId === ObjectIds.ConeAoE) {
		const angle = param1 ?? 90;
		const cone = getConeBoundingBox(angle, CONE_RADIUS);
		return {
			width: cone.width,
			height: cone.height,
			offsetX: 0,
			offsetY: 0,
		};
	}

	// 輪形範囲攻撃（動的計算）
	if (objectId === ObjectIds.DonutAoE) {
		const angle = param1 ?? 360;
		const donutRange = param2 ?? 50;
		const outerRadius = 256; // 512 / 2
		const innerRadius = outerRadius * (donutRange / 240);

		// 360度以上の場合は完全な円
		if (angle >= 360) {
			return {
				width: outerRadius * 2,
				height: outerRadius * 2,
				offsetX: 0,
				offsetY: 0,
			};
		}

		// 内径が0の場合は扇形と同じ
		if (innerRadius <= 0) {
			const cone = getConeBoundingBox(angle, outerRadius);
			return {
				width: cone.width,
				height: cone.height,
				offsetX: 0,
				offsetY: 0,
			};
		}

		// 扇形ドーナツ
		const donut = getDonutConeBoundingBox(angle, outerRadius, innerRadius);
		return {
			width: donut.width,
			height: donut.height,
			offsetX: 0,
			offsetY: 0,
		};
	}

	// テキスト（動的計算）
	if (objectId === ObjectIds.Text) {
		const textLength = text?.length ?? 4;
		const width = Math.max(textLength * TEXT.CHAR_WIDTH, TEXT.MIN_BBOX_WIDTH);
		return { width, height: TEXT.DEFAULT_HEIGHT };
	}

	// Line: 始点(position)から終点(param1/10, param2/10)への線
	if (objectId === ObjectIds.Line && position) {
		const endpoint = calculateLineEndpoint(position, param1, param2);
		const lineThickness = param3 ?? DEFAULT_PARAMS.LINE_THICKNESS;
		// position基準の相対座標で計算
		const relEndX = endpoint.x - position.x;
		const relEndY = endpoint.y - position.y;
		// 始点(0,0)と終点を含むバウンディングボックス
		const minX = Math.min(0, relEndX);
		const maxX = Math.max(0, relEndX);
		const minY = Math.min(0, relEndY);
		const maxY = Math.max(0, relEndY);
		const width = Math.max(maxX - minX, lineThickness);
		const height = Math.max(maxY - minY, lineThickness);
		return {
			width,
			height,
			offsetX: (minX + maxX) / 2,
			offsetY: (minY + maxY) / 2,
		};
	}

	// LineAoE: 中央基準
	if (objectId === ObjectIds.LineAoE) {
		const length = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
		const thickness = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
		return {
			width: length,
			height: thickness,
			offsetX: 0,
			offsetY: 0,
		};
	}

	// OBJECT_BBOX_SIZESから取得
	const size = OBJECT_BBOX_SIZES[objectId];
	if (size) {
		return size;
	}

	// デフォルト
	return DEFAULT_BBOX_SIZE;
}
