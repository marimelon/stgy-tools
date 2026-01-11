/**
 * Screenshot comparison type definitions
 */

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/board/constants";

export const TARGET_BOARD_WIDTH = CANVAS_WIDTH; // 512
export const TARGET_BOARD_HEIGHT = CANVAS_HEIGHT; // 384
export const TARGET_ASPECT_RATIO = TARGET_BOARD_WIDTH / TARGET_BOARD_HEIGHT; // ~1.333

export type DetectionMethod = "color" | "edge" | "manual";

export interface DetectedRegion {
	x: number;
	y: number;
	width: number;
	height: number;
	confidence: number;
	method: DetectionMethod;
}

export interface ManualAdjustment {
	offsetX: number;
	offsetY: number;
	scale: number;
}

export interface DetectionOptions {
	saturationThreshold?: number;
	lightnessRange?: { min: number; max: number };
	aspectRatioTolerance?: number;
	minRegionArea?: number;
}

export const DEFAULT_DETECTION_OPTIONS: Required<DetectionOptions> = {
	saturationThreshold: 15,
	lightnessRange: { min: 20, max: 45 },
	aspectRatioTolerance: 0.15,
	minRegionArea: 10000,
};

export type ViewMode = "side-by-side" | "overlay" | "diff" | "swipe";

export interface ScreenshotCompareState {
	screenshotFile: File | null;
	screenshotDataUrl: string | null;
	detectedRegion: DetectedRegion | null;
	isDetecting: boolean;
	detectionError: string | null;
	manualAdjustment: ManualAdjustment;
	useManualMode: boolean;
	stgyCode: string;
	viewMode: ViewMode;
	overlayOpacity: number;
	showDetectionBounds: boolean;
}

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
