/**
 * ボード関連の共通モジュール
 */

export {
	CANVAS_WIDTH,
	CANVAS_HEIGHT,
	OBJECT_BBOX_SIZES,
	DEFAULT_BBOX_SIZE,
} from "./constants";

export {
	getConeBoundingBox,
	getDonutConeBoundingBox,
	type BoundingBoxResult,
} from "./geometry";

export { BackgroundRenderer } from "./BackgroundRenderer";

