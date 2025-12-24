/**
 * オブジェクトのヒットテスト関数
 *
 * バウンディングボックスと回転を考慮した正確な当たり判定を提供
 */

import { getObjectBoundingBox } from "@/components/board";
import type { BoardObject, Position } from "@/lib/stgy";

/**
 * 指定位置がオブジェクトのバウンディングボックス内にあるかを判定
 * 回転を考慮した正確なヒットテスト
 *
 * @param point - 判定するポイント（SVG座標）
 * @param object - 判定対象のオブジェクト
 * @returns ポイントがオブジェクト内にある場合true
 */
export function isPointInObject(point: Position, object: BoardObject): boolean {
	if (!object.flags.visible) return false;

	const bbox = getObjectBoundingBox(
		object.objectId,
		object.param1,
		object.param2,
		object.param3,
		object.text,
		object.position,
	);
	const scale = object.size / 100;
	const halfWidth = (bbox.width * scale) / 2;
	const halfHeight = (bbox.height * scale) / 2;
	const offsetX = (bbox.offsetX ?? 0) * scale;
	const offsetY = (bbox.offsetY ?? 0) * scale;

	// ポイントをオブジェクトの中心からの相対座標に変換
	const dx = point.x - object.position.x;
	const dy = point.y - object.position.y;

	// オブジェクトの回転の逆回転を適用してローカル座標に変換
	const rad = (-object.rotation * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const localX = dx * cos - dy * sin;
	const localY = dx * sin + dy * cos;

	// オフセットを考慮してバウンディングボックス内かチェック
	const left = offsetX - halfWidth;
	const right = offsetX + halfWidth;
	const top = offsetY - halfHeight;
	const bottom = offsetY + halfHeight;

	return localX >= left && localX <= right && localY >= top && localY <= bottom;
}
