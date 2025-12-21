/**
 * stgy フォーマットデコーダー
 *
 * [stgy:a<key_char><encoded_payload>] 形式の文字列をデコードし、
 * ボードデータのバイナリを返す
 */

import pako from "pako";
import {
  ALPHABET_TABLE,
  KEY_TABLE,
  base64CharToValue,
  valueToBase64Char,
} from "./tables";

const STGY_PREFIX = "[stgy:a";
const STGY_SUFFIX = "]";

/**
 * CRC32計算用テーブル
 */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

/**
 * CRC32を計算
 */
function calculateCRC32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * 置換暗号をデコード
 * @param encoded エンコードされた文字列
 * @param key キー値 (0-63)
 * @returns 標準Base64文字列
 */
function decryptCipher(encoded: string, key: number): string {
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

/**
 * Base64デコード（URL-safe Base64対応）
 * - → +, _ → / に変換してからデコード
 */
function decodeBase64(base64: string): Uint8Array {
  // URL-safe Base64を標準Base64に変換
  const standardBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
  // パディングを追加
  const padded =
    standardBase64 + "=".repeat((4 - (standardBase64.length % 4)) % 4);
  // デコード
  const binaryString = atob(padded);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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
      `CRC32 mismatch: stored=${storedCRC.toString(16)}, calculated=${calculatedCRC.toString(16)}`
    );
  }

  // 8. zlib解凍
  const decompressed = pako.inflate(compressedData);

  // 9. 解凍後データ長を検証
  if (decompressed.length !== decompressedLength) {
    throw new Error(
      `Decompressed length mismatch: expected=${decompressedLength}, actual=${decompressed.length}`
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
