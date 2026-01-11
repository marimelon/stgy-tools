/**
 * Parameter-related utilities
 * Used on both server-side and client-side
 */

import type { Position } from "@/lib/stgy/types";
import { ObjectIds } from "@/lib/stgy/types";

/**
 * Default parameter values
 */
export const DEFAULT_PARAMS = {
	/** LineAoE default height (length) */
	LINE_HEIGHT: 128,
	/** LineAoE default width (thickness) */
	LINE_WIDTH: 128,
	/** Line (absolute coordinate line) default thickness */
	LINE_THICKNESS: 6,
	/** DonutAoE/ConeAoE default angle */
	CONE_ANGLE: 90,
	/** DonutAoE default inner radius range (0-240) */
	DONUT_RANGE: 50,
	/** DonutAoE full circle threshold angle */
	FULL_CIRCLE_ANGLE: 360,
} as const;

/**
 * Check if LineAoE parameters differ from defaults
 * Only LineAoE has height/width parameters (Line has different parameter structure)
 */
export function isLineAoEParamsChanged(
	objectId: number,
	param1?: number,
	param2?: number,
): boolean {
	if (objectId !== ObjectIds.LineAoE) {
		return false;
	}
	const height = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
	const width = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
	return (
		height !== DEFAULT_PARAMS.LINE_HEIGHT || width !== DEFAULT_PARAMS.LINE_WIDTH
	);
}

/**
 * Calculate Line (absolute coordinate line) endpoint
 * param1, param2 are coordinates multiplied by 10 (supports one decimal place)
 */
export function calculateLineEndpoint(
	position: Position,
	param1?: number,
	param2?: number,
): Position {
	return {
		x: (param1 ?? position.x * 10 + 2560) / 10,
		y: (param2 ?? position.y * 10) / 10,
	};
}

/**
 * Calculate DonutAoE inner radius
 * @param outerRadius Outer radius
 * @param donutRange Inner radius range (0-240)
 * @param minThicknessRatio Minimum thickness ratio (default: 1/10)
 */
export function calculateDonutInnerRadius(
	outerRadius: number,
	donutRange: number,
	minThicknessRatio = 1 / 10,
): number {
	const minThickness = outerRadius * minThicknessRatio;
	const maxInnerRadius = outerRadius - minThickness;
	return maxInnerRadius * (donutRange / 240);
}
