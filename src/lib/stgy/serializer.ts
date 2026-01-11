/**
 * stgy binary serializer
 *
 * Serializes BoardData to binary data (reverse of parser.ts)
 *
 * Binary format (xivdev spec compliant):
 * - StrategyBoard header (16 bytes):
 *   - 0x00-0x03: tag (u32) - version
 *   - 0x04-0x07: length (u32) - content length after header
 *   - 0x08-0x0F: padding (8 bytes)
 * - Sections (from 0x10):
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

/** Section type */
const SectionType = {
	CONTENT: 0x00,
	BACKGROUND: 0x03,
} as const;

/**
 * Binary writer
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
	 * Pad to 4-byte boundary
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
	 * Pad to 2-byte boundary
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
 * Serialize flags to uint16
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
 * Serialize field content (TypeContainers in SectionContent)
 */
function serializeFields(board: BoardData, writer: BinaryWriter): void {
	const objects = board.objects;
	const objectCount = objects.length;

	// Empty fields (for round-trip)
	const emptyFieldCount = board._emptyFieldCount ?? 0;
	for (let i = 0; i < emptyFieldCount; i++) {
		writer.writeUint16(0); // FieldId 0 (Empty)
	}

	// Field 1: Board name
	if (board.name.length > 0) {
		const encoder = new TextEncoder();
		const nameBytes = encoder.encode(board.name);
		const nameLength = nameBytes.length;
		// Original format pads to include at least 1 null byte
		const paddedLength = Math.ceil((nameLength + 1) / 4) * 4;

		writer.writeUint16(FieldIds.BOARD_NAME); // fieldId
		writer.writeUint16(paddedLength); // stringLength (write padded length)
		writer.writeBytes(nameBytes);
		// Pad to 4-byte boundary (always including null terminator)
		for (let i = nameLength; i < paddedLength; i++) {
			writer.writeUint8(0);
		}
	}

	// Field 2: Object ID (one record per object)
	// For text objects (objectId=100), write Field 3 (text) immediately after
	for (const obj of objects) {
		writer.writeUint16(FieldIds.OBJECT_ID); // fieldId
		writer.writeUint16(obj.objectId);

		// For text objects, write text immediately after
		if (obj.objectId === TEXT_OBJECT_ID && obj.text) {
			const encoder = new TextEncoder();
			const textBytes = encoder.encode(obj.text);
			const textLength = textBytes.length;
			// Original format pads to include at least 1 null byte
			const paddedLength = Math.ceil((textLength + 1) / 4) * 4;

			writer.writeUint16(FieldIds.TEXT_TERMINATOR); // fieldId
			writer.writeUint16(paddedLength); // length (write padded length)
			writer.writeBytes(textBytes);
			// Pad to 4-byte boundary (always including null terminator)
			for (let i = textLength; i < paddedLength; i++) {
				writer.writeUint8(0);
			}
		}
	}

	// Field 4: Flag array
	if (objectCount > 0) {
		writer.writeUint16(FieldIds.FLAGS); // fieldId
		writer.writeUint16(1); // type = 1
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeUint16(serializeFlags(obj.flags));
		}
	}

	// Field 5: Position array
	if (objectCount > 0) {
		writer.writeUint16(FieldIds.POSITIONS); // fieldId
		writer.writeUint16(3); // type = 3
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			// Pixel -> 1/10 pixel
			writer.writeUint16(Math.round(obj.position.x * COORDINATE_SCALE));
			writer.writeUint16(Math.round(obj.position.y * COORDINATE_SCALE));
		}
	}

	// Field 6: Rotation angle array
	if (objectCount > 0) {
		writer.writeUint16(FieldIds.ROTATIONS); // fieldId
		writer.writeUint16(1); // type = 1
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeInt16(obj.rotation);
		}
	}

	// Field 7: Size array
	if (objectCount > 0) {
		writer.writeUint16(FieldIds.SIZES); // fieldId
		writer.writeUint16(0); // type = 0
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeUint8(obj.size);
		}
		// Align to 2-byte boundary (use saved padding byte if available)
		if (objectCount % 2 === 1) {
			writer.writeUint8(board._sizePaddingByte ?? 0);
		}
	}

	// Field 8: Color/opacity array
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

	// Field 10: param1 array (if any objects have values)
	const hasParam1 = objects.some((obj) => obj.param1 !== undefined);
	if (hasParam1 && objectCount > 0) {
		writer.writeUint16(FieldIds.PARAM_1); // fieldId
		writer.writeUint16(1); // type = 1
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeUint16(obj.param1 ?? 0);
		}
	}

	// Field 11: param2 array (if any objects have values)
	const hasParam2 = objects.some((obj) => obj.param2 !== undefined);
	if (hasParam2 && objectCount > 0) {
		writer.writeUint16(FieldIds.PARAM_2); // fieldId
		writer.writeUint16(1); // type = 1
		writer.writeUint16(objectCount); // count
		for (const obj of objects) {
			writer.writeUint16(obj.param2 ?? 0);
		}
	}

	// Field 12: param3 array (if any objects have values)
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
 * Serialize BoardData to binary
 */
export function serializeBoardData(board: BoardData): Uint8Array {
	// 1. First serialize field content to calculate length
	const contentWriter = new BinaryWriter();
	serializeFields(board, contentWriter);
	const contentData = contentWriter.toUint8Array();

	// Content section length (only TypeContainers length, excluding SectionType/length)
	const sectionContentLength = contentData.length;

	// Background section: SectionType(2) + DataType(2) + count(2) + backgroundId(2) = 8 bytes
	const backgroundSectionLength = 8;

	// Total content length = Content section (SectionType + length + content) + Background section
	// Content section: 2 + 2 + sectionContentLength
	// Background section: 8
	const totalContentLength =
		2 + 2 + sectionContentLength + backgroundSectionLength;

	// 2. Write final binary
	const writer = new BinaryWriter();

	// StrategyBoard header (16 bytes)
	writer.writeUint32(board.version); // tag/version
	writer.writeUint32(totalContentLength); // length (content length after header)
	writer.writeUint32(0); // padding
	writer.writeUint32(0); // padding

	// Content section
	writer.writeUint16(SectionType.CONTENT); // SectionType = 0x00
	writer.writeUint16(sectionContentLength); // SectionContent.length
	writer.writeBytes(contentData); // TypeContainers

	// Background section
	// Note: SectionType.BACKGROUND (0x03) and FieldId 3 (TEXT_TERMINATOR) have the same value
	writer.writeUint16(SectionType.BACKGROUND); // SectionType = 0x03
	writer.writeUint16(1); // DataType = 1 (WORD)
	writer.writeUint16(1); // count = 1
	writer.writeUint16(board.backgroundId); // backgroundId

	return writer.toUint8Array();
}
