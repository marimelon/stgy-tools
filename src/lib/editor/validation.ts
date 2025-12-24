/**
 * オブジェクト配置数制限のバリデーション
 */

import {
	type BoardData,
	type BoardObject,
	MAX_TOTAL_OBJECTS,
	OBJECT_LIMITS,
	ObjectNames,
} from "@/lib/stgy";
import { getDebugMode } from "./useDebugMode";

export interface ValidationResult {
	canAdd: boolean;
	errorKey?: string;
	errorParams?: Record<string, string | number>;
}

/**
 * 単一オブジェクト追加可能かチェック
 */
export function canAddObject(
	board: BoardData,
	objectId: number,
): ValidationResult {
	// デバッグモード時は制限なし
	if (getDebugMode()) {
		return { canAdd: true };
	}

	// 合計数チェック
	if (board.objects.length >= MAX_TOTAL_OBJECTS) {
		return {
			canAdd: false,
			errorKey: "editor.errors.maxTotalObjects",
			errorParams: { max: MAX_TOTAL_OBJECTS },
		};
	}

	// 個別制限チェック
	const limit = OBJECT_LIMITS[objectId];
	if (limit !== undefined) {
		const count = board.objects.filter((o) => o.objectId === objectId).length;
		if (count >= limit) {
			return {
				canAdd: false,
				errorKey: "editor.errors.maxObjectType",
				errorParams: {
					name: ObjectNames[objectId] ?? `ID:${objectId}`,
					max: limit,
				},
			};
		}
	}

	return { canAdd: true };
}

/**
 * 複数オブジェクト追加可能かチェック
 */
export function canAddObjects(
	board: BoardData,
	objects: BoardObject[],
): ValidationResult {
	if (objects.length === 0) {
		return { canAdd: true };
	}

	// デバッグモード時は制限なし
	if (getDebugMode()) {
		return { canAdd: true };
	}

	// 合計数チェック
	const newTotal = board.objects.length + objects.length;
	if (newTotal > MAX_TOTAL_OBJECTS) {
		return {
			canAdd: false,
			errorKey: "editor.errors.maxTotalObjectsExceeded",
			errorParams: {
				max: MAX_TOTAL_OBJECTS,
				current: board.objects.length,
				adding: objects.length,
			},
		};
	}

	// オブジェクト種別ごとにカウント
	const currentCountMap = new Map<number, number>();
	for (const obj of board.objects) {
		currentCountMap.set(
			obj.objectId,
			(currentCountMap.get(obj.objectId) ?? 0) + 1,
		);
	}

	// 追加するオブジェクトのカウント
	const addingCountMap = new Map<number, number>();
	for (const obj of objects) {
		addingCountMap.set(
			obj.objectId,
			(addingCountMap.get(obj.objectId) ?? 0) + 1,
		);
	}

	// 個別制限チェック
	for (const [objectId, addingCount] of addingCountMap) {
		const limit = OBJECT_LIMITS[objectId];
		if (limit !== undefined) {
			const currentCount = currentCountMap.get(objectId) ?? 0;
			if (currentCount + addingCount > limit) {
				return {
					canAdd: false,
					errorKey: "editor.errors.maxObjectType",
					errorParams: {
						name: ObjectNames[objectId] ?? `ID:${objectId}`,
						max: limit,
					},
				};
			}
		}
	}

	return { canAdd: true };
}
