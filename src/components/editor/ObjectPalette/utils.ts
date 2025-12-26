/**
 * オブジェクトパレットのユーティリティ関数
 */

import { DEFAULT_BBOX_SIZE, OBJECT_BBOX_SIZES } from "@/lib/board";

/**
 * オブジェクトのviewBoxサイズを取得（実サイズ + 余白）
 */
export function getViewBoxSize(objectId: number): number {
	const size = OBJECT_BBOX_SIZES[objectId] ?? DEFAULT_BBOX_SIZE;
	const maxDimension = Math.max(size.width, size.height);
	// 余白を追加してオブジェクトが見切れないようにする
	return Math.ceil(maxDimension * 1.1);
}
