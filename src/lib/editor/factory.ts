/**
 * Board/object generation factory
 */

import i18n from "@/lib/i18n";
import type { BoardData, BoardObject, Position } from "@/lib/stgy";
import {
	BackgroundId,
	DEFAULT_EDIT_PARAMS,
	EDIT_PARAMS,
	EditParamIds,
	generateObjectId,
	OBJECT_EDIT_PARAMS,
	ObjectIds,
} from "@/lib/stgy";

/** Default canvas size (for rendering, not included in binary format) */
export const DEFAULT_CANVAS_WIDTH = 512;
export const DEFAULT_CANVAS_HEIGHT = 384;

/**
 * Create an empty board
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
 * Get default size for an object from EDIT_PARAMS
 */
function getDefaultSize(objectId: number): number {
	const editParams = OBJECT_EDIT_PARAMS[objectId] ?? DEFAULT_EDIT_PARAMS;
	// Objects using SizeSmall get that default, others get Size default
	const sizeParamId = editParams.includes(EditParamIds.SizeSmall)
		? EditParamIds.SizeSmall
		: EditParamIds.Size;
	return EDIT_PARAMS[sizeParamId].defaultValue;
}

/**
 * Create a default object
 * @param objectId Object ID
 * @param position Initial position (canvas center if omitted)
 */
export function createDefaultObject(
	objectId: number,
	position?: Position,
): BoardObject {
	const targetPosition: Position = position ?? { x: 256, y: 192 };

	// Line draws 256px right from start point, so offset start 128px left to center at target position
	const defaultPosition: Position =
		objectId === ObjectIds.Line
			? { x: targetPosition.x - 128, y: targetPosition.y }
			: targetPosition;

	// Line and Text default to white, others to orange
	const isWhiteDefault =
		objectId === ObjectIds.Line || objectId === ObjectIds.Text;
	const defaultColor = isWhiteDefault
		? { r: 255, g: 255, b: 255, opacity: 0 }
		: { r: 255, g: 128, b: 0, opacity: 0 };

	const obj: BoardObject = {
		id: generateObjectId(),
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
		color: defaultColor,
	};

	// Object-specific default parameters (auto-retrieved from EDIT_PARAMS)
	const editParams = OBJECT_EDIT_PARAMS[objectId] ?? DEFAULT_EDIT_PARAMS;
	for (const paramId of editParams) {
		const paramDef = EDIT_PARAMS[paramId];
		if (!paramDef) continue;

		switch (paramId) {
			case EditParamIds.ConeAngle:
				// DonutAoE starts at 360 degrees (full circle)
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
			case EditParamIds.LineWidth:
				obj.param3 = paramDef.defaultValue;
				break;
		}
	}

	// Set Line object end point coordinates (param1=endX*10, param2=endY*10)
	if (objectId === ObjectIds.Line) {
		const endX = defaultPosition.x + 256;
		const endY = defaultPosition.y;
		obj.param1 = Math.round(endX * 10);
		obj.param2 = Math.round(endY * 10);
	}

	// Special handling for text objects
	if (objectId === ObjectIds.Text) {
		obj.text = i18n.t("common.defaultText");
	}

	return obj;
}

/**
 * Duplicate an object
 * @param object Source object
 * @param offset Position offset (shifts 10px down-right if omitted)
 */
export function duplicateObject(
	object: BoardObject,
	offset: Position = { x: 10, y: 10 },
): BoardObject {
	return {
		...object,
		id: generateObjectId(),
		position: {
			x: object.position.x + offset.x,
			y: object.position.y + offset.y,
		},
		flags: { ...object.flags },
		color: { ...object.color },
	};
}

/**
 * @deprecated Board size is not included in stgy binary format.
 * Use DEFAULT_CANVAS_WIDTH/DEFAULT_CANVAS_HEIGHT for canvas size.
 */
export function calculateTextBoardSize(_textLength: number): {
	width: number;
	height: number;
} {
	return { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT };
}

/**
 * @deprecated Board size is not included in stgy binary format.
 * Use DEFAULT_CANVAS_WIDTH/DEFAULT_CANVAS_HEIGHT for canvas size.
 */
export function recalculateBoardSize(_board: BoardData): {
	width: number;
	height: number;
} {
	return { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT };
}
