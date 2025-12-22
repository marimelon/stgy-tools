/**
 * resvg のラッパー
 * Cloudflare Workers と Node.js の両方に対応
 *
 * ビルドターゲットに応じて適切な実装を使用:
 * - cloudflare: @cf-wasm/resvg
 * - node: @resvg/resvg-js
 *
 * 最適化:
 * - モジュールのキャッシュ（動的インポートの回避）
 * - フォントファイルパスの使用（毎回のパースを回避）
 */

export interface ResvgOptions {
	background?: string;
	fitTo?: {
		mode: "width" | "height" | "zoom" | "original";
		value?: number;
	};
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
 */
async function renderWithCloudflareResvg(
	svg: string,
	options: ResvgOptions,
): Promise<Uint8Array> {
	const { Resvg } = await import("@cf-wasm/resvg");
	const resvg = new Resvg(svg, options);
	const pngData = resvg.render();
	return new Uint8Array(pngData.asPng());
}

/**
 * Node.js用: フォントファイルパスを取得（初回のみファイル存在確認）
 */
async function getFontPath(): Promise<string | null> {
	if (cachedFontPath !== null) {
		return cachedFontPath;
	}

	const { join } = await import("node:path");
	const { access } = await import("node:fs/promises");

	const possiblePaths = [
		join(process.cwd(), ".output", "public", "fonts", "NotoSansJP-Regular.ttf"),
		join(process.cwd(), "public", "fonts", "NotoSansJP-Regular.ttf"),
	];

	for (const fontPath of possiblePaths) {
		try {
			await access(fontPath);
			cachedFontPath = fontPath;
			console.log("[resvgWrapper] Font path cached:", fontPath);
			return cachedFontPath;
		} catch {
			continue;
		}
	}

	console.error("[resvgWrapper] Font file not found");
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
		// @ts-expect-error 動的インポート - Cloudflare ビルド時は外部化されているため解決されない
		const module = await import("@resvg/resvg-js");
		cachedNodeResvg = module.Resvg;
		console.log("[resvgWrapper] Resvg module cached");
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
