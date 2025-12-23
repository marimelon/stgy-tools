/**
 * ボード・オブジェクト生成ファクトリー
 */

import type { BoardData, BoardObject, Position } from "@/lib/stgy";
import {
	BackgroundId,
	ObjectIds,
	OBJECT_EDIT_PARAMS,
	DEFAULT_EDIT_PARAMS,
	EDIT_PARAMS,
	EditParamIds,
} from "@/lib/stgy";

/**
 * 空のボードを生成
 */
export function createEmptyBoard(name = ""): BoardData {
	return {
		version: 2,
		width: 512,
		height: 384,
		name,
		backgroundId: BackgroundId.None,
		objects: [],
	};
}

/**
 * EDIT_PARAMSからオブジェクトのデフォルトサイズを取得
 */
function getDefaultSize(objectId: number): number {
	const editParams = OBJECT_EDIT_PARAMS[objectId] ?? DEFAULT_EDIT_PARAMS;
	// SizeSmallを使うオブジェクトはそのデフォルト値、それ以外はSizeのデフォルト値
	const sizeParamId = editParams.includes(EditParamIds.SizeSmall)
		? EditParamIds.SizeSmall
		: EditParamIds.Size;
	return EDIT_PARAMS[sizeParamId].defaultValue;
}

/**
 * デフォルトのオブジェクトを生成
 * @param objectId オブジェクトID
 * @param position 初期位置 (省略時はキャンバス中央)
 */
export function createDefaultObject(
	objectId: number,
	position?: Position,
): BoardObject {
	const defaultPosition: Position = position ?? { x: 256, y: 192 };

	const obj: BoardObject = {
		objectId,
		flags: {
			visible: true,
			flipHorizontal: false,
			flipVertical: false,
			locked: false,
		},
		position: defaultPosition,
		rotation: 0,
		size: getDefaultSize(objectId),
		color: { r: 255, g: 100, b: 0, opacity: 0 },
	};

	// オブジェクト固有のデフォルトパラメータ（EDIT_PARAMSから自動取得）
	const editParams = OBJECT_EDIT_PARAMS[objectId] ?? DEFAULT_EDIT_PARAMS;
	for (const paramId of editParams) {
		const paramDef = EDIT_PARAMS[paramId];
		if (!paramDef) continue;

		switch (paramId) {
			case EditParamIds.ConeAngle:
				// DonutAoEの場合は初期値360度（完全な円）
				obj.param1 =
					objectId === ObjectIds.DonutAoE ? 360 : paramDef.defaultValue;
				break;
			case EditParamIds.DonutRange:
			case EditParamIds.Width:
				obj.param2 = paramDef.defaultValue;
				break;
			case EditParamIds.Height:
				obj.param1 = paramDef.defaultValue;
				break;
		}
	}

	// テキストオブジェクトの特殊処理
	if (objectId === ObjectIds.Text) {
		obj.text = "";
	}

	return obj;
}

/**
 * オブジェクトを複製
 * @param object 複製元オブジェクト
 * @param offset 位置オフセット (省略時は10px右下にずらす)
 */
export function duplicateObject(
	object: BoardObject,
	offset: Position = { x: 10, y: 10 },
): BoardObject {
	return {
		...object,
		position: {
			x: object.position.x + offset.x,
			y: object.position.y + offset.y,
		},
		flags: { ...object.flags },
		color: { ...object.color },
	};
}

/**
 * テキストオブジェクトのテキスト長からボードサイズを計算
 * オリジナルアプリの計算式: width = 104 + textLength * 4, height = 92 + textLength * 4
 * @param textLength テキストの文字数
 */
export function calculateTextBoardSize(textLength: number): {
	width: number;
	height: number;
} {
	// 4バイト境界に合わせる
	const width = 104 + textLength * 4;
	const height = 92 + textLength * 4;
	return { width, height };
}

/**
 * ボードのサイズをコンテンツに基づいて再計算
 * テキストオブジェクトのみのボードはテキスト長からサイズを計算
 * それ以外は全オブジェクトのバウンディングボックスから計算
 * @param board ボードデータ
 */
export function recalculateBoardSize(board: BoardData): {
	width: number;
	height: number;
} {
	const objects = board.objects.filter((o) => o.flags.visible);

	if (objects.length === 0) {
		return { width: board.width, height: board.height };
	}

	// テキストオブジェクトのみの場合、テキスト長から計算
	const textObjects = objects.filter((o) => o.objectId === ObjectIds.Text);
	if (textObjects.length === objects.length && textObjects.length === 1) {
		const textLength = textObjects[0].text?.length ?? 0;
		return calculateTextBoardSize(textLength);
	}

	// 複数オブジェクトや非テキストオブジェクトの場合は現在のサイズを維持
	// TODO: バウンディングボックス計算を実装
	return { width: board.width, height: board.height };
}
