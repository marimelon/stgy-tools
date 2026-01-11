/**
 * resvg wrapper for both Cloudflare Workers and Node.js
 *
 * Uses appropriate implementation based on build target:
 * - cloudflare: @cf-wasm/resvg (fontBuffers for fonts)
 * - node: @resvg/resvg-js (fontFiles for file paths)
 *
 * Optimizations:
 * - Module caching (avoids dynamic import overhead)
 * - Font caching (avoids repeated loading)
 * - Node.js: font file paths (avoids repeated buffer parsing)
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

let cachedNodeResvg: typeof import("@resvg/resvg-js").Resvg | null = null;
let cachedFontPath: string | null = null;

export async function renderSvgToPng(
	svg: string,
	options: ResvgOptions,
): Promise<Uint8Array> {
	const buildTarget = import.meta.env.BUILD_TARGET || "cloudflare";

	if (buildTarget === "cloudflare") {
		return renderWithCloudflareResvg(svg, options);
	}
	return renderWithNodeResvg(svg, options);
}

/**
 * Cloudflare Workers: loads fonts from ASSETS binding via imageLoader (cached)
 */
async function renderWithCloudflareResvg(
	svg: string,
	options: ResvgOptions,
): Promise<Uint8Array> {
	const { Resvg } = await import("@cf-wasm/resvg");
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
 * Node.js: get font file path (checks file existence only on first call)
 * Docker environment uses full font (supports all Japanese characters)
 */
async function getFontPath(): Promise<string | null> {
	if (cachedFontPath !== null) {
		return cachedFontPath || null;
	}

	const { join } = await import("node:path");
	const { access } = await import("node:fs/promises");

	// Node.js/Docker: prefer full font (no CPU restrictions, supports all characters)
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
				// Not found at this path, try next
			}
		}
	}

	cachedFontPath = ""; // Empty string caches "not found"
	return null;
}

/**
 * Node.js: uses fontFiles option for file paths (more efficient than buffer parsing)
 */
async function renderWithNodeResvg(
	svg: string,
	options: ResvgOptions,
): Promise<Uint8Array> {
	if (!cachedNodeResvg) {
		const module = await import("@resvg/resvg-js");
		cachedNodeResvg = module.Resvg;
	}

	const fontPath = await getFontPath();

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
