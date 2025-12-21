/**
 * サーバーサイドで画像をBase64データURIに変換するユーティリティ
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// 画像キャッシュ（メモリ効率のため）
const imageCache = new Map<string, string>();

/**
 * 画像ディレクトリのパスを取得（開発環境とビルド後の両方に対応）
 */
function getIconsDir(): string {
  // 開発環境: プロジェクトルート/public/icons
  const devPath = join(process.cwd(), "public", "icons");
  if (existsSync(devPath)) {
    return devPath;
  }

  // ビルド後: .output/public/icons または dist/client/icons
  const outputPaths = [
    join(process.cwd(), ".output", "public", "icons"),
    join(process.cwd(), "dist", "client", "icons"),
    // import.meta.urlベースのパス
    join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "public", "icons"),
  ];

  for (const path of outputPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // フォールバック
  return devPath;
}

// キャッシュされたアイコンディレクトリ
let cachedIconsDir: string | null = null;

function getIconPath(objectId: number): string {
  if (!cachedIconsDir) {
    cachedIconsDir = getIconsDir();
  }
  return join(cachedIconsDir, `${objectId}.png`);
}

/**
 * 画像ファイルをBase64データURIとして読み込む
 */
export function loadImageAsDataUri(objectId: number): string | null {
  const cacheKey = `icon-${objectId}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  try {
    const imagePath = getIconPath(objectId);
    const buffer = readFileSync(imagePath);
    const base64 = buffer.toString("base64");
    const dataUri = `data:image/png;base64,${base64}`;

    imageCache.set(cacheKey, dataUri);
    return dataUri;
  } catch (error) {
    console.error(`Failed to load icon ${objectId}:`, error);
    return null;
  }
}

/**
 * 全てのアイコン画像をプリロード
 */
export function preloadAllIcons(objectIds: number[]): void {
  for (const id of objectIds) {
    loadImageAsDataUri(id);
  }
}

