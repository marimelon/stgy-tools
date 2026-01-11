/**
 * API endpoint to generate PNG images from stgy code
 *
 * GET /image?stgy=[stgy:a...]
 * GET /image?stgy=[stgy:a...]&format=svg  (return as SVG)
 * GET /image?stgy=[stgy:a...]&width=2048  (specify width, default 512, max 2048)
 * GET /image?stgy=[stgy:a...]&scale=4     (specify scale, 1-4x)
 * GET /image?stgy=[stgy:a...]&title=1     (show board name)
 * GET /image?s=abc123                      (resolve short ID to stgy)
 */

import { createFileRoute } from "@tanstack/react-router";
import { renderImage } from "@/lib/server/imageRenderer";
import { isShortLinksEnabled, resolveShortId } from "@/lib/server/shortLinks";
import { decodeStgy } from "@/lib/stgy/decoder";
import { assignBoardObjectIds } from "@/lib/stgy/id";
import { parseBoardData } from "@/lib/stgy/parser";

const DEFAULT_WIDTH = 512;
const MIN_WIDTH = 128;
/** Max width (HR asset images are 2x resolution) */
const MAX_WIDTH = 2048;
/** Max scale (HR asset images are 2x resolution) */
const MAX_SCALE = 4;

const DEFAULT_FILENAME = "strategy-board";

/**
 * Convert to a filename-safe string by removing control characters
 * and filesystem-problematic characters.
 *
 * Note: For Content-Disposition header only; no actual file writes.
 * The browser performs final validation. Minimal sanitization suffices.
 */
function sanitizeFilename(name: string): string {
	const trimmed = name.trim();
	if (!trimmed) return DEFAULT_FILENAME;

	const sanitized = trimmed
		// biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally removing control characters from filename
		.replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "")
		.replace(/[\u200B-\u200D\u2028-\u202E\uFEFF]/g, "")
		.replace(/\.{2,}/g, ".")
		.replace(/\s+/g, " ")
		.trim();

	return sanitized || DEFAULT_FILENAME;
}

/**
 * Generate Content-Disposition header value.
 * Includes UTF-8 encoded filename per RFC 5987.
 */
function createContentDisposition(filename: string, extension: string): string {
	const safeFilename = sanitizeFilename(filename);
	const fullFilename = `${safeFilename}.${extension}`;

	const hasNonAscii = /[^\x20-\x7e]/.test(fullFilename);
	const asciiFilename = hasNonAscii
		? fullFilename.replace(/[^\x20-\x7e]/g, "_")
		: fullFilename;
	const encodedFilename = encodeURIComponent(fullFilename);

	if (hasNonAscii) {
		return `inline; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;
	}
	return `inline; filename="${fullFilename}"`;
}

export const Route = createFileRoute("/image")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				let code = url.searchParams.get("stgy");
				const shortId = url.searchParams.get("s");
				const format = url.searchParams.get("format") ?? "png";
				const widthParam = url.searchParams.get("width");
				const scaleParam = url.searchParams.get("scale");
				const titleParam = url.searchParams.get("title");

				// Resolve short ID to stgy code if specified
				if (!code && shortId) {
					if (!isShortLinksEnabled()) {
						return new Response(
							JSON.stringify({
								error: "Short links feature is disabled",
								code: "FEATURE_DISABLED",
							}),
							{
								status: 503,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					const resolved = await resolveShortId(shortId);
					if (!resolved) {
						return new Response(
							JSON.stringify({ error: "Short link not found" }),
							{
								status: 404,
								headers: { "Content-Type": "application/json" },
							},
						);
					}
					code = resolved.stgy;
				}

				if (!code) {
					return new Response(null, {
						status: 302,
						headers: { Location: "/image/generate" },
					});
				}

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

				const showTitle =
					titleParam === "1" || titleParam === "true" || titleParam === "yes";

				try {
					const binary = decodeStgy(code);
					const parsed = parseBoardData(binary);
					const boardData = assignBoardObjectIds(parsed);

					const result = await renderImage({
						boardData,
						format: format === "svg" ? "svg" : "png",
						width: outputWidth,
						showTitle,
						stgyCode: code,
					});

					const contentDisposition = createContentDisposition(
						boardData.name,
						format === "svg" ? "svg" : "png",
					);

					return new Response(result.data as BodyInit, {
						headers: {
							"Content-Type": result.contentType,
							"Content-Disposition": contentDisposition,
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
