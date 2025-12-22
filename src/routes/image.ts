/**
 * stgy コードから PNG 画像を生成して返す API エンドポイント
 *
 * GET /image?code=[stgy:a...]
 * GET /image?code=[stgy:a...]&format=svg  (SVGで返す場合)
 * GET /image?code=[stgy:a...]&width=1024  (幅を指定、デフォルト512、最大1024)
 * GET /image?code=[stgy:a...]&scale=2     (スケール指定、1-2倍)
 * GET /image?code=[stgy:a...]&title=1     (ボード名を表示)
 */

import { createFileRoute } from "@tanstack/react-router";
import { loadFont } from "@/lib/server/imageLoader";
import { renderSvgToPng } from "@/lib/server/resvgWrapper";
import { renderBoardToSVG } from "@/lib/server/svgRenderer";
import { decodeStgy } from "@/lib/stgy/decoder";
import { parseBoardData } from "@/lib/stgy/parser";

/** デフォルトの出力幅 */
const DEFAULT_WIDTH = 512;
/** 最小出力幅 */
const MIN_WIDTH = 128;
/** 最大出力幅（素材画像の解像度制限のため） */
const MAX_WIDTH = 1024;
/** 最大スケール（素材画像の解像度制限のため） */
const MAX_SCALE = 2;

export const Route = createFileRoute("/image")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const code = url.searchParams.get("code");
				const format = url.searchParams.get("format") ?? "png";
				const widthParam = url.searchParams.get("width");
				const scaleParam = url.searchParams.get("scale");
				const titleParam = url.searchParams.get("title");

				if (!code) {
					// codeパラメータがない場合は生成ページにリダイレクト
					return new Response(null, {
						status: 302,
						headers: { Location: "/image/generate" },
					});
				}

				// 出力幅を計算
				let outputWidth = DEFAULT_WIDTH;
				if (scaleParam) {
					const scale = Math.min(
						Math.max(Number.parseFloat(scaleParam) || 1, 1),
						MAX_SCALE,
					);
					outputWidth = Math.round(DEFAULT_WIDTH * scale);
				} else if (widthParam) {
					outputWidth = Math.min(
						Math.max(
							Number.parseInt(widthParam, 10) || DEFAULT_WIDTH,
							MIN_WIDTH,
						),
						MAX_WIDTH,
					);
				}

				// ボード名表示オプション（"1", "true", "yes" などで有効）
				const showTitle =
					titleParam === "1" || titleParam === "true" || titleParam === "yes";

				try {
					// 1. stgy コードをデコード
					const binary = decodeStgy(code);

					// 2. バイナリをパース
					const boardData = parseBoardData(binary);

					// 3. SVG を生成
					const svg = await renderBoardToSVG(boardData, {
						showTitle,
					});

					// 4. フォーマットに応じて返す
					if (format === "svg") {
						return new Response(svg, {
							headers: {
								"Content-Type": "image/svg+xml",
								"Cache-Control": "public, max-age=86400",
							},
						});
					}

					// フォントを読み込む
					const fontData = await loadFont();

					// PNG変換（環境に応じて適切な resvg を使用）
					const pngBuffer = await renderSvgToPng(svg, {
						background: "#1a1a1a",
						fitTo: {
							mode: "width",
							value: outputWidth,
						},
						font: {
							fontBuffers: fontData ? [fontData] : [],
							defaultFontFamily: "Noto Sans JP",
						},
					});

					return new Response(pngBuffer, {
						headers: {
							"Content-Type": "image/png",
							"Cache-Control": "public, max-age=86400",
						},
					});
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Unknown error";
					return new Response(
						JSON.stringify({ error: `Failed to generate image: ${message}` }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},
		},
	},
});
