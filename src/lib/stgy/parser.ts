/**
 * stgy バイナリパーサー
 *
 * デコードされたバイナリデータをBoardData構造にパースする
 *
 * バイナリフォーマット (xivdev仕様準拠):
 * - StrategyBoard ヘッダー (16バイト):
 *   - 0x00-0x03: tag (u32) - バージョン
 *   - 0x04-0x07: length (u32) - ヘッダー後のコンテンツ長
 *   - 0x08-0x0F: padding (8バイト)
 * - Sections (0x10以降):
 *   - SectionType (u16): 0x00 = Content, 0x03 = Background
 *   - Content section: length (u16) + TypeContainers
 *   - Background section: TypedArray<u16>
 */

import { BinaryReader } from "./parser/BinaryReader";
import { fieldParsers } from "./parser/fieldParsers";
import { createParseContext, type ParseContext } from "./parser/types";
import type { BoardData, BoardObject, ObjectFlags } from "./types";

// Re-export for backward compatibility
export { BinaryReader } from "./parser/BinaryReader";

/** セクションタイプ */
const SectionType = {
	CONTENT: 0x00,
	BACKGROUND: 0x03,
} as const;

/**
 * ボードデータをパース
 */
export function parseBoardData(data: Uint8Array): BoardData {
	const reader = new BinaryReader(data);

	// StrategyBoard ヘッダー (16バイト)
	const version = reader.readUint32(); // tag/version
	reader.readUint32(); // length (コンテンツ長、検証用に使用可能)
	reader.skip(8); // padding

	// フィールドリストをパース
	const context = createParseContext();
	let insideContentSection = false;
	let countingEmptyFields = false;

	while (reader.remaining >= 2) {
		const sectionTypeOrFieldId = reader.readUint16();

		// Content section (0x00) の開始判定
		// 注: SectionType.CONTENT (0x00) と FieldId 0 (Empty) は同じ値のため、
		// Content section内に入っていない場合のみSectionTypeとして処理する
		if (sectionTypeOrFieldId === SectionType.CONTENT && !insideContentSection) {
			reader.readUint16(); // SectionContent.length (検証用に使用可能)
			insideContentSection = true;
			countingEmptyFields = true;
			continue;
		}

		// FieldId 0 (Empty) の処理
		if (sectionTypeOrFieldId === 0) {
			if (countingEmptyFields) {
				context.emptyFieldCount++;
			}
			continue;
		}

		// 非空フィールドに達したら空フィールドのカウント終了
		countingEmptyFields = false;

		// 注: SectionType.BACKGROUND (0x03) と FieldId 3 (TEXT_TERMINATOR) は同じ値
		// parseField3 が length=1 の場合に終端マーカー(Background section)として処理する

		// フィールドとして処理
		const parser = fieldParsers[sectionTypeOrFieldId];
		if (parser) {
			parser(reader, context);
		} else {
			console.warn(
				`Unknown field ID: ${sectionTypeOrFieldId} at offset ${reader.position - 2}`,
			);
		}
	}

	// オブジェクトを組み立て
	const objects = assembleObjects(context);

	return {
		version,
		name: context.boardName,
		backgroundId: context.backgroundId,
		objects,
		_sizePaddingByte: context.sizePaddingByte,
		_emptyFieldCount:
			context.emptyFieldCount > 0 ? context.emptyFieldCount : undefined,
	};
}

/**
 * ParseContextからBoardObject[]を組み立て
 */
function assembleObjects(context: ParseContext): BoardObject[] {
	const objects: BoardObject[] = [];
	let textIndex = 0;

	const defaultFlags: ObjectFlags = {
		visible: true,
		flipHorizontal: false,
		flipVertical: false,
		locked: false,
	};

	for (let i = 0; i < context.objectIds.length; i++) {
		const objectId = context.objectIds[i];
		const isTextObject = objectId === 100;

		const obj: BoardObject = {
			objectId,
			flags: context.flagsArray[i] ?? defaultFlags,
			position: context.positions[i] ?? { x: 0, y: 0 },
			rotation: context.rotations[i] ?? 0,
			size: context.sizes[i] ?? 100,
			color: context.colors[i] ?? { r: 255, g: 255, b: 255, opacity: 0 },
		};

		if (isTextObject && textIndex < context.texts.length) {
			obj.text = context.texts[textIndex];
			textIndex++;
		}

		if (context.param1s[i] !== undefined) {
			obj.param1 = context.param1s[i];
		}
		if (context.param2s[i] !== undefined) {
			obj.param2 = context.param2s[i];
		}
		if (context.param3s[i] !== undefined) {
			obj.param3 = context.param3s[i];
		}

		objects.push(obj);
	}

	return objects;
}
