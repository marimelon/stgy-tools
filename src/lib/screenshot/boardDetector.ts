/**
 * ボード領域自動検出アルゴリズム
 *
 * FFXIVのストラテジーボードは以下の特徴を持つ:
 * - グレー背景 (~#505050、HSL: 彩度0%、明度31%)
 * - 固定アスペクト比 (512:384 = 4:3)
 * - 明確な矩形境界
 */

import { rgbToHsl } from "./imageUtils";
import {
	DEFAULT_DETECTION_OPTIONS,
	type DetectedRegion,
	type DetectionOptions,
	TARGET_ASPECT_RATIO,
} from "./types";

interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * グレーピクセルかどうかを判定
 */
function isGrayBoardPixel(
	r: number,
	g: number,
	b: number,
	options: Required<DetectionOptions>,
): boolean {
	const hsl = rgbToHsl(r, g, b);
	return (
		hsl.s < options.saturationThreshold &&
		hsl.l >= options.lightnessRange.min &&
		hsl.l <= options.lightnessRange.max
	);
}

/**
 * 水平方向のランを検出（連続するグレーピクセルの区間）
 */
function findHorizontalRuns(
	imageData: ImageData,
	options: Required<DetectionOptions>,
): Array<{ y: number; xStart: number; xEnd: number }> {
	const { width, height, data } = imageData;
	const runs: Array<{ y: number; xStart: number; xEnd: number }> = [];

	for (let y = 0; y < height; y++) {
		let inRun = false;
		let runStart = 0;

		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * 4;
			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];
			const isGray = isGrayBoardPixel(r, g, b, options);

			if (isGray && !inRun) {
				inRun = true;
				runStart = x;
			} else if (!isGray && inRun) {
				inRun = false;
				// 最小幅以上のランのみ記録
				if (x - runStart > 50) {
					runs.push({ y, xStart: runStart, xEnd: x - 1 });
				}
			}
		}
		// 行末まで続いている場合
		if (inRun && width - runStart > 50) {
			runs.push({ y, xStart: runStart, xEnd: width - 1 });
		}
	}

	return runs;
}

/**
 * ランからバウンディングボックスを計算
 */
function findBoundingBoxFromRuns(
	runs: Array<{ y: number; xStart: number; xEnd: number }>,
): Rect | null {
	if (runs.length === 0) return null;

	let minX = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const run of runs) {
		minX = Math.min(minX, run.xStart);
		maxX = Math.max(maxX, run.xEnd);
		minY = Math.min(minY, run.y);
		maxY = Math.max(maxY, run.y);
	}

	return {
		x: minX,
		y: minY,
		width: maxX - minX + 1,
		height: maxY - minY + 1,
	};
}

/**
 * 矩形領域内のグレーピクセル密度を計算
 */
function calculateGrayDensity(
	imageData: ImageData,
	rect: Rect,
	options: Required<DetectionOptions>,
): number {
	const { width, data } = imageData;
	let grayCount = 0;
	let totalCount = 0;

	for (let y = rect.y; y < rect.y + rect.height; y++) {
		for (let x = rect.x; x < rect.x + rect.width; x++) {
			const idx = (y * width + x) * 4;
			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];
			totalCount++;
			if (isGrayBoardPixel(r, g, b, options)) {
				grayCount++;
			}
		}
	}

	return totalCount > 0 ? grayCount / totalCount : 0;
}

/**
 * エッジをリファイン（境界を精密化）
 */
function refineEdges(
	imageData: ImageData,
	rect: Rect,
	options: Required<DetectionOptions>,
): Rect {
	const { width, data } = imageData;

	// 各辺について、グレーピクセルが始まる位置を探す
	let top = rect.y;
	let bottom = rect.y + rect.height - 1;
	let left = rect.x;
	let right = rect.x + rect.width - 1;

	// 上辺を調整
	for (let y = rect.y; y < rect.y + rect.height / 4; y++) {
		let grayCount = 0;
		for (let x = rect.x; x < rect.x + rect.width; x++) {
			const idx = (y * width + x) * 4;
			if (isGrayBoardPixel(data[idx], data[idx + 1], data[idx + 2], options)) {
				grayCount++;
			}
		}
		if (grayCount > rect.width * 0.7) {
			top = y;
			break;
		}
	}

	// 下辺を調整
	for (
		let y = rect.y + rect.height - 1;
		y > rect.y + (rect.height * 3) / 4;
		y--
	) {
		let grayCount = 0;
		for (let x = rect.x; x < rect.x + rect.width; x++) {
			const idx = (y * width + x) * 4;
			if (isGrayBoardPixel(data[idx], data[idx + 1], data[idx + 2], options)) {
				grayCount++;
			}
		}
		if (grayCount > rect.width * 0.7) {
			bottom = y;
			break;
		}
	}

	// 左辺を調整
	for (let x = rect.x; x < rect.x + rect.width / 4; x++) {
		let grayCount = 0;
		for (let y = top; y <= bottom; y++) {
			const idx = (y * width + x) * 4;
			if (isGrayBoardPixel(data[idx], data[idx + 1], data[idx + 2], options)) {
				grayCount++;
			}
		}
		if (grayCount > (bottom - top) * 0.7) {
			left = x;
			break;
		}
	}

	// 右辺を調整
	for (
		let x = rect.x + rect.width - 1;
		x > rect.x + (rect.width * 3) / 4;
		x--
	) {
		let grayCount = 0;
		for (let y = top; y <= bottom; y++) {
			const idx = (y * width + x) * 4;
			if (isGrayBoardPixel(data[idx], data[idx + 1], data[idx + 2], options)) {
				grayCount++;
			}
		}
		if (grayCount > (bottom - top) * 0.7) {
			right = x;
			break;
		}
	}

	return {
		x: left,
		y: top,
		width: right - left + 1,
		height: bottom - top + 1,
	};
}

/**
 * アスペクト比に基づいて矩形を調整
 */
function adjustToAspectRatio(rect: Rect, targetRatio: number): Rect {
	const currentRatio = rect.width / rect.height;

	if (Math.abs(currentRatio - targetRatio) < 0.05) {
		// 十分近い場合はそのまま
		return rect;
	}

	if (currentRatio > targetRatio) {
		// 幅が広すぎる → 幅を縮小
		const newWidth = rect.height * targetRatio;
		const xOffset = (rect.width - newWidth) / 2;
		return {
			x: Math.round(rect.x + xOffset),
			y: rect.y,
			width: Math.round(newWidth),
			height: rect.height,
		};
	}
	// 高さが高すぎる → 高さを縮小
	const newHeight = rect.width / targetRatio;
	const yOffset = (rect.height - newHeight) / 2;
	return {
		x: rect.x,
		y: Math.round(rect.y + yOffset),
		width: rect.width,
		height: Math.round(newHeight),
	};
}

/**
 * 信頼度を計算
 */
function calculateConfidence(
	rect: Rect,
	imageData: ImageData,
	options: Required<DetectionOptions>,
): number {
	// グレー密度（0-1）
	const grayDensity = calculateGrayDensity(imageData, rect, options);

	// アスペクト比一致度（0-1）
	const actualRatio = rect.width / rect.height;
	const ratioDiff = Math.abs(actualRatio - TARGET_ASPECT_RATIO);
	const ratioConfidence = Math.max(0, 1 - ratioDiff / TARGET_ASPECT_RATIO);

	// サイズの妥当性（小さすぎないか）
	const area = rect.width * rect.height;
	const sizeConfidence = Math.min(1, area / options.minRegionArea);

	// 加重平均
	return grayDensity * 0.4 + ratioConfidence * 0.4 + sizeConfidence * 0.2;
}

/**
 * ボード領域を自動検出
 *
 * @param imageData - 検出対象の画像データ
 * @param options - 検出オプション
 * @returns 検出された領域、または検出失敗時はnull
 */
export function detectBoardRegion(
	imageData: ImageData,
	options?: DetectionOptions,
): DetectedRegion | null {
	const opts = { ...DEFAULT_DETECTION_OPTIONS, ...options };

	// Step 1: グレーピクセルのランを検出
	const runs = findHorizontalRuns(imageData, opts);
	if (runs.length < 10) {
		return null; // 十分なグレー領域がない
	}

	// Step 2: バウンディングボックスを計算
	const roughBox = findBoundingBoxFromRuns(runs);
	if (!roughBox) {
		return null;
	}

	// Step 3: 領域サイズを検証
	const area = roughBox.width * roughBox.height;
	if (area < opts.minRegionArea) {
		return null; // 領域が小さすぎる
	}

	// Step 4: エッジをリファイン
	const refinedBox = refineEdges(imageData, roughBox, opts);

	// Step 5: アスペクト比を検証・調整
	const aspectRatio = refinedBox.width / refinedBox.height;
	const ratioDiff = Math.abs(aspectRatio - TARGET_ASPECT_RATIO);

	if (ratioDiff > opts.aspectRatioTolerance) {
		// アスペクト比が大きく異なる場合は調整
		const adjustedBox = adjustToAspectRatio(refinedBox, TARGET_ASPECT_RATIO);

		// 調整後の信頼度を計算
		const confidence = calculateConfidence(adjustedBox, imageData, opts);

		return {
			...adjustedBox,
			confidence,
			method: "color",
		};
	}

	// Step 6: 信頼度を計算
	const confidence = calculateConfidence(refinedBox, imageData, opts);

	return {
		...refinedBox,
		confidence,
		method: "color",
	};
}
