/**
 * CRC32計算ユーティリティ
 */

import {
	CRC32_FINAL_XOR,
	CRC32_INITIAL_VALUE,
	CRC32_POLYNOMIAL,
} from "./constants";

/**
 * CRC32計算用テーブル
 */
const CRC32_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let j = 0; j < 8; j++) {
			c = c & 1 ? CRC32_POLYNOMIAL ^ (c >>> 1) : c >>> 1;
		}
		table[i] = c;
	}
	return table;
})();

/**
 * CRC32を計算
 * @param data バイト配列
 * @returns CRC32チェックサム
 */
export function calculateCRC32(data: Uint8Array): number {
	let crc = CRC32_INITIAL_VALUE;
	for (let i = 0; i < data.length; i++) {
		crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
	}
	return (crc ^ CRC32_FINAL_XOR) >>> 0;
}
