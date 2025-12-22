/**
 * resvg のラッパー
 * Cloudflare Workers と Node.js の両方に対応
 * 
 * ビルドターゲットに応じて適切な実装を使用:
 * - cloudflare: @cf-wasm/resvg
 * - node: @resvg/resvg-js
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
 * Node.js 用: @resvg/resvg-js を使用
 * 動的インポートを使用し、Cloudflare ビルド時はこのコードパスに到達しない
 */
async function renderWithNodeResvg(
	svg: string,
	options: ResvgOptions,
): Promise<Uint8Array> {
	// @ts-expect-error 動的インポート - Cloudflare ビルド時は外部化されているため解決されない
	const { Resvg } = await import("@resvg/resvg-js");
	const resvg = new Resvg(svg, {
		background: options.background,
		fitTo: options.fitTo,
		font: options.font
			? {
					fontBuffers: options.font.fontBuffers,
					defaultFontFamily: options.font.defaultFontFamily,
				}
			: undefined,
	});
	const pngData = resvg.render();
	return new Uint8Array(pngData.asPng());
}
