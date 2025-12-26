/**
 * stgy フォーマットデコーダー
 *
 * [stgy:a<key_char><encoded_payload>] 形式の文字列をデコードし、
 * ボードデータのバイナリを返す
 */

import pako from "pako";
import { decodeBase64 } from "./base64";
import { decryptCipher } from "./cipher";
import { calculateCRC32 } from "./crc32";
import { base64CharToValue, KEY_TABLE } from "./tables";

const STGY_PREFIX = "[stgy:a";
const STGY_SUFFIX = "]";

/**
 * stgy文字列をデコードしてボードデータを返す
 * @param stgyString [stgy:a...] 形式の文字列
 * @returns デコードされたボードデータ
 */
export function decodeStgy(stgyString: string): Uint8Array {
	// 1. プレフィックスとサフィックスを検証・除去
	if (!stgyString.startsWith(STGY_PREFIX)) {
		throw new Error("Invalid stgy string: missing prefix");
	}
	if (!stgyString.endsWith(STGY_SUFFIX)) {
		throw new Error("Invalid stgy string: missing suffix");
	}

	const data = stgyString.slice(STGY_PREFIX.length, -STGY_SUFFIX.length);
	if (data.length < 2) {
		throw new Error("Invalid stgy string: too short");
	}

	// 2. キー文字を取得
	const keyChar = data[0];
	const keyMapped = KEY_TABLE[keyChar];
	if (keyMapped === undefined) {
		throw new Error(`Invalid key character: ${keyChar}`);
	}

	// 3. キー値を計算
	const key = base64CharToValue(keyMapped);

	// 4. ペイロードを置換暗号で復号
	const encodedPayload = data.slice(1);
	const base64String = decryptCipher(encodedPayload, key);

	// 5. Base64デコード
	const binary = decodeBase64(base64String);

	// 6. バイナリ構造を解析
	if (binary.length < 6) {
		throw new Error("Invalid binary: too short");
	}

	// CRC32 (4バイト, Little Endian) - >>> 0 で符号なし32ビット整数に変換
	const storedCRC =
		(binary[0] | (binary[1] << 8) | (binary[2] << 16) | (binary[3] << 24)) >>>
		0;

	// 解凍後データ長 (2バイト, Little Endian)
	const decompressedLength = binary[4] | (binary[5] << 8);

	// 圧縮データ
	const compressedData = binary.slice(6);

	// 7. CRC32検証
	const calculatedCRC = calculateCRC32(binary.slice(4));
	if (storedCRC !== calculatedCRC) {
		throw new Error(
			`CRC32 mismatch: stored=${storedCRC.toString(16)}, calculated=${calculatedCRC.toString(16)}`,
		);
	}

	// 8. zlib解凍
	const decompressed = pako.inflate(compressedData);

	// 9. 解凍後データ長を検証
	if (decompressed.length !== decompressedLength) {
		throw new Error(
			`Decompressed length mismatch: expected=${decompressedLength}, actual=${decompressed.length}`,
		);
	}

	return decompressed;
}

/**
 * デコード結果の情報を含むオブジェクト
 */
export interface DecodeResult {
	data: Uint8Array;
	decompressedLength: number;
	compressedLength: number;
}

/**
 * stgy文字列をデコードして詳細情報を返す
 */
export function decodeStgyWithInfo(stgyString: string): DecodeResult {
	const data = decodeStgy(stgyString);

	// 再度バイナリを取得して圧縮長を計算
	const stgyData = stgyString.slice(STGY_PREFIX.length, -STGY_SUFFIX.length);
	const keyChar = stgyData[0];
	const keyMapped = KEY_TABLE[keyChar];
	if (!keyMapped) {
		throw new Error(`Invalid key character: ${keyChar}`);
	}
	const key = base64CharToValue(keyMapped);
	const base64String = decryptCipher(stgyData.slice(1), key);
	const binary = decodeBase64(base64String);

	return {
		data,
		decompressedLength: data.length,
		compressedLength: binary.length - 6,
	};
}
