/**
 * stgy フォーマットエンコーダー
 *
 * BoardDataを[stgy:a<key_char><encoded_payload>]形式の文字列にエンコードする
 * (decoder.tsの逆処理)
 */

import pako from "pako";
import { encodeBase64 } from "./base64";
import { encryptCipher } from "./cipher";
import { KEY_CHAR_INDEX, STGY_PREFIX, STGY_SUFFIX } from "./constants";
import { calculateCRC32 } from "./crc32";
import { serializeBoardData } from "./serializer";
import { base64CharToValue, KEY_TABLE } from "./tables";
import type { BoardData } from "./types";

/**
 * KEY_TABLEの逆変換テーブル (Base64値 → キー文字)
 */
const REVERSE_KEY_TABLE: Record<number, string> = Object.fromEntries(
	Object.entries(KEY_TABLE).map(([keyChar, base64Char]) => [
		base64CharToValue(base64Char),
		keyChar,
	]),
);

/**
 * BoardDataをstgy文字列にエンコード
 * @param board ボードデータ
 * @returns [stgy:a...] 形式の文字列
 */
export function encodeStgy(board: BoardData): string {
	// 1. BoardDataをバイナリにシリアライズ
	const binaryData = serializeBoardData(board);

	// 2. zlib圧縮
	const compressedData = pako.deflate(binaryData);

	// 3. 解凍後データ長 (2バイト, Little Endian)
	const decompressedLength = binaryData.length;
	const lengthBytes = new Uint8Array(2);
	lengthBytes[0] = decompressedLength & 0xff;
	lengthBytes[1] = (decompressedLength >> 8) & 0xff;

	// 4. CRC32計算用データ (length + compressed)
	const dataForCRC = new Uint8Array(2 + compressedData.length);
	dataForCRC.set(lengthBytes, 0);
	dataForCRC.set(compressedData, 2);

	// 5. CRC32計算
	const crc32 = calculateCRC32(dataForCRC);

	// 6. 最終バイナリ構築: CRC32(4) + length(2) + compressed
	const finalBinary = new Uint8Array(4 + 2 + compressedData.length);
	// CRC32 (Little Endian)
	finalBinary[0] = crc32 & 0xff;
	finalBinary[1] = (crc32 >> 8) & 0xff;
	finalBinary[2] = (crc32 >> 16) & 0xff;
	finalBinary[3] = (crc32 >> 24) & 0xff;
	// length + compressed
	finalBinary.set(dataForCRC, 4);

	// 7. Base64エンコード
	const base64String = encodeBase64(finalBinary);

	// 8. キー値の決定 (CRC32の最下位バイトの下位6bit)
	// 例: CRC32 = 0x062e241d → 最下位バイト = 0x1d (29) → key = 29 & 0x3F = 29
	const key = crc32 & 0x3f;

	// 9. キー文字を取得
	const keyChar = REVERSE_KEY_TABLE[key];
	if (keyChar === undefined) {
		throw new Error(`Invalid key value: ${key}`);
	}

	// 10. 置換暗号適用
	const encryptedPayload = encryptCipher(base64String, key);

	// 11. 最終文字列構築
	return `${STGY_PREFIX}${keyChar}${encryptedPayload}${STGY_SUFFIX}`;
}

/**
 * stgy文字列からキー値を抽出
 * @param stgyString [stgy:a<key_char>...] 形式の文字列
 * @returns キー値 (0-63)
 */
export function extractKeyFromStgy(stgyString: string): number {
	if (!stgyString.startsWith(STGY_PREFIX)) {
		throw new Error("Invalid stgy string format");
	}
	const keyChar = stgyString[KEY_CHAR_INDEX];
	const mappedChar = KEY_TABLE[keyChar];
	if (!mappedChar) {
		throw new Error(`Invalid key character: ${keyChar}`);
	}
	return base64CharToValue(mappedChar);
}
