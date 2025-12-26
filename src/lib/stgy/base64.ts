/**
 * URL-safe Base64エンコード/デコードユーティリティ
 * パディングなし
 */

/**
 * Base64エンコード（URL-safe Base64で出力）
 * + → -, / → _ に変換し、パディングを除去
 * @param data バイト配列
 * @returns URL-safe Base64文字列
 */
export function encodeBase64(data: Uint8Array): string {
	// バイナリを文字列に変換
	let binaryString = "";
	for (let i = 0; i < data.length; i++) {
		binaryString += String.fromCharCode(data[i]);
	}
	// 標準Base64エンコード
	const standardBase64 = btoa(binaryString);
	// URL-safe Base64に変換し、パディングを除去
	return standardBase64
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
}

/**
 * Base64デコード（URL-safe Base64対応）
 * - → +, _ → / に変換し、パディングを復元
 * @param base64 URL-safe Base64文字列
 * @returns バイト配列
 */
export function decodeBase64(base64: string): Uint8Array {
	// URL-safe Base64を標準Base64に変換
	const standardBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
	// パディングを復元
	const padded =
		standardBase64 + "=".repeat((4 - (standardBase64.length % 4)) % 4);
	// Base64デコード
	const binaryString = atob(padded);
	// バイト配列に変換
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}
