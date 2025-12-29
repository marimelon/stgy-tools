/**
 * 画像レンダラー抽象化レイヤー
 *
 * 環境変数 EXTERNAL_IMAGE_RENDERER_URL が設定されている場合は外部サーバーに委譲し、
 * 設定されていない場合はローカルで生成する。
 * 呼び出し側はこの違いを意識する必要がない。
 */

import type { BoardData } from "@/lib/stgy/types";
import { getGlobalEnv } from "./cloudflareContext";
import { createDefaultMetadata, embedMetadata } from "./pngMetadata";
import { renderSvgToPng } from "./resvgWrapper";
import { renderBoardToSVG } from "./svgRenderer";

/**
 * 画像レンダリングオプション
 */
export interface ImageRenderOptions {
	/** ボードデータ（ローカル生成時に使用） */
	boardData: BoardData;
	/** 出力フォーマット */
	format: "png" | "svg";
	/** 出力幅（PNGのみ、デフォルト512） */
	width?: number;
	/** ボード名をタイトルバーとして表示するか */
	showTitle?: boolean;
	/** stgyコード（外部サーバー委譲時およびメタデータ埋め込みに使用） */
	stgyCode?: string;
}

/**
 * 画像レンダリング結果
 */
export interface ImageRenderResult {
	/** 画像データ（PNG: Uint8Array, SVG: string） */
	data: Uint8Array | string;
	/** Content-Type */
	contentType: "image/png" | "image/svg+xml";
}

/** デフォルトの出力幅 */
const DEFAULT_WIDTH = 512;

/**
 * 外部レンダラーが設定されているかチェック
 */
export function hasExternalRenderer(): boolean {
	const env = getGlobalEnv();
	return Boolean(env?.EXTERNAL_IMAGE_RENDERER_URL);
}

/**
 * 外部レンダラーのURLを取得
 */
function getExternalRendererUrl(): string | undefined {
	const env = getGlobalEnv();
	return env?.EXTERNAL_IMAGE_RENDERER_URL as string | undefined;
}

/**
 * 画像をレンダリングする
 *
 * 環境変数に応じて自動的にローカル生成または外部サーバー委譲を選択する。
 * SVGフォーマットの場合は常にローカル生成（軽量なため）。
 */
export async function renderImage(
	options: ImageRenderOptions,
): Promise<ImageRenderResult> {
	const {
		boardData,
		format,
		width = DEFAULT_WIDTH,
		showTitle = false,
	} = options;

	// SVGは常にローカル生成（CPU負荷が低いため）
	if (format === "svg") {
		return renderLocalSvg(boardData, showTitle);
	}

	// PNG生成: 外部レンダラーが設定されていれば委譲
	const externalUrl = getExternalRendererUrl();
	if (externalUrl && options.stgyCode) {
		return renderViaExternalServer(
			externalUrl,
			options.stgyCode,
			width,
			showTitle,
		);
	}

	// ローカルでPNG生成
	return renderLocalPng(boardData, width, showTitle, {
		stgyCode: options.stgyCode,
	});
}

/**
 * ローカルでSVGを生成
 */
async function renderLocalSvg(
	boardData: BoardData,
	showTitle: boolean,
): Promise<ImageRenderResult> {
	const svg = await renderBoardToSVG(boardData, { showTitle });
	return {
		data: svg,
		contentType: "image/svg+xml",
	};
}

/**
 * ローカルでPNGを生成
 */
async function renderLocalPng(
	boardData: BoardData,
	width: number,
	showTitle: boolean,
	options?: {
		stgyCode?: string;
	},
): Promise<ImageRenderResult> {
	// まずSVGを生成
	const svg = await renderBoardToSVG(boardData, { showTitle });

	// resvgでPNGに変換
	let pngBuffer = await renderSvgToPng(svg, {
		background: "#1a1a1a",
		fitTo: {
			mode: "width",
			value: width,
		},
	});

	// メタデータ埋め込み（stgyCodeがある場合は常に埋め込む）
	if (options?.stgyCode) {
		const metadata = createDefaultMetadata(
			options.stgyCode,
			boardData.name || undefined,
		);
		pngBuffer = embedMetadata(pngBuffer, metadata);
	}

	return {
		data: pngBuffer,
		contentType: "image/png",
	};
}

/**
 * 外部サーバーでPNGを生成
 */
async function renderViaExternalServer(
	baseUrl: string,
	stgyCode: string,
	width: number,
	showTitle: boolean,
): Promise<ImageRenderResult> {
	// クエリパラメータを構築
	const url = new URL(baseUrl);
	url.searchParams.set("stgy", stgyCode);
	url.searchParams.set("format", "png");
	if (width !== DEFAULT_WIDTH) {
		url.searchParams.set("width", width.toString());
	}
	if (showTitle) {
		url.searchParams.set("title", "1");
	}

	// 外部サーバーにリクエスト
	const response = await fetch(url.toString(), {
		method: "GET",
		headers: {
			Accept: "image/png",
		},
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => "Unknown error");
		throw new Error(
			`External renderer failed: ${response.status} ${response.statusText} - ${errorText}`,
		);
	}

	// レスポンスをUint8Arrayに変換
	const arrayBuffer = await response.arrayBuffer();
	const data = new Uint8Array(arrayBuffer);

	return {
		data,
		contentType: "image/png",
	};
}
