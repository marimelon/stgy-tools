/**
 * フィールドID別パーサー
 */

import { COORDINATE_SCALE, FlagBits } from "../constants";
import type { BackgroundId, ObjectFlags } from "../types";
import { padTo4Bytes } from "../utils";
import type { BinaryReader } from "./BinaryReader";
import type { ParseContext } from "./types";

/** フィールドパーサーの型 */
export type FieldParser = (reader: BinaryReader, context: ParseContext) => void;

/** フラグ値をObjectFlagsに変換 */
function parseFlags(value: number): ObjectFlags {
	return {
		visible: (value & FlagBits.VISIBLE) !== 0,
		flipHorizontal: (value & FlagBits.FLIP_HORIZONTAL) !== 0,
		flipVertical: (value & FlagBits.FLIP_VERTICAL) !== 0,
		locked: (value & FlagBits.LOCKED) !== 0,
	};
}

/** Field 1: ボード名 */
function parseField1(reader: BinaryReader, context: ParseContext): void {
	const stringLength = reader.readUint16();
	// 4バイト境界にパディングされた長さ
	const paddedLength = padTo4Bytes(stringLength);
	context.boardName = reader.readString(paddedLength);
}

/** Field 2: オブジェクトID */
function parseField2(reader: BinaryReader, context: ParseContext): void {
	const objectId = reader.readUint16();
	context.objectIds.push(objectId);
}

/** Field 3: テキスト本文 / 終端マーカー */
function parseField3(reader: BinaryReader, context: ParseContext): void {
	// 終端マーカーは必ず length = 1 (仕様書参照)
	const length = reader.readUint16();
	if (length === 1) {
		// 終端マーカー
		reader.readUint16(); // = 1
		context.backgroundId = reader.readUint16() as BackgroundId;
	} else {
		// テキスト
		const paddedLength = padTo4Bytes(length);
		const text = reader.readString(paddedLength);
		context.texts.push(text);
	}
}

/** Field 4: オブジェクト状態フラグ配列 */
function parseField4(reader: BinaryReader, context: ParseContext): void {
	reader.readUint16(); // type = 1
	const count = reader.readUint16();
	for (let i = 0; i < count; i++) {
		const flags = reader.readUint16();
		context.flagsArray.push(parseFlags(flags));
	}
}

/** Field 5: 座標配列 */
function parseField5(reader: BinaryReader, context: ParseContext): void {
	reader.readUint16(); // type = 3
	const count = reader.readUint16();
	for (let i = 0; i < count; i++) {
		const x = reader.readUint16() / COORDINATE_SCALE; // 1/10ピクセル → ピクセル
		const y = reader.readUint16() / COORDINATE_SCALE;
		context.positions.push({ x, y });
	}
}

/** Field 6: 回転角度配列 */
function parseField6(reader: BinaryReader, context: ParseContext): void {
	reader.readUint16(); // type = 1
	const count = reader.readUint16();
	for (let i = 0; i < count; i++) {
		const rotation = reader.readInt16();
		context.rotations.push(rotation);
	}
}

/** Field 7: サイズ配列 */
function parseField7(reader: BinaryReader, context: ParseContext): void {
	reader.readUint16(); // type = 0
	const count = reader.readUint16();
	for (let i = 0; i < count; i++) {
		const size = reader.readUint8();
		context.sizes.push(size);
	}
	// 2バイト境界にアライン (パディングバイトを保存)
	if (count % 2 === 1) {
		context.sizePaddingByte = reader.readUint8();
	}
}

/** Field 8: 色・透過度配列 */
function parseField8(reader: BinaryReader, context: ParseContext): void {
	reader.readUint16(); // type = 2
	const count = reader.readUint16();
	for (let i = 0; i < count; i++) {
		const r = reader.readUint8();
		const g = reader.readUint8();
		const b = reader.readUint8();
		const opacity = reader.readUint8();
		context.colors.push({ r, g, b, opacity });
	}
}

/** Field 10: 固有パラメータ1 */
function parseField10(reader: BinaryReader, context: ParseContext): void {
	reader.readUint16(); // type = 1
	const count = reader.readUint16();
	for (let i = 0; i < count; i++) {
		context.param1s.push(reader.readUint16());
	}
}

/** Field 11: 固有パラメータ2 */
function parseField11(reader: BinaryReader, context: ParseContext): void {
	reader.readUint16(); // type = 1
	const count = reader.readUint16();
	for (let i = 0; i < count; i++) {
		context.param2s.push(reader.readUint16());
	}
}

/** Field 12: 固有パラメータ3 */
function parseField12(reader: BinaryReader, context: ParseContext): void {
	reader.readUint16(); // type = 1
	const count = reader.readUint16();
	for (let i = 0; i < count; i++) {
		context.param3s.push(reader.readUint16());
	}
}

/** フィールドパーサーマップ */
export const fieldParsers: Readonly<Record<number, FieldParser>> = {
	1: parseField1,
	2: parseField2,
	3: parseField3,
	4: parseField4,
	5: parseField5,
	6: parseField6,
	7: parseField7,
	8: parseField8,
	10: parseField10,
	11: parseField11,
	12: parseField12,
};
