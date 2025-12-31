/**
 * stgy デバッグユーティリティ
 *
 * バイナリデータのフィールド解析や比較機能を提供
 */

import pako from "pako";
import { decodeBase64 } from "./base64";
import { decryptCipher } from "./cipher";
import {
	COMPRESSED_DATA_OFFSET,
	FlagBits,
	MIN_STGY_PAYLOAD_LENGTH,
	STGY_PREFIX,
	STGY_SUFFIX,
} from "./constants";
import { calculateCRC32 } from "./crc32";
import { base64CharToValue, KEY_TABLE } from "./tables";
import { padTo4Bytes } from "./utils";

/**
 * フィールド情報
 */
export interface FieldInfo {
	offset: number;
	fieldId: number;
	fieldName: string;
	rawData: Uint8Array;
	parsedValue: unknown;
	description: string;
}

/**
 * デコード詳細情報
 */
export interface DecodeDebugInfo {
	key: number;
	keyChar: string;
	base64Payload: string;
	prefixedBinary: Uint8Array;
	crc32Stored: number;
	crc32Calculated: number;
	decompressedLength: number;
	compressedData: Uint8Array;
	decompressedData: Uint8Array;
	fields: FieldInfo[];
	header: {
		version: number;
		/** StrategyBoard.length (ヘッダー後のコンテンツ長) */
		contentLength: number;
		/** SectionContent.length */
		sectionContentLength: number;
	};
}

/**
 * 比較結果
 */
export interface CompareResult {
	match: boolean;
	originalKey: number;
	reEncodedKey: number;
	binaryMatch: boolean;
	binaryDiff: Array<{
		offset: number;
		original: number;
		reEncoded: number;
	}>;
}

/**
 * フィールドIDからフィールド名を取得
 */
function getFieldName(fieldId: number): string {
	const names: Record<number, string> = {
		1: "boardName",
		2: "objectId",
		3: "text/terminator",
		4: "flags",
		5: "positions",
		6: "rotations",
		7: "sizes",
		8: "colors",
		10: "param1",
		11: "param2",
		12: "param3",
	};
	return names[fieldId] ?? `unknown(${fieldId})`;
}

/**
 * フラグをパース
 */
function parseFlags(value: number): Record<string, boolean> {
	return {
		visible: (value & FlagBits.VISIBLE) !== 0,
		flipHorizontal: (value & FlagBits.FLIP_HORIZONTAL) !== 0,
		flipVertical: (value & FlagBits.FLIP_VERTICAL) !== 0,
		locked: (value & FlagBits.LOCKED) !== 0,
	};
}

/**
 * フィールドを解析
 */
function parseFields(data: Uint8Array): FieldInfo[] {
	const fields: FieldInfo[] = [];
	// ヘッダー(16) + セクションヘッダー(4) = 20バイトスキップ
	let offset = 20;

	while (offset + 4 <= data.length) {
		const fieldId = data[offset] | (data[offset + 1] << 8);
		const startOffset = offset;

		let rawData: Uint8Array;
		let parsedValue: unknown;
		let description: string;

		switch (fieldId) {
			case 1: {
				// ボード名
				const stringLength = data[offset + 2] | (data[offset + 3] << 8);
				const paddedLength = padTo4Bytes(stringLength);
				rawData = data.slice(offset, offset + 4 + paddedLength);
				const textBytes = data.slice(offset + 4, offset + 4 + stringLength);
				let end = Array.from(textBytes).indexOf(0);
				if (end === -1) end = textBytes.length;
				parsedValue = new TextDecoder().decode(textBytes.slice(0, end));
				description = `Board name: "${parsedValue}" (length=${stringLength}, padded=${paddedLength})`;
				offset += 4 + paddedLength;
				break;
			}

			case 2: {
				// オブジェクトID
				const objectId = data[offset + 2] | (data[offset + 3] << 8);
				rawData = data.slice(offset, offset + 4);
				parsedValue = objectId;
				description = `Object ID: ${objectId}`;
				offset += 4;
				break;
			}

			case 3: {
				// テキスト/終端マーカー
				const length = data[offset + 2] | (data[offset + 3] << 8);
				if (length > 8) {
					// テキスト
					const paddedLength = padTo4Bytes(length);
					rawData = data.slice(offset, offset + 4 + paddedLength);
					const textBytes = data.slice(offset + 4, offset + 4 + length);
					let end = Array.from(textBytes).indexOf(0);
					if (end === -1) end = textBytes.length;
					parsedValue = new TextDecoder().decode(textBytes.slice(0, end));
					description = `Text: "${parsedValue}" (length=${length}, padded=${paddedLength})`;
					offset += 4 + paddedLength;
				} else {
					// 終端マーカー
					rawData = data.slice(offset, offset + 8);
					const value1 = data[offset + 4] | (data[offset + 5] << 8);
					const backgroundId = data[offset + 6] | (data[offset + 7] << 8);
					parsedValue = { value1, backgroundId };
					description = `Terminator (length=${length}, value1=${value1}, backgroundId=${backgroundId})`;
					offset += 8;
				}
				break;
			}

			case 4: {
				// フラグ配列
				const type = data[offset + 2] | (data[offset + 3] << 8);
				const count = data[offset + 4] | (data[offset + 5] << 8);
				rawData = data.slice(offset, offset + 6 + count * 2);
				const flags = [];
				for (let i = 0; i < count; i++) {
					const flagValue =
						data[offset + 6 + i * 2] | (data[offset + 6 + i * 2 + 1] << 8);
					flags.push(parseFlags(flagValue));
				}
				parsedValue = flags;
				description = `Flags: type=${type}, count=${count}`;
				offset += 6 + count * 2;
				break;
			}

			case 5: {
				// 座標配列
				const type = data[offset + 2] | (data[offset + 3] << 8);
				const count = data[offset + 4] | (data[offset + 5] << 8);
				rawData = data.slice(offset, offset + 6 + count * 4);
				const positions = [];
				for (let i = 0; i < count; i++) {
					const x =
						(data[offset + 6 + i * 4] | (data[offset + 6 + i * 4 + 1] << 8)) /
						10;
					const y =
						(data[offset + 6 + i * 4 + 2] |
							(data[offset + 6 + i * 4 + 3] << 8)) /
						10;
					positions.push({ x, y });
				}
				parsedValue = positions;
				description = `Positions: type=${type}, count=${count}`;
				offset += 6 + count * 4;
				break;
			}

			case 6: {
				// 回転角度配列
				const type = data[offset + 2] | (data[offset + 3] << 8);
				const count = data[offset + 4] | (data[offset + 5] << 8);
				rawData = data.slice(offset, offset + 6 + count * 2);
				const rotations = [];
				for (let i = 0; i < count; i++) {
					const val =
						data[offset + 6 + i * 2] | (data[offset + 6 + i * 2 + 1] << 8);
					rotations.push(val > 32767 ? val - 65536 : val);
				}
				parsedValue = rotations;
				description = `Rotations: type=${type}, count=${count}`;
				offset += 6 + count * 2;
				break;
			}

			case 7: {
				// サイズ配列
				const type = data[offset + 2] | (data[offset + 3] << 8);
				const count = data[offset + 4] | (data[offset + 5] << 8);
				const dataLength = count + (count % 2); // 2バイト境界
				rawData = data.slice(offset, offset + 6 + dataLength);
				const sizes = [];
				for (let i = 0; i < count; i++) {
					sizes.push(data[offset + 6 + i]);
				}
				parsedValue = sizes;
				description = `Sizes: type=${type}, count=${count}`;
				offset += 6 + dataLength;
				break;
			}

			case 8: {
				// 色配列
				const type = data[offset + 2] | (data[offset + 3] << 8);
				const count = data[offset + 4] | (data[offset + 5] << 8);
				rawData = data.slice(offset, offset + 6 + count * 4);
				const colors = [];
				for (let i = 0; i < count; i++) {
					colors.push({
						r: data[offset + 6 + i * 4],
						g: data[offset + 6 + i * 4 + 1],
						b: data[offset + 6 + i * 4 + 2],
						opacity: data[offset + 6 + i * 4 + 3],
					});
				}
				parsedValue = colors;
				description = `Colors: type=${type}, count=${count}`;
				offset += 6 + count * 4;
				break;
			}

			case 10:
			case 11:
			case 12: {
				// パラメータ配列
				const type = data[offset + 2] | (data[offset + 3] << 8);
				const count = data[offset + 4] | (data[offset + 5] << 8);
				rawData = data.slice(offset, offset + 6 + count * 2);
				const params = [];
				for (let i = 0; i < count; i++) {
					params.push(
						data[offset + 6 + i * 2] | (data[offset + 6 + i * 2 + 1] << 8),
					);
				}
				parsedValue = params;
				description = `Param${fieldId - 9}: type=${type}, count=${count}`;
				offset += 6 + count * 2;
				break;
			}

			default: {
				// 未知のフィールド
				rawData = data.slice(offset, offset + 4);
				parsedValue = null;
				description = `Unknown field ID: ${fieldId}`;
				offset += 4;
				break;
			}
		}

		fields.push({
			offset: startOffset,
			fieldId,
			fieldName: getFieldName(fieldId),
			rawData,
			parsedValue,
			description,
		});
	}

	return fields;
}

/**
 * stgy文字列をデバッグ情報付きでデコード
 */
export function decodeStgyDebug(stgyString: string): DecodeDebugInfo {
	if (!stgyString.startsWith(STGY_PREFIX)) {
		throw new Error("Invalid stgy string: missing prefix");
	}
	if (!stgyString.endsWith(STGY_SUFFIX)) {
		throw new Error("Invalid stgy string: missing suffix");
	}

	const payload = stgyString.slice(STGY_PREFIX.length, -STGY_SUFFIX.length);
	if (payload.length < MIN_STGY_PAYLOAD_LENGTH) {
		throw new Error("Invalid stgy string: too short");
	}

	// キー抽出
	const keyChar = payload[0];
	const keyMapped = KEY_TABLE[keyChar];
	if (keyMapped === undefined) {
		throw new Error(`Invalid key character: ${keyChar}`);
	}
	const key = base64CharToValue(keyMapped);

	// 復号
	const encodedPayload = payload.slice(1);
	const base64Payload = decryptCipher(encodedPayload, key);

	// Base64デコード
	const prefixedBinary = decodeBase64(base64Payload);

	// バイナリ解析
	const crc32Stored =
		(prefixedBinary[0] |
			(prefixedBinary[1] << 8) |
			(prefixedBinary[2] << 16) |
			(prefixedBinary[3] << 24)) >>>
		0;
	const decompressedLength = prefixedBinary[4] | (prefixedBinary[5] << 8);
	const compressedData = prefixedBinary.slice(COMPRESSED_DATA_OFFSET);
	const crc32Calculated = calculateCRC32(prefixedBinary.slice(4));

	// 解凍
	const decompressedData = pako.inflate(compressedData);

	// ヘッダー解析 (xivdev仕様準拠)
	// - 0x00-0x03: version (u32)
	// - 0x04-0x07: StrategyBoard.length (u32) - ヘッダー後のコンテンツ長
	// - 0x08-0x0F: padding (8バイト)
	// - 0x10-0x11: SectionType (u16)
	// - 0x12-0x13: SectionContent.length (u16)
	const header = {
		version:
			decompressedData[0] |
			(decompressedData[1] << 8) |
			(decompressedData[2] << 16) |
			(decompressedData[3] << 24),
		contentLength:
			decompressedData[4] |
			(decompressedData[5] << 8) |
			(decompressedData[6] << 16) |
			(decompressedData[7] << 24),
		sectionContentLength: decompressedData[18] | (decompressedData[19] << 8),
	};

	// フィールド解析
	const fields = parseFields(decompressedData);

	return {
		key,
		keyChar,
		base64Payload,
		prefixedBinary,
		crc32Stored,
		crc32Calculated,
		decompressedLength,
		compressedData,
		decompressedData,
		fields,
		header,
	};
}

/**
 * 2つのstgyコードを比較
 */
export function compareStgy(
	original: string,
	reEncoded: string,
): CompareResult {
	const match = original === reEncoded;

	let originalKey = -1;
	let reEncodedKey = -1;
	let binaryMatch = false;
	const binaryDiff: CompareResult["binaryDiff"] = [];

	try {
		const originalInfo = decodeStgyDebug(original);
		const reEncodedInfo = decodeStgyDebug(reEncoded);

		originalKey = originalInfo.key;
		reEncodedKey = reEncodedInfo.key;

		const origBinary = originalInfo.decompressedData;
		const reEncBinary = reEncodedInfo.decompressedData;

		binaryMatch =
			origBinary.length === reEncBinary.length &&
			origBinary.every((b, i) => b === reEncBinary[i]);

		if (!binaryMatch) {
			const maxLen = Math.max(origBinary.length, reEncBinary.length);
			for (let i = 0; i < maxLen; i++) {
				const origByte = origBinary[i] ?? -1;
				const reEncByte = reEncBinary[i] ?? -1;
				if (origByte !== reEncByte) {
					binaryDiff.push({
						offset: i,
						original: origByte,
						reEncoded: reEncByte,
					});
				}
			}
		}
	} catch {
		// 比較失敗
	}

	return {
		match,
		originalKey,
		reEncodedKey,
		binaryMatch,
		binaryDiff,
	};
}

/**
 * バイナリデータを16進ダンプ形式の文字列に変換
 */
export function hexDump(data: Uint8Array, bytesPerLine = 16): string {
	const lines: string[] = [];

	for (let offset = 0; offset < data.length; offset += bytesPerLine) {
		const bytes = data.slice(offset, offset + bytesPerLine);
		const hex = Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join(" ");
		const ascii = Array.from(bytes)
			.map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : "."))
			.join("");

		lines.push(
			`${offset.toString(16).padStart(8, "0")}  ${hex.padEnd(bytesPerLine * 3 - 1)}  |${ascii}|`,
		);
	}

	return lines.join("\n");
}
