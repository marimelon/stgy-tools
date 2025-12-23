/**
 * resvg のラッパー
 * Cloudflare Workers と Node.js の両方に対応
 *
 * ビルドターゲットに応じて適切な実装を使用:
 * - cloudflare: @cf-wasm/resvg（fontBuffersでフォント渡し）
 * - node: @resvg/resvg-js（fontFilesでファイルパス指定）
 *
 * 最適化:
 * - モジュールのキャッシュ（動的インポートの回避）
 * - フォントのキャッシュ（毎回のロードを回避）
 * - Node.js: フォントファイルパスの使用（毎回のパースを回避）
 */

import { loadFont } from "./imageLoader";

export interface ResvgOptions {
	background?: string;
	fitTo?:
		| { mode: "original" }
		| { mode: "width"; value: number }
		| { mode: "height"; value: number }
		| { mode: "zoom"; value: number };
	font?: {
		fontBuffers?: Uint8Array[];
		defaultFontFamily?: string;
	};
}

// Node.js用: Resvgクラスのキャッシュ
let cachedNodeResvg: typeof import("@resvg/resvg-js").Resvg | null = null;

// Node.js用: フォントファイルパスのキャッシュ
let cachedFontPath: string | null = null;

/**
 * SVG を PNG に変換する
 * ビルドターゲットに応じて適切な resvg を使用
 */
export async function renderSvgToPng(
	svg: string,
	options: ResvgOptions,
): Promise<Uint8Array> {
	// ビルド時に定義された BUILD_TARGET を使用
	const buildTarget = import.meta.env.BUILD_TARGET || "cloudflare";

	if (buildTarget === "cloudflare") {
		return renderWithCloudflareResvg(svg, options);
	}
	return renderWithNodeResvg(svg, options);
}

/**
 * Cloudflare Workers 用: @cf-wasm/resvg を使用
 * フォントはASSETSバインディングから読み込み（imageLoader経由、キャッシュ付き）
 */
async function renderWithCloudflareResvg(
	svg: string,
	options: ResvgOptions,
): Promise<Uint8Array> {
	const { Resvg } = await import("@cf-wasm/resvg");

	// フォントを読み込む（キャッシュされる）
	const fontData = await loadFont();

	const resvg = new Resvg(svg, {
		background: options.background,
		fitTo: options.fitTo,
		font: {
			fontBuffers: fontData ? [fontData] : [],
			defaultFontFamily: "Noto Sans JP",
		},
	});
	const pngData = resvg.render();
	return new Uint8Array(pngData.asPng());
}

/**
 * Node.js用: フォントファイルパスを取得（初回のみファイル存在確認）
 * Docker環境ではフルフォントを使用（全日本語文字に対応）
 */
async function getFontPath(): Promise<string | null> {
	if (cachedFontPath !== null) {
		return cachedFontPath || null;
	}

	const { join } = await import("node:path");
	const { access } = await import("node:fs/promises");

	// Node.js/Docker環境: フル版を優先（CPU制限がないため全文字対応）
	const fontFiles = ["NotoSansJP-Regular.ttf", "NotoSansJP-Subset.ttf"];
	const baseDirs = [
		join(process.cwd(), ".output", "public", "fonts"),
		join(process.cwd(), "public", "fonts"),
	];

	for (const fontFile of fontFiles) {
		for (const baseDir of baseDirs) {
			try {
				const fontPath = join(baseDir, fontFile);
				await access(fontPath);
				cachedFontPath = fontPath;
				return cachedFontPath;
			} catch {
				// このパスでは見つからない、次を試す
			}
		}
	}

	cachedFontPath = ""; // 空文字で「見つからなかった」をキャッシュ
	return null;
}

/**
 * Node.js 用: @resvg/resvg-js を使用
 * 最適化:
 * - Resvgクラスをキャッシュ（動的インポートのオーバーヘッド削減）
 * - fontFilesオプションでファイルパスを指定（毎回のバッファパースを回避）
 */
async function renderWithNodeResvg(
	svg: string,
	options: ResvgOptions,
): Promise<Uint8Array> {
	// Resvgクラスをキャッシュ
	if (!cachedNodeResvg) {
		const module = await import("@resvg/resvg-js");
		cachedNodeResvg = module.Resvg;
	}

	// フォントパスを取得（キャッシュされる）
	const fontPath = await getFontPath();

	// fontFilesを使用してファイルパスを直接指定（バッファパースより効率的）
	const resvg = new cachedNodeResvg(svg, {
		background: options.background,
		fitTo: options.fitTo,
		font: {
			fontFiles: fontPath ? [fontPath] : [],
			defaultFontFamily: options.font?.defaultFontFamily ?? "Noto Sans JP",
		},
	});

	const pngData = resvg.render();
	return pngData.asPng();
}
