/**
 * 置換暗号（Substitution Cipher）
 */

import { ALPHABET_TABLE, base64CharToValue, valueToBase64Char } from "./tables";

/**
 * ALPHABET_TABLEの逆変換テーブル (標準Base64文字 → カスタム文字)
 */
const REVERSE_ALPHABET_TABLE: Record<string, string> = Object.fromEntries(
	Object.entries(ALPHABET_TABLE).map(([k, v]) => [v, k]),
);

/**
 * 置換暗号をエンコード
 * @param base64String 標準Base64文字列
 * @param key キー値 (0-63)
 * @returns エンコードされた文字列
 */
export function encryptCipher(base64String: string, key: number): string {
	let result = "";
	for (let i = 0; i < base64String.length; i++) {
		const inputChar = base64String[i];
		// Base64値を取得
		const val = base64CharToValue(inputChar);
		// エンコード: (val + i + key) & 0x3F
		const encodedVal = (val + i + key) & 0x3f;
		// Base64文字に変換
		const standardChar = valueToBase64Char(encodedVal);
		// REVERSE_ALPHABET_TABLEでカスタム文字に変換
		const outputChar = REVERSE_ALPHABET_TABLE[standardChar];
		if (outputChar === undefined) {
			throw new Error(`Failed to encode character: ${standardChar}`);
		}
		result += outputChar;
	}
	return result;
}

/**
 * 置換暗号をデコード
 * @param encoded エンコードされた文字列
 * @param key キー値 (0-63)
 * @returns 標準Base64文字列
 */
export function decryptCipher(encoded: string, key: number): string {
	let result = "";
	for (let i = 0; i < encoded.length; i++) {
		const inputChar = encoded[i];
		// ALPHABET_TABLEで変換
		const standardChar = ALPHABET_TABLE[inputChar];
		if (standardChar === undefined) {
			throw new Error(`Unknown character in payload: ${inputChar}`);
		}
		// Base64値を取得
		const val = base64CharToValue(standardChar);
		// デコード: (val - i - key) & 0x3F
		const decodedVal = (val - i - key) & 0x3f;
		// Base64文字に戻す
		result += valueToBase64Char(decodedVal);
	}
	return result;
}
