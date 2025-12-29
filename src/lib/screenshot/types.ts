/**
 * スクリーンショット比較機能の型定義
 */

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/board/constants";

/** ターゲットのボードサイズ */
export const TARGET_BOARD_WIDTH = CANVAS_WIDTH; // 512
export const TARGET_BOARD_HEIGHT = CANVAS_HEIGHT; // 384
export const TARGET_ASPECT_RATIO = TARGET_BOARD_WIDTH / TARGET_BOARD_HEIGHT; // ~1.333

/** 検出方法 */
export type DetectionMethod = "color" | "edge" | "manual";

/** 検出されたボード領域 */
export interface DetectedRegion {
	/** 元画像内のX座標 */
	x: number;
	/** 元画像内のY座標 */
	y: number;
	/** 検出された幅 */
	width: number;
	/** 検出された高さ */
	height: number;
	/** 検出の信頼度 (0-1) */
	confidence: number;
	/** 検出方法 */
	method: DetectionMethod;
}

/** 手動調整パラメータ */
export interface ManualAdjustment {
	/** X方向オフセット */
	offsetX: number;
	/** Y方向オフセット */
	offsetY: number;
	/** スケール (1.0 = 100%) */
	scale: number;
}

/** 検出オプション */
export interface DetectionOptions {
	/** グレーピクセルの彩度しきい値（デフォルト: 15） */
	saturationThreshold?: number;
	/** グレーピクセルの明度範囲 */
	lightnessRange?: { min: number; max: number };
	/** アスペクト比の許容誤差（デフォルト: 0.15） */
	aspectRatioTolerance?: number;
	/** 最小領域サイズ（ピクセル数） */
	minRegionArea?: number;
}

/** デフォルトの検出オプション */
export const DEFAULT_DETECTION_OPTIONS: Required<DetectionOptions> = {
	saturationThreshold: 15,
	lightnessRange: { min: 20, max: 45 },
	aspectRatioTolerance: 0.15,
	minRegionArea: 10000, // 100x100程度
};

/** 表示モード */
export type ViewMode = "side-by-side" | "overlay" | "diff" | "swipe";

/** スクリーンショット比較状態 */
export interface ScreenshotCompareState {
	/** アップロードされたファイル */
	screenshotFile: File | null;
	/** スクリーンショットのData URL */
	screenshotDataUrl: string | null;
	/** 検出されたボード領域 */
	detectedRegion: DetectedRegion | null;
	/** 検出中フラグ */
	isDetecting: boolean;
	/** 検出エラー */
	detectionError: string | null;
	/** 手動調整パラメータ */
	manualAdjustment: ManualAdjustment;
	/** 手動調整モードを使用 */
	useManualMode: boolean;
	/** stgyコード */
	stgyCode: string;
	/** 表示モード */
	viewMode: ViewMode;
	/** オーバーレイ透過度 (0-100) */
	overlayOpacity: number;
	/** 検出境界表示フラグ */
	showDetectionBounds: boolean;
}

/** 初期状態 */
export const INITIAL_STATE: ScreenshotCompareState = {
	screenshotFile: null,
	screenshotDataUrl: null,
	detectedRegion: null,
	isDetecting: false,
	detectionError: null,
	manualAdjustment: { offsetX: 0, offsetY: 0, scale: 1.0 },
	useManualMode: false,
	stgyCode: "",
	viewMode: "side-by-side",
	overlayOpacity: 50,
	showDetectionBounds: true,
};
