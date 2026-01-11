/**
 * Board-related shared module
 * Used on both server-side and client-side
 */

export { BackgroundRenderer } from "./BackgroundRenderer";
export {
	colorToRgb,
	colorToRgba,
	DEFAULT_OBJECT_COLOR,
	isColorChanged,
} from "./color";
export {
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	DEFAULT_BBOX_SIZE,
	OBJECT_BBOX_SIZES,
} from "./constants";
export {
	type BoundingBoxResult,
	getConeBoundingBox,
	getDonutConeBoundingBox,
} from "./geometry";
export {
	calculateDonutInnerRadius,
	calculateLineEndpoint,
	DEFAULT_PARAMS,
	isLineAoEParamsChanged,
} from "./params";
export {
	type ArcCoordinates,
	type ConePathResult,
	calculateConeArcCoordinates,
	generateConePath,
	generateDonutMaskPath,
	generateDonutPath,
} from "./svg-paths";
export { buildFullTransform, buildTransform } from "./transform";
