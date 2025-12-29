/**
 * Node.js向け画像比較テストユーティリティ
 */

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export interface PixelComparisonResult {
	/** 一致率 (0-100%) */
	matchPercentage: number;
	/** 差分ピクセル数 */
	diffPixelCount: number;
	/** 総ピクセル数 */
	totalPixels: number;
}

/**
 * PNGバッファからPNGオブジェクトをパース
 */
export function parsePng(buffer: Buffer): PNG {
	return PNG.sync.read(buffer);
}

/**
 * 2つのPNG画像をピクセル単位で比較
 * @param img1 - 比較元のPNG
 * @param img2 - 比較先のPNG
 * @param threshold - 色差分の許容値 (0-1、デフォルト: 0.1)
 * @returns 比較結果
 */
export function comparePixels(
	img1: PNG,
	img2: PNG,
	threshold = 0.1,
): PixelComparisonResult {
	if (img1.width !== img2.width || img1.height !== img2.height) {
		throw new Error(
			`Image dimensions must match: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`,
		);
	}

	const { width, height } = img1;
	const totalPixels = width * height;

	// pixelmatchで差分ピクセル数を計算
	const diffPixelCount = pixelmatch(
		img1.data,
		img2.data,
		null, // 差分画像は生成しない
		width,
		height,
		{ threshold },
	);

	const matchPercentage = ((totalPixels - diffPixelCount) / totalPixels) * 100;

	return {
		matchPercentage,
		diffPixelCount,
		totalPixels,
	};
}

/**
 * PNGを指定サイズにリサイズ（簡易的なニアレストネイバー補間）
 * @param png - リサイズ元のPNG
 * @param targetWidth - ターゲット幅
 * @param targetHeight - ターゲット高さ
 * @returns リサイズされたPNG
 */
export function resizePng(
	png: PNG,
	targetWidth: number,
	targetHeight: number,
): PNG {
	const resized = new PNG({ width: targetWidth, height: targetHeight });
	const scaleX = png.width / targetWidth;
	const scaleY = png.height / targetHeight;

	for (let y = 0; y < targetHeight; y++) {
		for (let x = 0; x < targetWidth; x++) {
			const srcX = Math.floor(x * scaleX);
			const srcY = Math.floor(y * scaleY);
			const srcIdx = (srcY * png.width + srcX) * 4;
			const dstIdx = (y * targetWidth + x) * 4;

			resized.data[dstIdx] = png.data[srcIdx];
			resized.data[dstIdx + 1] = png.data[srcIdx + 1];
			resized.data[dstIdx + 2] = png.data[srcIdx + 2];
			resized.data[dstIdx + 3] = png.data[srcIdx + 3];
		}
	}

	return resized;
}

/**
 * PNG画像から指定領域を抽出
 * @param png - 元のPNG
 * @param region - 抽出領域 { x, y, width, height }
 * @returns 抽出されたPNG
 */
export function extractRegion(
	png: PNG,
	region: { x: number; y: number; width: number; height: number },
): PNG {
	const extracted = new PNG({ width: region.width, height: region.height });

	for (let y = 0; y < region.height; y++) {
		for (let x = 0; x < region.width; x++) {
			const srcX = region.x + x;
			const srcY = region.y + y;

			if (srcX < 0 || srcX >= png.width || srcY < 0 || srcY >= png.height) {
				// 範囲外は透明
				const dstIdx = (y * region.width + x) * 4;
				extracted.data[dstIdx] = 0;
				extracted.data[dstIdx + 1] = 0;
				extracted.data[dstIdx + 2] = 0;
				extracted.data[dstIdx + 3] = 0;
				continue;
			}

			const srcIdx = (srcY * png.width + srcX) * 4;
			const dstIdx = (y * region.width + x) * 4;

			extracted.data[dstIdx] = png.data[srcIdx];
			extracted.data[dstIdx + 1] = png.data[srcIdx + 1];
			extracted.data[dstIdx + 2] = png.data[srcIdx + 2];
			extracted.data[dstIdx + 3] = png.data[srcIdx + 3];
		}
	}

	return extracted;
}

/**
 * RGB to HSL変換
 * @returns {h: 0-360, s: 0-100, l: 0-100}
 */
export function rgbToHsl(
	r: number,
	g: number,
	b: number,
): { h: number; s: number; l: number } {
	const rNorm = r / 255;
	const gNorm = g / 255;
	const bNorm = b / 255;

	const max = Math.max(rNorm, gNorm, bNorm);
	const min = Math.min(rNorm, gNorm, bNorm);
	const l = (max + min) / 2;

	if (max === min) {
		return { h: 0, s: 0, l: l * 100 };
	}

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

	let h: number;
	switch (max) {
		case rNorm:
			h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
			break;
		case gNorm:
			h = ((bNorm - rNorm) / d + 2) / 6;
			break;
		default:
			h = ((rNorm - gNorm) / d + 4) / 6;
			break;
	}

	return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * グレーボードピクセル判定
 */
function isGrayBoardPixel(r: number, g: number, b: number): boolean {
	const hsl = rgbToHsl(r, g, b);
	return hsl.s < 15 && hsl.l >= 25 && hsl.l <= 40;
}

/**
 * ボード領域を自動検出（Node.js向け簡易版）
 * @param png - 検出対象のPNG
 * @returns 検出された領域、または検出失敗時はnull
 */
export function detectBoardRegion(
	png: PNG,
): { x: number; y: number; width: number; height: number } | null {
	const { width, height, data } = png;

	let minX = width;
	let maxX = 0;
	let minY = height;
	let maxY = 0;
	let grayCount = 0;

	// グレーピクセルのバウンディングボックスを計算
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * 4;
			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];

			if (isGrayBoardPixel(r, g, b)) {
				grayCount++;
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}
	}

	// 十分なグレーピクセルがない場合は失敗
	if (grayCount < 1000) {
		return null;
	}

	const regionWidth = maxX - minX + 1;
	const regionHeight = maxY - minY + 1;

	// 最小サイズチェック
	if (regionWidth < 100 || regionHeight < 75) {
		return null;
	}

	return {
		x: minX,
		y: minY,
		width: regionWidth,
		height: regionHeight,
	};
}
