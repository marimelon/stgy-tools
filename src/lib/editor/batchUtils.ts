/**
 * バッチ編集ユーティリティ関数
 *
 * 複数オブジェクト選択時の共通値計算とMixed値判定
 */

import type { BoardObject } from "@/lib/stgy";

// ============================================
// Mixed値のシンボルと型
// ============================================

/**
 * Mixed値を表すシンボル
 * 複数オブジェクトで値が異なる場合に使用
 */
export const MIXED_VALUE = Symbol("mixed");
export type MixedValue = typeof MIXED_VALUE;

/**
 * Mixed値かどうかを判定
 */
export function isMixed<T>(value: T | MixedValue): value is MixedValue {
	return value === MIXED_VALUE;
}

// ============================================
// バッチプロパティ値の型
// ============================================

/**
 * バッチプロパティ値
 * 各プロパティは共通値またはMixed
 */
export interface BatchPropertyValues {
	rotation: number | MixedValue;
	size: number | MixedValue;
	color: {
		r: number | MixedValue;
		g: number | MixedValue;
		b: number | MixedValue;
		opacity: number | MixedValue;
	};
	flags: {
		visible: boolean | MixedValue;
		flipHorizontal: boolean | MixedValue;
		flipVertical: boolean | MixedValue;
		locked: boolean | MixedValue;
	};
	param1: number | undefined | MixedValue;
	param2: number | undefined | MixedValue;
	param3: number | undefined | MixedValue;
}

// ============================================
// ユーティリティ関数
// ============================================

/**
 * オブジェクト配列から共通値を計算
 * 全オブジェクトで同じ値ならその値を返し、異なる場合はMIXED_VALUEを返す
 */
function computeCommonValue<T>(
	objects: BoardObject[],
	getter: (obj: BoardObject) => T,
): T | MixedValue {
	if (objects.length === 0) return MIXED_VALUE;
	const first = getter(objects[0]);
	for (let i = 1; i < objects.length; i++) {
		if (getter(objects[i]) !== first) {
			return MIXED_VALUE;
		}
	}
	return first;
}

/**
 * 選択オブジェクトからバッチプロパティ値を計算
 */
export function computeBatchPropertyValues(
	objects: BoardObject[],
): BatchPropertyValues {
	return {
		rotation: computeCommonValue(objects, (o) => o.rotation),
		size: computeCommonValue(objects, (o) => o.size),
		color: {
			r: computeCommonValue(objects, (o) => o.color.r),
			g: computeCommonValue(objects, (o) => o.color.g),
			b: computeCommonValue(objects, (o) => o.color.b),
			opacity: computeCommonValue(objects, (o) => o.color.opacity),
		},
		flags: {
			visible: computeCommonValue(objects, (o) => o.flags.visible),
			flipHorizontal: computeCommonValue(
				objects,
				(o) => o.flags.flipHorizontal,
			),
			flipVertical: computeCommonValue(objects, (o) => o.flags.flipVertical),
			locked: computeCommonValue(objects, (o) => o.flags.locked),
		},
		param1: computeCommonValue(objects, (o) => o.param1),
		param2: computeCommonValue(objects, (o) => o.param2),
		param3: computeCommonValue(objects, (o) => o.param3),
	};
}

/**
 * 全オブジェクトが同じobjectIdを持つかどうかを判定
 */
export function haveSameObjectId(objects: BoardObject[]): boolean {
	if (objects.length === 0) return false;
	const firstId = objects[0].objectId;
	return objects.every((o) => o.objectId === firstId);
}

/**
 * 共通のフリップフラグを取得（全オブジェクトで共通してサポートされているもの）
 */
export function getCommonFlipFlags(
	objects: BoardObject[],
	flipFlagsMap: Record<number, { horizontal: boolean; vertical: boolean }>,
	defaultFlags: { horizontal: boolean; vertical: boolean },
): { horizontal: boolean; vertical: boolean } {
	if (objects.length === 0) return { horizontal: false, vertical: false };

	// 全オブジェクトでサポートされているフラグのみを返す
	let horizontal = true;
	let vertical = true;

	for (const obj of objects) {
		const flags = flipFlagsMap[obj.objectId] ?? defaultFlags;
		if (!flags.horizontal) horizontal = false;
		if (!flags.vertical) vertical = false;
	}

	return { horizontal, vertical };
}
