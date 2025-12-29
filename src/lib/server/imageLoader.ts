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

// 背景画像キャッシュ
const backgroundCache = new Map<number, string>();

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
 * icons-hr/ を優先し、なければ icons/ にフォールバック
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
			// HR版を優先、なければ通常版にフォールバック
			const iconPaths = [`/icons-hr/${objectId}.png`, `/icons/${objectId}.png`];

			for (const iconPath of iconPaths) {
				try {
					const assetUrl = new URL(iconPath, "https://assets.local");
					const response = await assets.fetch(new Request(assetUrl));
					if (response.ok) {
						const arrayBuffer = await response.arrayBuffer();
						const base64 = arrayBufferToBase64(arrayBuffer);
						return { objectId, dataUri: `data:image/png;base64,${base64}` };
					}
				} catch {
					// このパスでは見つからない、次を試す
				}
			}
			console.error(`[imageLoader] Icon ${objectId} not found`);
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
 * Node.js 用: fs を使用してファイルを読み込む
 * icons-hr/ を優先し、なければ icons/ にフォールバック
 */
async function preloadImagesNode(objectIds: number[]): Promise<void> {
	// Nitroビルド（.output/public）と開発環境（public）の両方に対応
	// HR版を優先、なければ通常版にフォールバック
	const possibleDirs = [
		join(process.cwd(), ".output", "public", "icons-hr"),
		join(process.cwd(), "public", "icons-hr"),
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
				}
			}
			console.error(
				`[imageLoader] Icon ${objectId} not found in any directory`,
			);
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
 * 背景画像をBase64データURIとして取得
 */
export async function loadBackgroundImage(
	backgroundId: number,
): Promise<string | null> {
	// 既にキャッシュにあれば返す
	const cached = backgroundCache.get(backgroundId);
	if (cached) return cached;

	// 1-7 が有効範囲
	if (backgroundId < 1 || backgroundId > 7) {
		return null;
	}

	if (isCloudflareWorkers()) {
		return loadBackgroundCloudflare(backgroundId);
	}
	return loadBackgroundNode(backgroundId);
}

/**
 * Cloudflare Workers 用: 背景画像読み込み
 * backgrounds-hr/ を優先し、なければ backgrounds/ にフォールバック
 */
async function loadBackgroundCloudflare(
	backgroundId: number,
): Promise<string | null> {
	const env = getGlobalEnv();
	const assets = env?.ASSETS;

	if (!assets) {
		console.error("[imageLoader] ASSETS binding is not available");
		return null;
	}

	// HR版を優先、なければ通常版にフォールバック
	const bgPaths = [
		`/backgrounds-hr/${backgroundId}.png`,
		`/backgrounds/${backgroundId}.png`,
	];

	for (const bgPath of bgPaths) {
		try {
			const assetUrl = new URL(bgPath, "https://assets.local");
			const response = await assets.fetch(new Request(assetUrl));
			if (response.ok) {
				const arrayBuffer = await response.arrayBuffer();
				const base64 = arrayBufferToBase64(arrayBuffer);
				const dataUri = `data:image/png;base64,${base64}`;
				backgroundCache.set(backgroundId, dataUri);
				return dataUri;
			}
		} catch {
			// このパスでは見つからない、次を試す
		}
	}

	console.error(`[imageLoader] Background ${backgroundId} not found`);
	return null;
}

/**
 * Node.js 用: 背景画像読み込み
 * backgrounds-hr/ を優先し、なければ backgrounds/ にフォールバック
 */
async function loadBackgroundNode(
	backgroundId: number,
): Promise<string | null> {
	// Nitroビルド（.output/public）と開発環境（public）の両方に対応
	// HR版を優先、なければ通常版にフォールバック
	const possibleDirs = [
		join(process.cwd(), ".output", "public", "backgrounds-hr"),
		join(process.cwd(), "public", "backgrounds-hr"),
		join(process.cwd(), ".output", "public", "backgrounds"),
		join(process.cwd(), "public", "backgrounds"),
	];

	for (const dir of possibleDirs) {
		try {
			const filePath = join(dir, `${backgroundId}.png`);
			const buffer = await readFile(filePath);
			const base64 = buffer.toString("base64");
			const dataUri = `data:image/png;base64,${base64}`;
			backgroundCache.set(backgroundId, dataUri);
			return dataUri;
		} catch {
			// このディレクトリでは見つからない、次を試す
		}
	}

	console.error(
		`[imageLoader] Background ${backgroundId} not found in any directory`,
	);
	return null;
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
 * サブセット化されたフォント（190KB）を優先的に使用
 */
async function loadFontCloudflare(): Promise<Uint8Array | null> {
	const env = getGlobalEnv();
	const assets = env?.ASSETS;

	if (!assets) {
		return null;
	}

	// サブセット版を優先、なければフル版にフォールバック
	const fontPaths = [
		"/fonts/NotoSansJP-Subset.ttf",
		"/fonts/NotoSansJP-Regular.ttf",
	];

	for (const fontPath of fontPaths) {
		try {
			const assetUrl = new URL(fontPath, "https://assets.local");
			const response = await assets.fetch(new Request(assetUrl));

			if (response.ok) {
				const arrayBuffer = await response.arrayBuffer();
				fontCache = new Uint8Array(arrayBuffer);
				return fontCache;
			}
		} catch {
			// このベースURLでは見つからない、次を試す
		}
	}

	return null;
}

/**
 * Node.js 用: fs を使用してフォントを読み込む
 * サブセット化されたフォント（190KB）を優先的に使用
 */
async function loadFontNode(): Promise<Uint8Array | null> {
	// サブセット版を優先、なければフル版にフォールバック
	const fontFiles = ["NotoSansJP-Subset.ttf", "NotoSansJP-Regular.ttf"];
	const baseDirs = [
		join(process.cwd(), ".output", "public", "fonts"),
		join(process.cwd(), "public", "fonts"),
	];

	for (const fontFile of fontFiles) {
		for (const baseDir of baseDirs) {
			try {
				const fontPath = join(baseDir, fontFile);
				const buffer = await readFile(fontPath);
				fontCache = new Uint8Array(buffer);
				return fontCache;
			} catch {
				// このパスでは見つからない、次を試す
			}
		}
	}

	return null;
}
