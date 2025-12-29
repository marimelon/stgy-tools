/**
 * Canvas画像操作ユーティリティ
 */

import { TARGET_BOARD_HEIGHT, TARGET_BOARD_WIDTH } from "./types";

/**
 * FileからImageElementをロード
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image"));
		};
		img.src = url;
	});
}

/**
 * Data URLからImageElementをロード
 */
export function loadImageFromDataUrl(
	dataUrl: string,
): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Failed to load image"));
		img.src = dataUrl;
	});
}

/**
 * ImageElementをCanvasに描画してImageDataを取得
 */
export function getImageDataFromImage(img: HTMLImageElement): ImageData {
	const canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to get 2D context");
	ctx.drawImage(img, 0, 0);
	return ctx.getImageData(0, 0, img.width, img.height);
}

/**
 * FileからImageDataを取得
 */
export async function getImageDataFromFile(file: File): Promise<ImageData> {
	const img = await loadImageFromFile(file);
	return getImageDataFromImage(img);
}

/**
 * 指定領域を抽出して512x384にリサイズしたCanvasを作成
 */
export function extractAndResizeRegion(
	sourceImg: HTMLImageElement,
	region: { x: number; y: number; width: number; height: number },
): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = TARGET_BOARD_WIDTH;
	canvas.height = TARGET_BOARD_HEIGHT;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to get 2D context");

	// ソース領域からターゲットサイズにリサイズして描画
	ctx.drawImage(
		sourceImg,
		region.x,
		region.y,
		region.width,
		region.height,
		0,
		0,
		TARGET_BOARD_WIDTH,
		TARGET_BOARD_HEIGHT,
	);

	return canvas;
}

/**
 * 手動調整を適用して領域を抽出
 */
export function extractWithManualAdjustment(
	sourceImg: HTMLImageElement,
	adjustment: { offsetX: number; offsetY: number; scale: number },
): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = TARGET_BOARD_WIDTH;
	canvas.height = TARGET_BOARD_HEIGHT;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to get 2D context");

	// スケールに基づいてソース領域のサイズを計算
	const sourceWidth = TARGET_BOARD_WIDTH / adjustment.scale;
	const sourceHeight = TARGET_BOARD_HEIGHT / adjustment.scale;

	// 画像の中心からオフセットを適用
	const centerX = sourceImg.width / 2 + adjustment.offsetX;
	const centerY = sourceImg.height / 2 + adjustment.offsetY;

	const sourceX = centerX - sourceWidth / 2;
	const sourceY = centerY - sourceHeight / 2;

	ctx.drawImage(
		sourceImg,
		sourceX,
		sourceY,
		sourceWidth,
		sourceHeight,
		0,
		0,
		TARGET_BOARD_WIDTH,
		TARGET_BOARD_HEIGHT,
	);

	return canvas;
}

/**
 * CanvasをData URLに変換
 */
export function canvasToDataUrl(
	canvas: HTMLCanvasElement,
	type = "image/png",
): string {
	return canvas.toDataURL(type);
}

/**
 * FileをData URLに変換
 */
export function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
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

/** 画像比較結果 */
export interface ComparisonResult {
	/** 一致率 (0-100%) */
	matchPercentage: number;
	/** 差分ピクセル数 */
	diffPixelCount: number;
	/** 総ピクセル数 */
	totalPixels: number;
	/** 平均色差分 (0-255) */
	averageColorDiff: number;
}

/**
 * 2つの画像を比較して一致率を計算
 * @param imageData1 - 比較元のImageData
 * @param imageData2 - 比較先のImageData
 * @param tolerance - 色差分の許容値 (0-255、デフォルト: 30)
 * @returns 比較結果
 */
export function compareImages(
	imageData1: ImageData,
	imageData2: ImageData,
	tolerance = 30,
): ComparisonResult {
	const { data: data1, width, height } = imageData1;
	const { data: data2 } = imageData2;

	// サイズが異なる場合はエラー
	if (
		imageData1.width !== imageData2.width ||
		imageData1.height !== imageData2.height
	) {
		throw new Error("Image dimensions must match");
	}

	const totalPixels = width * height;
	let matchingPixels = 0;
	let totalColorDiff = 0;

	for (let i = 0; i < data1.length; i += 4) {
		const r1 = data1[i];
		const g1 = data1[i + 1];
		const b1 = data1[i + 2];

		const r2 = data2[i];
		const g2 = data2[i + 1];
		const b2 = data2[i + 2];

		// 色差分を計算（ユークリッド距離）
		const colorDiff = Math.sqrt(
			(r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2,
		);

		// 正規化された差分 (0-255)
		const normalizedDiff = colorDiff / Math.sqrt(3);
		totalColorDiff += normalizedDiff;

		// 許容範囲内なら一致とみなす
		if (normalizedDiff <= tolerance) {
			matchingPixels++;
		}
	}

	const diffPixelCount = totalPixels - matchingPixels;
	const matchPercentage = (matchingPixels / totalPixels) * 100;
	const averageColorDiff = totalColorDiff / totalPixels;

	return {
		matchPercentage,
		diffPixelCount,
		totalPixels,
		averageColorDiff,
	};
}

/**
 * SVG要素をCanvasに描画してImageDataを取得
 * @param svgElement - SVG要素
 * @param width - 幅
 * @param height - 高さ
 */
export async function svgToImageData(
	svgElement: SVGSVGElement,
	width: number,
	height: number,
): Promise<ImageData> {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to get 2D context");

	// SVGをシリアライズ
	const serializer = new XMLSerializer();
	const svgString = serializer.serializeToString(svgElement);
	const svgBlob = new Blob([svgString], {
		type: "image/svg+xml;charset=utf-8",
	});
	const url = URL.createObjectURL(svgBlob);

	// SVGを画像として読み込み
	const img = await loadImageFromDataUrl(url);
	URL.revokeObjectURL(url);

	ctx.drawImage(img, 0, 0, width, height);
	return ctx.getImageData(0, 0, width, height);
}

/**
 * Data URLからImageDataを取得
 */
export async function getImageDataFromDataUrl(
	dataUrl: string,
): Promise<ImageData> {
	const img = await loadImageFromDataUrl(dataUrl);
	return getImageDataFromImage(img);
}
