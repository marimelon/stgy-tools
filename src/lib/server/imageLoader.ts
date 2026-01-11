/**
 * Server-side image loading as Base64 data URIs
 * Supports both Cloudflare Workers and Node.js
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getGlobalEnv } from "./cloudflareContext";
import { isCloudflareWorkers } from "./runtime";

export interface AssetsBinding {
	fetch(request: Request | string): Promise<Response>;
}

const imageCache = new Map<number, string>();
const backgroundCache = new Map<number, string>();
let fontCache: Uint8Array | null = null;

export function loadImageAsDataUri(objectId: number): string | null {
	return imageCache.get(objectId) ?? null;
}

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
 * Cloudflare Workers: uses env.ASSETS.fetch()
 * Prefers icons-hr/, falls back to icons/
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
			// Prefer HR version, fallback to standard
			const iconPaths = [
				`/assets/icons-hr/${objectId}.png`,
				`/assets/icons/${objectId}.png`,
			];

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
					// Not found at this path, try next
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
 * Node.js: uses fs to read files
 * Prefers icons-hr/, falls back to icons/
 */
async function preloadImagesNode(objectIds: number[]): Promise<void> {
	// Supports both Nitro build (.output/public) and dev environment (public)
	// Prefers HR version, falls back to standard
	const possibleDirs = [
		join(process.cwd(), ".output", "public", "assets", "icons-hr"),
		join(process.cwd(), "public", "assets", "icons-hr"),
		join(process.cwd(), ".output", "public", "assets", "icons"),
		join(process.cwd(), "public", "assets", "icons"),
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
					// Not found in this directory, try next
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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

export async function loadBackgroundImage(
	backgroundId: number,
): Promise<string | null> {
	const cached = backgroundCache.get(backgroundId);
	if (cached) return cached;

	// Valid range: 1-7
	if (backgroundId < 1 || backgroundId > 7) {
		return null;
	}

	if (isCloudflareWorkers()) {
		return loadBackgroundCloudflare(backgroundId);
	}
	return loadBackgroundNode(backgroundId);
}

/**
 * Cloudflare Workers: prefers backgrounds-hr/, falls back to backgrounds/
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

	// Prefer HR version, fallback to standard
	const bgPaths = [
		`/assets/backgrounds-hr/${backgroundId}.png`,
		`/assets/backgrounds/${backgroundId}.png`,
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
			// Not found at this path, try next
		}
	}

	console.error(`[imageLoader] Background ${backgroundId} not found`);
	return null;
}

/**
 * Node.js: prefers backgrounds-hr/, falls back to backgrounds/
 */
async function loadBackgroundNode(
	backgroundId: number,
): Promise<string | null> {
	// Supports both Nitro build (.output/public) and dev environment (public)
	// Prefers HR version, falls back to standard
	const possibleDirs = [
		join(process.cwd(), ".output", "public", "assets", "backgrounds-hr"),
		join(process.cwd(), "public", "assets", "backgrounds-hr"),
		join(process.cwd(), ".output", "public", "assets", "backgrounds"),
		join(process.cwd(), "public", "assets", "backgrounds"),
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
			// Not found in this directory, try next
		}
	}

	console.error(
		`[imageLoader] Background ${backgroundId} not found in any directory`,
	);
	return null;
}

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
 * Cloudflare Workers: prefers subset font (190KB)
 */
async function loadFontCloudflare(): Promise<Uint8Array | null> {
	const env = getGlobalEnv();
	const assets = env?.ASSETS;

	if (!assets) {
		return null;
	}

	// Prefer subset font, fallback to full font
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
			// Not found at this base URL, try next
		}
	}

	return null;
}

/**
 * Node.js: prefers subset font (190KB)
 */
async function loadFontNode(): Promise<Uint8Array | null> {
	// Prefer subset font, fallback to full font
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
				// Not found at this path, try next
			}
		}
	}

	return null;
}
