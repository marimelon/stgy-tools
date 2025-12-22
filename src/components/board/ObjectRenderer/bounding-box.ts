import { DEFAULT_BBOX_SIZE, OBJECT_BBOX_SIZES } from "@/lib/board";
import { ObjectIds } from "@/lib/stgy";
import { CONE_RADIUS, DEFAULT_PARAMS, TEXT } from "./constants";

type Position = { x: number; y: number };

/**
 * 扇形の外接矩形を計算（中心を原点とした相対座標）
 * 起点は12時方向（-90度）、そこから時計回りに範囲角度分広がる
 */
export function getConeBoundingBox(
	angle: number,
	radius: number,
): { minX: number; minY: number; width: number; height: number } {
	// 起点: 12時方向（-90度）
	// 終点: 起点から時計回りに範囲角度分
	const startAngle = -90; // 12時方向（度）
	const endAngle = -90 + angle; // 時計回りに範囲角度分

	// 頂点を収集: 中心(0,0)、開始点、終了点
	// SVGの座標系: x=cos(θ)*r, y=sin(θ)*r（Y軸は下が正）
	const points: { x: number; y: number }[] = [
		{ x: 0, y: 0 },
		{
			x: Math.cos((startAngle * Math.PI) / 180) * radius,
			y: Math.sin((startAngle * Math.PI) / 180) * radius,
		},
		{
			x: Math.cos((endAngle * Math.PI) / 180) * radius,
			y: Math.sin((endAngle * Math.PI) / 180) * radius,
		},
	];

	// 基準角度（0, 90, 180, -90度など）が扇形の範囲内にあれば追加
	const cardinalAngles = [-90, 0, 90, 180, 270];
	for (const deg of cardinalAngles) {
		if (deg > startAngle && deg < endAngle) {
			points.push({
				x: Math.cos((deg * Math.PI) / 180) * radius,
				y: Math.sin((deg * Math.PI) / 180) * radius,
			});
		}
	}

	const xs = points.map((p) => p.x);
	const ys = points.map((p) => p.y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	return { minX, minY, width: maxX - minX, height: maxY - minY };
}

/**
 * 扇形ドーナツの外接矩形を計算（中心を原点とした相対座標）
 * 起点は12時方向（-90度）、そこから時計回りに範囲角度分広がる
 * 扇形と異なり中心(0,0)を含まず、外弧と内弧の点のみを考慮
 */
export function getDonutConeBoundingBox(
	angle: number,
	outerRadius: number,
	innerRadius: number,
): { minX: number; minY: number; width: number; height: number } {
	const startAngle = -90;
	const endAngle = -90 + angle;

	const points: { x: number; y: number }[] = [];

	// 外弧の開始点と終了点
	points.push({
		x: Math.cos((startAngle * Math.PI) / 180) * outerRadius,
		y: Math.sin((startAngle * Math.PI) / 180) * outerRadius,
	});
	points.push({
		x: Math.cos((endAngle * Math.PI) / 180) * outerRadius,
		y: Math.sin((endAngle * Math.PI) / 180) * outerRadius,
	});

	// 内弧の開始点と終了点
	points.push({
		x: Math.cos((startAngle * Math.PI) / 180) * innerRadius,
		y: Math.sin((startAngle * Math.PI) / 180) * innerRadius,
	});
	points.push({
		x: Math.cos((endAngle * Math.PI) / 180) * innerRadius,
		y: Math.sin((endAngle * Math.PI) / 180) * innerRadius,
	});

	// 基準角度が範囲内にあれば外弧と内弧の両方に追加
	const cardinalAngles = [-90, 0, 90, 180, 270];
	for (const deg of cardinalAngles) {
		if (deg > startAngle && deg < endAngle) {
			points.push({
				x: Math.cos((deg * Math.PI) / 180) * outerRadius,
				y: Math.sin((deg * Math.PI) / 180) * outerRadius,
			});
			points.push({
				x: Math.cos((deg * Math.PI) / 180) * innerRadius,
				y: Math.sin((deg * Math.PI) / 180) * innerRadius,
			});
		}
	}

	const xs = points.map((p) => p.x);
	const ys = points.map((p) => p.y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	return { minX, minY, width: maxX - minX, height: maxY - minY };
}

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
		const endX = (param1 ?? position.x * 10 + 2560) / 10;
		const endY = (param2 ?? position.y * 10) / 10;
		const lineThickness = param3 ?? 6;
		// position基準の相対座標で計算
		const relEndX = endX - position.x;
		const relEndY = endY - position.y;
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
