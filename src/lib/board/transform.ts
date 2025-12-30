/**
 * SVG transform 構築ユーティリティ
 * サーバーサイド・クライアントサイド両方で使用
 */

/**
 * SVG transform属性を構築
 */
export function buildTransform(
	x: number,
	y: number,
	rotation: number,
	scale: number,
	flipH: boolean,
	flipV: boolean,
): string {
	const parts = [`translate(${x}, ${y})`];
	if (rotation !== 0) {
		parts.push(`rotate(${rotation})`);
	}
	const scaleX = flipH ? -scale : scale;
	const scaleY = flipV ? -scale : scale;
	if (scaleX !== 1 || scaleY !== 1) {
		parts.push(`scale(${scaleX}, ${scaleY})`);
	}
	return parts.join(" ");
}

/**
 * 位置、回転、スケール、フリップからtransform文字列を構築（シンプル版）
 * 回転とスケールが1の場合も含む完全な変換を返す
 */
export function buildFullTransform(
	x: number,
	y: number,
	rotation: number,
	scale: number,
	flipH: boolean,
	flipV: boolean,
): string {
	const scaleX = flipH ? -scale : scale;
	const scaleY = flipV ? -scale : scale;
	return `translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`;
}
