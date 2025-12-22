/**
 * ボード用ジオメトリ計算関数
 * クライアント・サーバー両方で使用される純粋な計算関数
 */

/**
 * バウンディングボックスの型
 */
export type BoundingBoxResult = {
	minX: number;
	minY: number;
	width: number;
	height: number;
};

/**
 * 扇形の外接矩形を計算（中心を原点とした相対座標）
 * 起点は12時方向（-90度）、そこから時計回りに範囲角度分広がる
 */
export function getConeBoundingBox(
	angle: number,
	radius: number,
): BoundingBoxResult {
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
): BoundingBoxResult {
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
