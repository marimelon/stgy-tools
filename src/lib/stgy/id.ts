/**
 * オブジェクトID生成ユーティリティ
 * ランタイムでのみ使用され、保存時には破棄される
 *
 * ID生成戦略:
 * - 新規作成: nanoid() を使用（非決定論的、21文字）
 * - stgyコードからの読み込み: シンプルな連番（obj-0, obj-1, ...）
 *   （同じstgyCode → 同じID、デバッグ容易、yjs統合に有効）
 */

import { nanoid } from "nanoid";
import type { BoardData, BoardObject, ParsedBoardData } from "./types";

/**
 * ランタイムID生成（新規作成用、非決定論的）
 */
export function generateObjectId(): string {
	return nanoid();
}

/**
 * 決定論的ID生成（stgyコードからの読み込み用）
 * シンプルな連番形式（obj-0, obj-1, ...）
 * @param index オブジェクトのインデックス
 * @returns 決定論的なID
 */
export function generateDeterministicObjectId(index: number): string {
	return `obj-${index}`;
}

/**
 * IDなしのオブジェクトにIDを付与する（非決定論的）
 */
export function assignObjectId<T extends Omit<BoardObject, "id">>(
	obj: T,
): T & { id: string } {
	return {
		...obj,
		id: generateObjectId(),
	};
}

/**
 * オブジェクト配列にIDを付与する（非決定論的）
 */
export function assignObjectIds<T extends Omit<BoardObject, "id">>(
	objects: T[],
): (T & { id: string })[] {
	return objects.map(assignObjectId);
}

/**
 * オブジェクト配列に決定論的IDを付与する
 * @param objects ID なしオブジェクト配列
 */
export function assignDeterministicObjectIds<T extends Omit<BoardObject, "id">>(
	objects: T[],
): (T & { id: string })[] {
	return objects.map((obj, index) => ({
		...obj,
		id: generateDeterministicObjectId(index),
	}));
}

/**
 * ParsedBoardDataをBoardDataに変換（IDを付与、非決定論的）
 */
export function assignBoardObjectIds(parsed: ParsedBoardData): BoardData {
	return {
		...parsed,
		objects: assignObjectIds(parsed.objects),
	};
}

/**
 * ParsedBoardDataをBoardDataに変換（決定論的IDを付与）
 * @param parsed パース済みボードデータ
 */
export function assignBoardObjectIdsDeterministic(
	parsed: ParsedBoardData,
): BoardData {
	return {
		...parsed,
		objects: assignDeterministicObjectIds(parsed.objects),
	};
}
