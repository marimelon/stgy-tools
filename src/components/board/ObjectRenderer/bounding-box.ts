import {
	calculateLineEndpoint,
	DEFAULT_BBOX_SIZE,
	DEFAULT_PARAMS,
	getConeBoundingBox,
	getDonutConeBoundingBox,
	OBJECT_BBOX_SIZES,
} from "@/lib/board";
import { ObjectIds } from "@/lib/stgy";
import type { Position } from "@/lib/stgy/types";
import { CONE_RADIUS, calculateTextWidth, TEXT } from "./constants";

export { getConeBoundingBox, getDonutConeBoundingBox };

/** Get bounding box size and offset for an object */
export function getObjectBoundingBox(
	objectId: number,
	param1?: number,
	param2?: number,
	param3?: number,
	text?: string,
	position?: Position,
): { width: number; height: number; offsetX?: number; offsetY?: number } {
	if (objectId === ObjectIds.ConeAoE) {
		const angle = param1 ?? 90;
		const cone = getConeBoundingBox(angle, CONE_RADIUS);
		return {
			width: cone.width,
			height: cone.height,
			offsetX: 0,
			offsetY: 0,
		};
	}

	if (objectId === ObjectIds.DonutAoE) {
		const angle = param1 ?? 360;
		const donutRange = param2 ?? 50;
		const outerRadius = 256; // 512 / 2
		const innerRadius = outerRadius * (donutRange / 240);

		// Full circle for 360 degrees or more
		if (angle >= 360) {
			return {
				width: outerRadius * 2,
				height: outerRadius * 2,
				offsetX: 0,
				offsetY: 0,
			};
		}

		if (innerRadius <= 0) {
			const cone = getConeBoundingBox(angle, outerRadius);
			return {
				width: cone.width,
				height: cone.height,
				offsetX: 0,
				offsetY: 0,
			};
		}

		const donut = getDonutConeBoundingBox(angle, outerRadius, innerRadius);
		return {
			width: donut.width,
			height: donut.height,
			offsetX: 0,
			offsetY: 0,
		};
	}

	if (objectId === ObjectIds.Text) {
		const width = text
			? Math.max(calculateTextWidth(text), TEXT.MIN_BBOX_WIDTH)
			: TEXT.MIN_BBOX_WIDTH;
		return { width, height: TEXT.DEFAULT_HEIGHT };
	}

	if (objectId === ObjectIds.Line && position) {
		const endpoint = calculateLineEndpoint(position, param1, param2);
		const lineThickness = param3 ?? DEFAULT_PARAMS.LINE_THICKNESS;
		const dx = endpoint.x - position.x;
		const dy = endpoint.y - position.y;
		const lineLength = Math.sqrt(dx * dx + dy * dy);
		return {
			width: Math.max(lineLength, lineThickness),
			height: lineThickness,
			offsetX: lineLength / 2,
			offsetY: 0,
		};
	}

	if (objectId === ObjectIds.LineAoE) {
		const length = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
		const thickness = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
		return {
			width: length,
			height: thickness,
			offsetX: 0,
			offsetY: 0,
		};
	}

	const size = OBJECT_BBOX_SIZES[objectId];
	if (size) {
		return size;
	}

	return DEFAULT_BBOX_SIZE;
}
