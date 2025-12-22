/**
 * サーバーサイドで画像をBase64データURIとして取得
 * Cloudflare Workers と Node.js の両方に対応
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getGlobalEnv } from "./cloudflareContext";
import { isCloudflareWorkers } from "./runtime";

// Cloudflare Workers の ASSETS binding の型定義
export interface AssetsBinding {
	fetch(request: Request | string): Promise<Response>;
}

// 画像キャッシュ（メモリ効率のため）
const imageCache = new Map<number, string>();

// フォントキャッシュ
let fontCache: Uint8Array | null = null;

/**
 * 画像ファイルをBase64データURIとして取得（キャッシュから）
 */
export function loadImageAsDataUri(objectId: number): string | null {
	return imageCache.get(objectId) ?? null;
}

/**
 * 複数の画像を一括でプリロード
 */
export async function preloadImagesAsync(
	objectIds: number[],
	_assets?: AssetsBinding | undefined,
): Promise<void> {
	const uncachedIds = objectIds.filter((id) => !imageCache.has(id));
	if (uncachedIds.length === 0) return;

	if (isCloudflareWorkers()) {
		await preloadImagesCloudflare(uncachedIds);
	} else {
		await preloadImagesNode(uncachedIds);
	}
}

/**
 * Cloudflare Workers 用: env.ASSETS.fetch() を使用
 */
async function preloadImagesCloudflare(objectIds: number[]): Promise<void> {
	const env = getGlobalEnv();
	const assets = env?.ASSETS;

	if (!assets) {
		console.error("[imageLoader] ASSETS binding is not available");
		return;
	}

	const results = await Promise.all(
		objectIds.map(async (objectId) => {
			try {
				const assetUrl = new URL(
					`/icons/${objectId}.png`,
					"https://assets.local",
				);
				const response = await assets.fetch(new Request(assetUrl));
				if (!response.ok) {
					console.error(
						`[imageLoader] Failed to fetch icon ${objectId}: ${response.status}`,
					);
					return null;
				}
				const arrayBuffer = await response.arrayBuffer();
				const base64 = arrayBufferToBase64(arrayBuffer);
				return { objectId, dataUri: `data:image/png;base64,${base64}` };
			} catch (error) {
				console.error(`[imageLoader] Error loading icon ${objectId}:`, error);
				return null;
			}
		}),
	);

	for (const result of results) {
		if (result) {
			imageCache.set(result.objectId, result.dataUri);
		}
	}
}

/**
 * Node.js 用: fs を使用してファイルを読み込む
 */
async function preloadImagesNode(objectIds: number[]): Promise<void> {
	// Nitroビルド（.output/public）と開発環境（public）の両方に対応
	const possibleDirs = [
		join(process.cwd(), ".output", "public", "icons"),
		join(process.cwd(), "public", "icons"),
	];

	const results = await Promise.all(
		objectIds.map(async (objectId) => {
			for (const iconsDir of possibleDirs) {
				try {
					const filePath = join(iconsDir, `${objectId}.png`);
					const buffer = await readFile(filePath);
					const base64 = buffer.toString("base64");
					return { objectId, dataUri: `data:image/png;base64,${base64}` };
				} catch {
					// このディレクトリでは見つからない、次を試す
					continue;
				}
			}
			console.error(`[imageLoader] Icon ${objectId} not found in any directory`);
			return null;
		}),
	);

	for (const result of results) {
		if (result) {
			imageCache.set(result.objectId, result.dataUri);
		}
	}
}

/**
 * ArrayBuffer を Base64 文字列に変換
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * フォントファイルを読み込む（キャッシュ付き）
 */
export async function loadFont(): Promise<Uint8Array | null> {
	if (fontCache) {
		return fontCache;
	}

	if (isCloudflareWorkers()) {
		return loadFontCloudflare();
	}
	return loadFontNode();
}

/**
 * Cloudflare Workers 用: env.ASSETS.fetch() を使用
 */
async function loadFontCloudflare(): Promise<Uint8Array | null> {
	const env = getGlobalEnv();
	const assets = env?.ASSETS;

	if (!assets) {
		console.error(
			"[imageLoader] ASSETS binding is not available for font loading",
		);
		return null;
	}

	try {
		const assetUrl = new URL(
			"/fonts/NotoSansJP-Regular.ttf",
			"https://assets.local",
		);
		const response = await assets.fetch(new Request(assetUrl));

		if (!response.ok) {
			console.error(`[imageLoader] Failed to load font: ${response.status}`);
			return null;
		}

		const arrayBuffer = await response.arrayBuffer();
		fontCache = new Uint8Array(arrayBuffer);
		return fontCache;
	} catch (error) {
		console.error("[imageLoader] Error loading font:", error);
		return null;
	}
}

/**
 * Node.js 用: fs を使用してフォントを読み込む
 */
async function loadFontNode(): Promise<Uint8Array | null> {
	// Nitroビルド（.output/public）と開発環境（public）の両方に対応
	const possiblePaths = [
		join(process.cwd(), ".output", "public", "fonts", "NotoSansJP-Regular.ttf"),
		join(process.cwd(), "public", "fonts", "NotoSansJP-Regular.ttf"),
	];

	for (const fontPath of possiblePaths) {
		try {
			const buffer = await readFile(fontPath);
			fontCache = new Uint8Array(buffer);
			return fontCache;
		} catch {
			// このパスでは見つからない、次を試す
			continue;
		}
	}
	console.error("[imageLoader] Font not found in any directory");
	return null;
}
