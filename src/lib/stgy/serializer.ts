/**
 * stgy バイナリシリアライザー
 *
 * BoardDataをバイナリデータにシリアライズする (parser.tsの逆処理)
 *
 * バイナリフォーマット (xivdev仕様準拠):
 * - StrategyBoard ヘッダー (16バイト):
 *   - 0x00-0x03: tag (u32) - バージョン
 *   - 0x04-0x07: length (u32) - ヘッダー後のコンテンツ長
 *   - 0x08-0x0F: padding (8バイト)
 * - Sections (0x10以降):
 *   - Content section: SectionType(0x00) + length + TypeContainers
 *   - Background section: SectionType(0x03) + TypedArray<u16>
 */

import {
	COORDINATE_SCALE,
	FieldIds,
	FlagBits,
	TEXT_OBJECT_ID,
} from "./constants";
import type { BoardData, ObjectFlags } from "./types";

/** セクションタイプ */
const SectionType = {
	CONTENT: 0x00,
	BACKGROUND: 0x03,
} as const;

/**
 * バイナリライター
 */
class BinaryWriter {
	private buffer: number[] = [];

	get length(): number {
		return this.buffer.length;
	}

	writeUint8(value: number): void {
		this.buffer.push(value & 0xff);
	}

	writeUint16(value: number): void {
		// Little Endian
		this.buffer.push(value & 0xff);
		this.buffer.push((value >> 8) & 0xff);
	}

	writeInt16(value: number): void {
		// Little Endian (signed)
		const unsigned = value < 0 ? value + 0x10000 : value;
		this.writeUint16(unsigned);
	}

	writeUint32(value: number): void {
		// Little Endian
		this.buffer.push(value & 0xff);
		this.buffer.push((value >> 8) & 0xff);
		this.buffer.push((value >> 16) & 0xff);
		this.buffer.push((value >> 24) & 0xff);
	}

	writeBytes(bytes: Uint8Array): void {
		for (const byte of bytes) {
			this.buffer.push(byte);
		}
	}

	writeString(str: string): void {
		const encoder = new TextEncoder();
		const bytes = encoder.encode(str);
		this.writeBytes(bytes);
	}

	/**
	 * 4バイト境界にパディング
	 */
	padTo4Bytes(): void {
		const remainder = this.buffer.length % 4;
		if (remainder !== 0) {
			const padding = 4 - remainder;
			for (let i = 0; i < padding; i++) {
				this.buffer.push(0);
			}
		}
	}

	/**
	 * 2バイト境界にパディング
	 */
	padTo2Bytes(): void {
		if (this.buffer.length % 2 !== 0) {
			this.buffer.push(0);
		}
	}

	toUint8Array(): Uint8Array {
		return new Uint8Array(this.buffer);
	}
}

/**
 * フラグをuint16にシリアライズ
 */
function serializeFlags(flags: ObjectFlags): number {
	let value = 0;
	if (flags.visible) value |= FlagBits.VISIBLE;
	if (flags.flipHorizontal) value |= FlagBits.FLIP_HORIZONTAL;
	if (flags.flipVertical) value |= FlagBits.FLIP_VERTICAL;
	if (flags.locked) value |= FlagBits.LOCKED;
	return value;
}

/**
 * フィールドコンテンツをシリアライズ（SectionContent内のTypeContainers）
 */
function serializeFields(board: BoardData, writer: BinaryWriter): void {
	const objects = board.objects;
	const objectCount = objects.length;

	// 空フィールド (ラウンドトリップ用)
	const emptyFieldCount = board._emptyFieldCount ?? 0;
	for (let i = 0; i < emptyFieldCount; i++) {
		writer.writeUint16(0); // FieldId 0 (Empty)
	}

	// Field 1: ボード名
	if (board.name.length > 0) {
		const encoder = new TextEncoder();
		const nameBytes = encoder.encode(board.name);
		const nameLength = nameBytes.length;
		// 元のフォーマットは少なくとも1バイトのnullを含むようにパディング
		const paddedLength = Math.ceil((nameLength + 1) / 4) * 4;

		writer.writeUint16(FieldIds.BOARD_NAME); // fieldId
		writer.writeUint16(paddedLength); // stringLength (パディング込みの長さを書く)
		writer.writeBytes(nameBytes);
		// 4バイト境界にパディング（必ずnull終端を含む）
		for (let i = nameLength; i < paddedLength; i++) {
			writer.writeUint8(0);
		}
	}

	// Field 2: オブジェクトID (各オブジェクトごとに1レコード)
	// テキストオブジェクト(objectId=100)の場合、Field 3 (text) を直後に書く
	for (const obj of objects) {
		writer.writeUint16(FieldIds.OBJECT_ID); // fieldId
		writer.writeUint16(obj.objectId);

		// テキストオブジェクトの場合、テキストを直後に書く
		if (obj.objectId === TEXT_OBJECT_ID && obj.text) {
			const encoder = new TextEncoder();
			const textBytes = encoder.encode(obj.text);
			const textLength = textBytes.length;
			// 元のフォーマットは少なくとも1バイトのnullを含むようにパディング
			const paddedLength = Math.ceil((textLength + 1) / 4) * 4;

			writer.writeUint16(FieldIds.TEXT_TERMINATOR); // fieldId
			writer.writeUint16(paddedLength); // length (パディング込みの長さを書く)
			writer.writeBytes(textBytes);
			// 4バイト境界にパディング（必ずnull終端を含む）
			for (let i = textLength; i < paddedLength; i++) {
				writer.writeUint8(0);
			}
		}
	}

	// Field 4: フラグ配列
	if (objectCount > 0) {
		writer.writeUint16(FieldIds.FLAGS); // fieldId
		writer.writeUint16(1); // type = 1
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeUint16(serializeFlags(obj.flags));
		}
	}

	// Field 5: 座標配列
	if (objectCount > 0) {
		writer.writeUint16(FieldIds.POSITIONS); // fieldId
		writer.writeUint16(3); // type = 3
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			// ピクセル → 1/10ピクセル
			writer.writeUint16(Math.round(obj.position.x * COORDINATE_SCALE));
			writer.writeUint16(Math.round(obj.position.y * COORDINATE_SCALE));
		}
	}

	// Field 6: 回転角度配列
	if (objectCount > 0) {
		writer.writeUint16(FieldIds.ROTATIONS); // fieldId
		writer.writeUint16(1); // type = 1
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeInt16(obj.rotation);
		}
	}

	// Field 7: サイズ配列
	if (objectCount > 0) {
		writer.writeUint16(FieldIds.SIZES); // fieldId
		writer.writeUint16(0); // type = 0
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeUint8(obj.size);
		}
		// 2バイト境界にアライン (保存されたパディングバイトがあれば使用)
		if (objectCount % 2 === 1) {
			writer.writeUint8(board._sizePaddingByte ?? 0);
		}
	}

	// Field 8: 色・透過度配列
	if (objectCount > 0) {
		writer.writeUint16(FieldIds.COLORS); // fieldId
		writer.writeUint16(2); // type = 2
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeUint8(obj.color.r);
			writer.writeUint8(obj.color.g);
			writer.writeUint8(obj.color.b);
			writer.writeUint8(obj.color.opacity);
		}
	}

	// Field 10: param1配列 (値があるオブジェクトがある場合)
	const hasParam1 = objects.some((obj) => obj.param1 !== undefined);
	if (hasParam1 && objectCount > 0) {
		writer.writeUint16(FieldIds.PARAM_1); // fieldId
		writer.writeUint16(1); // type = 1
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeUint16(obj.param1 ?? 0);
		}
	}

	// Field 11: param2配列 (値があるオブジェクトがある場合)
	const hasParam2 = objects.some((obj) => obj.param2 !== undefined);
	if (hasParam2 && objectCount > 0) {
		writer.writeUint16(FieldIds.PARAM_2); // fieldId
		writer.writeUint16(1); // type = 1
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeUint16(obj.param2 ?? 0);
		}
	}

	// Field 12: param3配列 (値があるオブジェクトがある場合)
	const hasParam3 = objects.some((obj) => obj.param3 !== undefined);
	if (hasParam3 && objectCount > 0) {
		writer.writeUint16(FieldIds.PARAM_3); // fieldId
		writer.writeUint16(1); // type = 1
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeUint16(obj.param3 ?? 0);
		}
	}
}

/**
 * BoardDataをバイナリにシリアライズ
 */
export function serializeBoardData(board: BoardData): Uint8Array {
	// 1. まずフィールドコンテンツをシリアライズして長さを計算
	const contentWriter = new BinaryWriter();
	serializeFields(board, contentWriter);
	const contentData = contentWriter.toUint8Array();

	// Content section の長さ (TypeContainersの長さのみ、SectionType/lengthを除く)
	const sectionContentLength = contentData.length;

	// Background section: SectionType(2) + DataType(2) + count(2) + backgroundId(2) = 8バイト
	const backgroundSectionLength = 8;

	// 総コンテンツ長 = Content section (SectionType + length + content) + Background section
	// Content section: 2 + 2 + sectionContentLength
	// Background section: 8
	const totalContentLength =
		2 + 2 + sectionContentLength + backgroundSectionLength;

	// 2. 最終的なバイナリを書き込み
	const writer = new BinaryWriter();

	// StrategyBoard ヘッダー (16バイト)
	writer.writeUint32(board.version); // tag/version
	writer.writeUint32(totalContentLength); // length (ヘッダー後のコンテンツ長)
	writer.writeUint32(0); // padding
	writer.writeUint32(0); // padding

	// Content section
	writer.writeUint16(SectionType.CONTENT); // SectionType = 0x00
	writer.writeUint16(sectionContentLength); // SectionContent.length
	writer.writeBytes(contentData); // TypeContainers

	// Background section
	// 注: SectionType.BACKGROUND (0x03) と FieldId 3 (TEXT_TERMINATOR) は同じ値
	writer.writeUint16(SectionType.BACKGROUND); // SectionType = 0x03
	writer.writeUint16(1); // DataType = 1 (WORD)
	writer.writeUint16(1); // count = 1
	writer.writeUint16(board.backgroundId); // backgroundId

	return writer.toUint8Array();
}
