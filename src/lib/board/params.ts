/**
 * パラメータ関連ユーティリティ
 * サーバーサイド・クライアントサイド両方で使用
 */

import type { Position } from "@/lib/stgy/types";
import { ObjectIds } from "@/lib/stgy/types";

/**
 * デフォルトのパラメータ値
 */
export const DEFAULT_PARAMS = {
	/** 直線範囲攻撃の縦幅（長さ）デフォルト */
	LINE_HEIGHT: 128,
	/** 直線範囲攻撃の横幅（太さ）デフォルト */
	LINE_WIDTH: 128,
	/** Line（絶対座標線）のデフォルト太さ */
	LINE_THICKNESS: 6,
	/** DonutAoE/ConeAoE のデフォルト角度 */
	CONE_ANGLE: 90,
	/** DonutAoE のデフォルト内径範囲 (0-240) */
	DONUT_RANGE: 50,
	/** DonutAoE の完全円判定角度 */
	FULL_CIRCLE_ANGLE: 360,
} as const;

/**
 * 直線範囲攻撃のパラメータがデフォルトから変更されているかチェック
 * 縦幅・横幅パラメータを持つのはLineAoEのみ（Lineは異なるパラメータ構成）
 */
export function isLineAoEParamsChanged(
	objectId: number,
	param1?: number,
	param2?: number,
): boolean {
	// LineAoEのみが縦幅・横幅パラメータを持つ
	if (objectId !== ObjectIds.LineAoE) {
		return false;
	}
	const height = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
	const width = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
	return (
		height !== DEFAULT_PARAMS.LINE_HEIGHT || width !== DEFAULT_PARAMS.LINE_WIDTH
	);
}

/**
 * Line（絶対座標線）の終点を計算
 * param1, param2 は座標を10倍した整数値（小数第一位まで対応）
 */
export function calculateLineEndpoint(
	position: Position,
	param1?: number,
	param2?: number,
): Position {
	return {
		x: (param1 ?? position.x * 10 + 2560) / 10,
		y: (param2 ?? position.y * 10) / 10,
	};
}

/**
 * DonutAoEの内径を計算
 * @param outerRadius 外径
 * @param donutRange 内径範囲 (0-240)
 * @param minThicknessRatio 最小太さ比率（デフォルト: 1/10）
 */
export function calculateDonutInnerRadius(
	outerRadius: number,
	donutRange: number,
	minThicknessRatio = 1 / 10,
): number {
	const minThickness = outerRadius * minThicknessRatio;
	const maxInnerRadius = outerRadius - minThickness;
	return maxInnerRadius * (donutRange / 240);
}
