/**
 * ボード・オブジェクト生成ファクトリー
 */

import i18n from "@/lib/i18n";
import type { BoardData, BoardObject, Position } from "@/lib/stgy";
import {
	BackgroundId,
	DEFAULT_EDIT_PARAMS,
	EDIT_PARAMS,
	EditParamIds,
	OBJECT_EDIT_PARAMS,
	ObjectIds,
} from "@/lib/stgy";

/** デフォルトのキャンバスサイズ (描画用、バイナリフォーマットには含まれない) */
export const DEFAULT_CANVAS_WIDTH = 512;
export const DEFAULT_CANVAS_HEIGHT = 384;

/**
 * 空のボードを生成
 */
export function createEmptyBoard(name = ""): BoardData {
	return {
		version: 2,
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
		obj.text = i18n.t("common.defaultText");
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
 * @deprecated stgyバイナリフォーマットにはボードサイズは含まれないため、この関数は不要になりました。
 * キャンバスサイズはDEFAULT_CANVAS_WIDTH/DEFAULT_CANVAS_HEIGHTを使用してください。
 */
export function calculateTextBoardSize(_textLength: number): {
	width: number;
	height: number;
} {
	return { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT };
}

/**
 * @deprecated stgyバイナリフォーマットにはボードサイズは含まれないため、この関数は不要になりました。
 * キャンバスサイズはDEFAULT_CANVAS_WIDTH/DEFAULT_CANVAS_HEIGHTを使用してください。
 */
export function recalculateBoardSize(_board: BoardData): {
	width: number;
	height: number;
} {
	return { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT };
}
