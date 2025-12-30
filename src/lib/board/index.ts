/**
 * ボード関連の共通モジュール
 * サーバーサイド・クライアントサイド両方で使用
 */

// コンポーネント
export { BackgroundRenderer } from "./BackgroundRenderer";
// 色関連ユーティリティ
export {
	colorToRgb,
	colorToRgba,
	DEFAULT_OBJECT_COLOR,
	isColorChanged,
} from "./color";
// 定数
export {
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	DEFAULT_BBOX_SIZE,
	OBJECT_BBOX_SIZES,
} from "./constants";
// ジオメトリ計算
export {
	type BoundingBoxResult,
	getConeBoundingBox,
	getDonutConeBoundingBox,
} from "./geometry";
// パラメータ関連
export {
	calculateDonutInnerRadius,
	calculateLineEndpoint,
	DEFAULT_PARAMS,
	isLineAoEParamsChanged,
} from "./params";
// SVGパス生成
export {
	type ArcCoordinates,
	type ConePathResult,
	calculateConeArcCoordinates,
	generateConePath,
	generateDonutMaskPath,
	generateDonutPath,
} from "./svg-paths";
// Transform構築
export { buildFullTransform, buildTransform } from "./transform";
