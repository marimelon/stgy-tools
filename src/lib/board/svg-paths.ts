/**
 * SVGパス生成ユーティリティ
 * サーバーサイド・クライアントサイド両方で使用
 *
 * 扇形（Cone）とドーナツ形（Donut）のSVGパス生成を共通化
 */

import { getConeBoundingBox, getDonutConeBoundingBox } from "./geometry";

/**
 * 扇形パスの計算結果
 */
export interface ConePathResult {
	/** SVGパス文字列 */
	path: string;
	/** オフセットX（バウンディングボックス中心合わせ） */
	offsetX: number;
	/** オフセットY（バウンディングボックス中心合わせ） */
	offsetY: number;
}

/**
 * 扇形のSVGパスを生成
 * 起点は12時方向（上）、そこから時計回りに範囲角度分広がる
 *
 * @param angle 範囲角度（度）
 * @param radius 半径
 * @returns パス文字列とオフセット
 */
export function generateConePath(
	angle: number,
	radius: number,
): ConePathResult {
	// バウンディングボックスの中心がオブジェクト座標に来るようにオフセット計算
	const bbox = getConeBoundingBox(angle, radius);
	const offsetX = -(bbox.minX + bbox.width / 2);
	const offsetY = -(bbox.minY + bbox.height / 2);

	// SVGの座標系: 0度=右、90度=下、-90度=上
	// 起点: 12時方向（-90度、上）
	const startRad = -Math.PI / 2;
	const endRad = startRad + (angle * Math.PI) / 180;

	// オフセットを適用した座標
	const x1 = offsetX + Math.cos(startRad) * radius;
	const y1 = offsetY + Math.sin(startRad) * radius;
	const x2 = offsetX + Math.cos(endRad) * radius;
	const y2 = offsetY + Math.sin(endRad) * radius;

	const largeArc = angle > 180 ? 1 : 0;

	// 時計回り（sweep=1）で描画
	const path = `M ${offsetX} ${offsetY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

	return { path, offsetX, offsetY };
}

/**
 * ドーナツ形（穴あき円または扇形ドーナツ）のSVGパスを生成
 *
 * @param angle 範囲角度（度）、360以上で完全な円
 * @param outerRadius 外径
 * @param innerRadius 内径（0の場合は扇形）
 * @returns パス文字列とオフセット
 */
export function generateDonutPath(
	angle: number,
	outerRadius: number,
	innerRadius: number,
): ConePathResult {
	// 360度以上の場合は完全な円ドーナツ
	if (angle >= 360) {
		return generateFullDonutPath(outerRadius, innerRadius);
	}

	// 360度未満の場合は扇形ドーナツ
	return generateDonutConePath(angle, outerRadius, innerRadius);
}

/**
 * 完全な円ドーナツのパスを生成（クリック検知用）
 * 外側時計回り、内側反時計回りで描画
 */
function generateFullDonutPath(
	outerRadius: number,
	innerRadius: number,
): ConePathResult {
	const path = [
		`M ${outerRadius} 0`,
		`A ${outerRadius} ${outerRadius} 0 1 1 ${-outerRadius} 0`,
		`A ${outerRadius} ${outerRadius} 0 1 1 ${outerRadius} 0`,
		`M ${innerRadius} 0`,
		`A ${innerRadius} ${innerRadius} 0 1 0 ${-innerRadius} 0`,
		`A ${innerRadius} ${innerRadius} 0 1 0 ${innerRadius} 0`,
		"Z",
	].join(" ");

	return { path, offsetX: 0, offsetY: 0 };
}

/**
 * 扇形ドーナツのパスを生成
 * 内径が0の場合は通常の扇形
 */
function generateDonutConePath(
	angle: number,
	outerRadius: number,
	innerRadius: number,
): ConePathResult {
	// バウンディングボックスの中心がオブジェクト座標に来るようにオフセット計算
	const bbox =
		innerRadius <= 0
			? getConeBoundingBox(angle, outerRadius)
			: getDonutConeBoundingBox(angle, outerRadius, innerRadius);
	const offsetX = -(bbox.minX + bbox.width / 2);
	const offsetY = -(bbox.minY + bbox.height / 2);

	// 起点: 12時方向（-90度）から時計回りに角度分
	const startRad = -Math.PI / 2;
	const endRad = startRad + (angle * Math.PI) / 180;

	// 外弧の開始点と終了点（オフセット適用）
	const outerX1 = offsetX + Math.cos(startRad) * outerRadius;
	const outerY1 = offsetY + Math.sin(startRad) * outerRadius;
	const outerX2 = offsetX + Math.cos(endRad) * outerRadius;
	const outerY2 = offsetY + Math.sin(endRad) * outerRadius;

	const largeArc = angle > 180 ? 1 : 0;

	// 内径が0の場合は扇形（内穴なし）
	if (innerRadius <= 0) {
		const path = [
			`M ${offsetX} ${offsetY}`, // 中心（オフセット適用）
			`L ${outerX1} ${outerY1}`, // 外弧開始点へ直線
			`A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerX2} ${outerY2}`, // 外弧（時計回り）
			"Z",
		].join(" ");

		return { path, offsetX, offsetY };
	}

	// 内弧の開始点と終了点（オフセット適用）
	const innerX1 = offsetX + Math.cos(startRad) * innerRadius;
	const innerY1 = offsetY + Math.sin(startRad) * innerRadius;
	const innerX2 = offsetX + Math.cos(endRad) * innerRadius;
	const innerY2 = offsetY + Math.sin(endRad) * innerRadius;

	// 扇形ドーナツ
	const path = [
		`M ${outerX1} ${outerY1}`, // 外弧開始点
		`A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerX2} ${outerY2}`, // 外弧（時計回り）
		`L ${innerX2} ${innerY2}`, // 内弧終了点へ直線
		`A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1}`, // 内弧（反時計回り）
		"Z",
	].join(" ");

	return { path, offsetX, offsetY };
}

/**
 * 円形マスク用のパスデータを生成（maskやclipPath用）
 * generateDonutPathと同じロジックだが、SVGマスク向けの形式
 */
export function generateDonutMaskPath(
	angle: number,
	outerRadius: number,
	innerRadius: number,
): ConePathResult {
	return generateDonutPath(angle, outerRadius, innerRadius);
}

/**
 * 扇形のアーク座標を計算（画像クリップ用）
 */
export interface ArcCoordinates {
	/** 開始点X */
	x1: number;
	/** 開始点Y */
	y1: number;
	/** 終了点X */
	x2: number;
	/** 終了点Y */
	y2: number;
	/** 大きい弧フラグ (0 or 1) */
	largeArc: number;
	/** オフセットX */
	offsetX: number;
	/** オフセットY */
	offsetY: number;
}

/**
 * 扇形のアーク座標を計算
 * 画像をクリップする際のclipPath生成に使用
 */
export function calculateConeArcCoordinates(
	angle: number,
	radius: number,
): ArcCoordinates {
	const bbox = getConeBoundingBox(angle, radius);
	const offsetX = -(bbox.minX + bbox.width / 2);
	const offsetY = -(bbox.minY + bbox.height / 2);

	const startRad = -Math.PI / 2;
	const endRad = startRad + (angle * Math.PI) / 180;

	return {
		x1: offsetX + Math.cos(startRad) * radius,
		y1: offsetY + Math.sin(startRad) * radius,
		x2: offsetX + Math.cos(endRad) * radius,
		y2: offsetY + Math.sin(endRad) * radius,
		largeArc: angle > 180 ? 1 : 0,
		offsetX,
		offsetY,
	};
}
