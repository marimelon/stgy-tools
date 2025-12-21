/**
 * 色変換ユーティリティ
 */

/**
 * RGB値をHex文字列に変換
 * @param r - 赤 (0-255)
 * @param g - 緑 (0-255)
 * @param b - 青 (0-255)
 * @returns Hex文字列 (例: "#ff0000")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Hex文字列をRGB値に変換
 * @param hex - Hex文字列 (例: "#ff0000" または "ff0000")
 * @returns RGB値オブジェクト
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}
