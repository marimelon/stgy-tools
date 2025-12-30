/**
 * 色関連ユーティリティ
 * サーバーサイド・クライアントサイド両方で使用
 */

import type { Color } from "@/lib/stgy/types";

/**
 * デフォルトの色（この色の場合はオリジナル画像を使用）
 */
export const DEFAULT_OBJECT_COLOR: Readonly<Color> = {
	r: 255,
	g: 100,
	b: 0,
	opacity: 0,
};

/**
 * 色がデフォルトから変更されているかチェック
 */
export function isColorChanged(color: Color): boolean {
	return (
		color.r !== DEFAULT_OBJECT_COLOR.r ||
		color.g !== DEFAULT_OBJECT_COLOR.g ||
		color.b !== DEFAULT_OBJECT_COLOR.b ||
		color.opacity !== DEFAULT_OBJECT_COLOR.opacity
	);
}

/**
 * Color型をrgba文字列に変換
 * opacity: 0=不透明, 100=透明
 */
export function colorToRgba(color: Color): string {
	const alpha = 1 - color.opacity / 100;
	return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

/**
 * Color型をrgb文字列に変換（透過なし）
 */
export function colorToRgb(color: Color): string {
	return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
