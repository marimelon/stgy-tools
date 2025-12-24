/**
 * ボード関連の共通モジュール
 */

export { BackgroundRenderer } from "./BackgroundRenderer";
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
