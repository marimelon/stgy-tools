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
