/**
 * PNG metadata embedding/extraction utility
 *
 * Uses iTXt chunks (UTF-8 support) to embed metadata in PNG images
 */

import { decodeSync, encodeSync, type ITxtChunk } from "png-chunk-itxt";

// @ts-expect-error - png-chunks-encode has no type definitions
import encodeChunks from "png-chunks-encode";
// @ts-expect-error - png-chunks-extract has no type definitions
import extractChunks from "png-chunks-extract";

interface PngChunk {
	name: string;
	data: Uint8Array;
}

const DEFAULT_SOFTWARE = "STGY Tools";

/** Compression threshold for stgy code (bytes) */
const COMPRESSION_THRESHOLD = 1000;

export interface PngMetadata {
	/** Full stgy code */
	stgy?: string;
	/** Board name (UTF-8 supported) */
	title?: string;
	/** Generator software name */
	software?: string;
	/** Custom metadata (arbitrary key-value pairs) */
	custom?: Record<string, string>;
}

export interface ExtractedPngMetadata {
	stgy?: string;
	title?: string;
	software?: string;
	[key: string]: string | undefined;
}

const KEYWORD_MAP: Record<
	keyof Omit<PngMetadata, "custom">,
	{ keyword: string; compress: boolean }
> = {
	stgy: { keyword: "stgy", compress: true },
	title: { keyword: "Title", compress: false },
	software: { keyword: "Software", compress: false },
};

const REVERSE_KEYWORD_MAP = Object.fromEntries(
	Object.entries(KEYWORD_MAP).map(([key, { keyword }]) => [keyword, key]),
);

function createItxtChunk(
	keyword: string,
	text: string,
	options?: { compress?: boolean; languageTag?: string },
): { name: string; data: Uint8Array } {
	const shouldCompress =
		options?.compress && text.length > COMPRESSION_THRESHOLD;

	const data: ITxtChunk = {
		keyword,
		text,
		compressionFlag: shouldCompress ?? false,
		compressionMethod: 0,
		languageTag: options?.languageTag ?? "",
		translatedKeyword: "",
	};

	const buffer = encodeSync(data);
	return { name: "iTXt", data: buffer };
}

export function embedMetadata(
	pngBuffer: Uint8Array,
	metadata: PngMetadata,
): Uint8Array {
	const chunks: PngChunk[] = extractChunks(pngBuffer);
	const textChunks: Array<{ name: string; data: Uint8Array }> = [];

	for (const [key, config] of Object.entries(KEYWORD_MAP)) {
		const value = metadata[key as keyof typeof KEYWORD_MAP];
		if (value) {
			textChunks.push(
				createItxtChunk(config.keyword, value, { compress: config.compress }),
			);
		}
	}

	if (metadata.custom) {
		for (const [key, value] of Object.entries(metadata.custom)) {
			if (value) {
				textChunks.push(createItxtChunk(key, value));
			}
		}
	}

	// Insert before IDAT chunk (per PNG spec: tEXt/iTXt should be after IHDR, before IDAT)
	const idatIndex = chunks.findIndex((chunk) => chunk.name === "IDAT");
	const insertIndex = idatIndex > 0 ? idatIndex : chunks.length - 1;

	chunks.splice(insertIndex, 0, ...textChunks);

	return encodeChunks(chunks);
}

export function extractMetadata(pngBuffer: Uint8Array): ExtractedPngMetadata {
	const chunks: PngChunk[] = extractChunks(pngBuffer);
	const result: ExtractedPngMetadata = {};

	for (const chunk of chunks) {
		if (chunk.name === "iTXt") {
			try {
				const decoded = decodeSync(chunk.data);
				// Normalize standard keywords
				const normalizedKey =
					REVERSE_KEYWORD_MAP[decoded.keyword] ?? decoded.keyword;
				result[normalizedKey] = decoded.text;
			} catch {
				// Skip on decode failure
			}
		}
	}

	return result;
}

export function createDefaultMetadata(
	stgyCode: string,
	boardName?: string,
): PngMetadata {
	return {
		stgy: stgyCode,
		title: boardName || undefined,
		software: DEFAULT_SOFTWARE,
	};
}
