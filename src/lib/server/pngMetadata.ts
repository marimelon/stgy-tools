/**
 * PNGメタデータ埋め込み/抽出ユーティリティ
 *
 * iTXtチャンク（UTF-8対応）を使用してPNG画像にメタデータを埋め込む
 */

import { decodeSync, encodeSync, type ITxtChunk } from "png-chunk-itxt";

// png-chunks-extract / png-chunks-encode の型定義
declare module "png-chunks-extract" {
	interface PngChunk {
		name: string;
		data: Uint8Array;
	}
	function extractChunks(data: Uint8Array): PngChunk[];
	export = extractChunks;
}

declare module "png-chunks-encode" {
	interface PngChunk {
		name: string;
		data: Uint8Array;
	}
	function encodeChunks(chunks: PngChunk[]): Uint8Array;
	export = encodeChunks;
}

import encodeChunks from "png-chunks-encode";
import extractChunks from "png-chunks-extract";

/** デフォルトのソフトウェア名 */
const DEFAULT_SOFTWARE = "STGY Tools";

/** stgyコード圧縮の閾値（バイト） */
const COMPRESSION_THRESHOLD = 1000;

/**
 * 埋め込むメタデータ
 */
export interface PngMetadata {
	/** stgyコード全文 */
	stgy?: string;
	/** ボード名（UTF-8対応） */
	title?: string;
	/** 生成ソフトウェア名 */
	software?: string;
	/** カスタムメタデータ (任意のkey-value) */
	custom?: Record<string, string>;
}

/**
 * 抽出されたメタデータ
 */
export interface ExtractedPngMetadata {
	stgy?: string;
	title?: string;
	software?: string;
	[key: string]: string | undefined;
}

/** 標準キーワードのマッピング */
const KEYWORD_MAP: Record<
	keyof Omit<PngMetadata, "custom">,
	{ keyword: string; compress: boolean }
> = {
	stgy: { keyword: "stgy", compress: true },
	title: { keyword: "Title", compress: false },
	software: { keyword: "Software", compress: false },
};

/** 逆引きマップ */
const REVERSE_KEYWORD_MAP = Object.fromEntries(
	Object.entries(KEYWORD_MAP).map(([key, { keyword }]) => [keyword, key]),
);

/**
 * iTXtチャンクを作成
 *
 * @param keyword - メタデータキーワード
 * @param text - メタデータ値
 * @param options - オプション（圧縮、言語タグ）
 * @returns PNGチャンクオブジェクト
 */
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

/**
 * PNGバッファにメタデータを埋め込む
 *
 * @param pngBuffer - 元のPNGバッファ
 * @param metadata - 埋め込むメタデータ
 * @returns メタデータが埋め込まれたPNGバッファ
 */
export function embedMetadata(
	pngBuffer: Uint8Array,
	metadata: PngMetadata,
): Uint8Array {
	// 1. PNGからチャンクを抽出
	const chunks = extractChunks(pngBuffer);

	// 2. メタデータをiTXtチャンクに変換
	const textChunks: Array<{ name: string; data: Uint8Array }> = [];

	// 標準キーワード
	for (const [key, config] of Object.entries(KEYWORD_MAP)) {
		const value = metadata[key as keyof typeof KEYWORD_MAP];
		if (value) {
			textChunks.push(
				createItxtChunk(config.keyword, value, { compress: config.compress }),
			);
		}
	}

	// カスタムメタデータ
	if (metadata.custom) {
		for (const [key, value] of Object.entries(metadata.custom)) {
			if (value) {
				textChunks.push(createItxtChunk(key, value));
			}
		}
	}

	// 3. チャンクを挿入（IDATチャンクの前に配置）
	// PNG仕様: tEXt/iTXtはIHDRの後、IDATの前に配置するのが推奨
	const idatIndex = chunks.findIndex((chunk) => chunk.name === "IDAT");
	const insertIndex = idatIndex > 0 ? idatIndex : chunks.length - 1;

	chunks.splice(insertIndex, 0, ...textChunks);

	// 4. PNGバッファを再構築
	return encodeChunks(chunks);
}

/**
 * PNGバッファからメタデータを抽出
 *
 * @param pngBuffer - PNGバッファ
 * @returns 抽出されたメタデータ
 */
export function extractMetadata(pngBuffer: Uint8Array): ExtractedPngMetadata {
	const chunks = extractChunks(pngBuffer);
	const result: ExtractedPngMetadata = {};

	// iTXtチャンクを探してデコード
	for (const chunk of chunks) {
		if (chunk.name === "iTXt") {
			try {
				const decoded = decodeSync(chunk.data);
				// 標準キーワードを正規化
				const normalizedKey =
					REVERSE_KEYWORD_MAP[decoded.keyword] ?? decoded.keyword;
				result[normalizedKey] = decoded.text;
			} catch {
				// デコード失敗時はスキップ
			}
		}
	}

	return result;
}

/**
 * デフォルトメタデータを生成
 *
 * @param stgyCode - stgyコード
 * @param boardName - ボード名（オプション）
 * @returns デフォルトメタデータ
 */
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
