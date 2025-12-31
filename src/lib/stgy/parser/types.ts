/**
 * パース中間状態の型定義
 */

import type { BackgroundId, Color, ObjectFlags, Position } from "../types";

/**
 * パース中間状態
 */
export interface ParseContext {
	boardName: string;
	backgroundId: BackgroundId;
	objectIds: number[];
	texts: string[];
	flagsArray: ObjectFlags[];
	positions: Position[];
	rotations: number[];
	sizes: number[];
	colors: Color[];
	param1s: number[];
	param2s: number[];
	param3s: number[];
	sizePaddingByte: number | undefined;
	/** セクションコンテンツ先頭の空フィールド数 (ラウンドトリップ用) */
	emptyFieldCount: number;
}

/**
 * 初期状態のParseContextを生成
 */
export function createParseContext(): ParseContext {
	return {
		boardName: "",
		backgroundId: 1 as BackgroundId,
		objectIds: [],
		texts: [],
		flagsArray: [],
		positions: [],
		rotations: [],
		sizes: [],
		colors: [],
		param1s: [],
		param2s: [],
		param3s: [],
		sizePaddingByte: undefined,
		emptyFieldCount: 0,
	};
}
