/**
 * stgy コードから PNG 画像を生成して返す API エンドポイント
 *
 * GET /image?code=[stgy:a...]
 * GET /image?code=[stgy:a...]&format=svg  (SVGで返す場合)
 */

import { Resvg } from "@resvg/resvg-js";
import { createFileRoute } from "@tanstack/react-router";
import { renderBoardToSVG } from "@/lib/server/svgRenderer";
import { decodeStgy } from "@/lib/stgy/decoder";
import { parseBoardData } from "@/lib/stgy/parser";

export const Route = createFileRoute("/image")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const code = url.searchParams.get("code");
				const format = url.searchParams.get("format") ?? "png";

				if (!code) {
					// codeパラメータがない場合は生成ページにリダイレクト
					return new Response(null, {
						status: 302,
						headers: { Location: "/image/generate" },
					});
				}

				try {
					// 1. stgy コードをデコード
					const binary = decodeStgy(code);

					// 2. バイナリをパース
					const boardData = parseBoardData(binary);

					// 3. SVG を生成
					const svg = renderBoardToSVG(boardData);

					// 4. フォーマットに応じて返す
					if (format === "svg") {
						return new Response(svg, {
							headers: {
								"Content-Type": "image/svg+xml",
								"Cache-Control": "public, max-age=86400",
							},
						});
					}

					// PNG変換
					const resvg = new Resvg(svg, {
						background: "#1a1a1a",
						fitTo: {
							mode: "width",
							value: 512,
						},
					});

					const pngData = resvg.render();
					const pngBuffer = pngData.asPng();

					return new Response(new Uint8Array(pngBuffer), {
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

