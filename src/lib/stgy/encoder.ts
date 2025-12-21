/**
 * stgy フォーマットエンコーダー
 *
 * BoardDataを[stgy:a<key_char><encoded_payload>]形式の文字列にエンコードする
 * (decoder.tsの逆処理)
 */

import pako from "pako";
import type { BoardData } from "./types";
import { serializeBoardData } from "./serializer";
import {
  ALPHABET_TABLE,
  KEY_TABLE,
  base64CharToValue,
  valueToBase64Char,
} from "./tables";

const STGY_PREFIX = "[stgy:a";
const STGY_SUFFIX = "]";

/**
 * ALPHABET_TABLEの逆変換テーブル (標準Base64文字 → カスタム文字)
 */
const REVERSE_ALPHABET_TABLE: Record<string, string> = Object.fromEntries(
  Object.entries(ALPHABET_TABLE).map(([k, v]) => [v, k])
);

/**
 * KEY_TABLEの逆変換テーブル (Base64値 → キー文字)
 */
const REVERSE_KEY_TABLE: Record<number, string> = Object.fromEntries(
  Object.entries(KEY_TABLE).map(([keyChar, base64Char]) => [
    base64CharToValue(base64Char),
    keyChar,
  ])
);

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
 * 置換暗号をエンコード
 * @param base64String 標準Base64文字列
 * @param key キー値 (0-63)
 * @returns エンコードされた文字列
 */
function encryptCipher(base64String: string, key: number): string {
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
    const customChar = REVERSE_ALPHABET_TABLE[standardChar];
    if (customChar === undefined) {
      throw new Error(`Cannot encode character: ${standardChar}`);
    }
    result += customChar;
  }
  return result;
}

/**
 * Base64エンコード（URL-safe Base64で出力）
 * + → -, / → _ に変換し、パディングを除去
 */
function encodeBase64(data: Uint8Array): string {
  // バイナリを文字列に変換
  let binaryString = "";
  for (let i = 0; i < data.length; i++) {
    binaryString += String.fromCharCode(data[i]);
  }
  // 標準Base64エンコード
  const standardBase64 = btoa(binaryString);
  // URL-safe Base64に変換し、パディングを除去
  return standardBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * エンコードオプション
 */
export interface EncodeOptions {
  /** 暗号化キー (0-63)。未指定の場合はランダム */
  key?: number;
}

/**
 * BoardDataをstgy文字列にエンコード
 * @param board ボードデータ
 * @param options エンコードオプション
 * @returns [stgy:a...] 形式の文字列
 */
export function encodeStgy(board: BoardData, options?: EncodeOptions): string {
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

  // 8. キー値の決定 (指定されていればそれを使用、なければランダム)
  const key = options?.key !== undefined
    ? Math.max(0, Math.min(63, options.key))
    : Math.floor(Math.random() * 64);

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
  const keyChar = stgyString[7];
  const mappedChar = KEY_TABLE[keyChar];
  if (!mappedChar) {
    throw new Error(`Invalid key character: ${keyChar}`);
  }
  return base64CharToValue(mappedChar);
}
