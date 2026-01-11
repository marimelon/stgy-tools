/**
 * Image renderer abstraction layer
 *
 * Delegates to external server if EXTERNAL_IMAGE_RENDERER_URL is set,
 * otherwise generates locally. Callers don't need to handle this difference.
 */

import type { BoardData } from "@/lib/stgy/types";
import { getGlobalEnv } from "./cloudflareContext";
import { createDefaultMetadata, embedMetadata } from "./pngMetadata";
import { renderSvgToPng } from "./resvgWrapper";
import { renderBoardToSVG } from "./svgRenderer";

export interface ImageRenderOptions {
	/** Board data (used for local generation) */
	boardData: BoardData;
	format: "png" | "svg";
	/** Output width (PNG only, default 512) */
	width?: number;
	/** Whether to show board name as title bar */
	showTitle?: boolean;
	/** stgy code (used for external delegation and metadata embedding) */
	stgyCode?: string;
}

export interface ImageRenderResult {
	/** Image data (PNG: Uint8Array, SVG: string) */
	data: Uint8Array | string;
	contentType: "image/png" | "image/svg+xml";
}

const DEFAULT_WIDTH = 512;

export function hasExternalRenderer(): boolean {
	const env = getGlobalEnv();
	return Boolean(env?.EXTERNAL_IMAGE_RENDERER_URL);
}

function getExternalRendererUrl(): string | undefined {
	const env = getGlobalEnv();
	return env?.EXTERNAL_IMAGE_RENDERER_URL as string | undefined;
}

/**
 * Automatically selects local generation or external server delegation.
 * SVG format is always generated locally (lightweight).
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

	// SVG always generated locally (low CPU overhead)
	if (format === "svg") {
		return renderLocalSvg(boardData, showTitle);
	}

	// PNG: delegate to external renderer if configured
	const externalUrl = getExternalRendererUrl();
	if (externalUrl && options.stgyCode) {
		return renderViaExternalServer(
			externalUrl,
			options.stgyCode,
			width,
			showTitle,
		);
	}

	return renderLocalPng(boardData, width, showTitle, {
		stgyCode: options.stgyCode,
	});
}

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

async function renderLocalPng(
	boardData: BoardData,
	width: number,
	showTitle: boolean,
	options?: {
		stgyCode?: string;
	},
): Promise<ImageRenderResult> {
	const svg = await renderBoardToSVG(boardData, { showTitle });

	let pngBuffer = await renderSvgToPng(svg, {
		background: "#1a1a1a",
		fitTo: {
			mode: "width",
			value: width,
		},
	});

	// Embed metadata when stgyCode is available
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

async function renderViaExternalServer(
	baseUrl: string,
	stgyCode: string,
	width: number,
	showTitle: boolean,
): Promise<ImageRenderResult> {
	const url = new URL(baseUrl);
	url.searchParams.set("stgy", stgyCode);
	url.searchParams.set("format", "png");
	if (width !== DEFAULT_WIDTH) {
		url.searchParams.set("width", width.toString());
	}
	if (showTitle) {
		url.searchParams.set("title", "1");
	}

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

	const arrayBuffer = await response.arrayBuffer();
	const data = new Uint8Array(arrayBuffer);

	return {
		data,
		contentType: "image/png",
	};
}
