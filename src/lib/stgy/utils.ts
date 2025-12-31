/**
 * STGY形式のユーティリティ関数
 */

import { BYTE_ALIGNMENT_2, BYTE_ALIGNMENT_4 } from "./constants";

/**
 * 4バイト境界にパディングした長さを返す
 */
export function padTo4Bytes(length: number): number {
	return Math.ceil(length / BYTE_ALIGNMENT_4) * BYTE_ALIGNMENT_4;
}

/**
 * 2バイト境界にパディングした長さを返す
 */
export function padTo2Bytes(length: number): number {
	return Math.ceil(length / BYTE_ALIGNMENT_2) * BYTE_ALIGNMENT_2;
}

/**
 * 4バイト境界のパディングバイト数を返す
 */
export function getPadding4(length: number): number {
	const remainder = length % BYTE_ALIGNMENT_4;
	return remainder === 0 ? 0 : BYTE_ALIGNMENT_4 - remainder;
}

/**
 * 2バイト境界のパディングバイト数を返す
 */
export function getPadding2(length: number): number {
	return length % BYTE_ALIGNMENT_2;
}

/**
 * UTF-8文字列のバイト数を返す
 */
export function getUtf8ByteLength(str: string): number {
	return new TextEncoder().encode(str).length;
}

/**
 * UTF-8で指定バイト数以下になるように文字列を切り詰める
 * マルチバイト文字の途中で切れないように、文字単位で処理する
 */
export function truncateToUtf8Bytes(str: string, maxBytes: number): string {
	const encoder = new TextEncoder();
	const totalBytes = encoder.encode(str).length;
	if (totalBytes <= maxBytes) {
		return str;
	}

	// 文字単位で切り詰め（マルチバイト文字の途中で切れないように）
	let result = "";
	let currentBytes = 0;
	for (const char of str) {
		const charBytes = encoder.encode(char).length;
		if (currentBytes + charBytes > maxBytes) {
			break;
		}
		result += char;
		currentBytes += charBytes;
	}
	return result;
}
