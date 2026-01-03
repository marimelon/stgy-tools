/**
 * オブジェクトID生成ユーティリティ
 * ランタイムでのみ使用され、保存時には破棄される
 */

import type { BoardData, BoardObject, ParsedBoardData } from "./types";

/**
 * ランタイムID生成
 */
export function generateObjectId(): string {
	return crypto.randomUUID();
}

/**
 * IDなしのオブジェクトにIDを付与する
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
 * オブジェクト配列にIDを付与する
 */
export function assignObjectIds<T extends Omit<BoardObject, "id">>(
	objects: T[],
): (T & { id: string })[] {
	return objects.map(assignObjectId);
}

/**
 * ParsedBoardDataをBoardDataに変換（IDを付与）
 */
export function assignBoardObjectIds(parsed: ParsedBoardData): BoardData {
	return {
		...parsed,
		objects: assignObjectIds(parsed.objects),
	};
}
