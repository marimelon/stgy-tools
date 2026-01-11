/**
 * stgy binary parser
 *
 * Parses decoded binary data into BoardData structure
 *
 * Binary format (xivdev spec compliant):
 * - StrategyBoard header (16 bytes):
 *   - 0x00-0x03: tag (u32) - version
 *   - 0x04-0x07: length (u32) - content length after header
 *   - 0x08-0x0F: padding (8 bytes)
 * - Sections (from 0x10):
 *   - SectionType (u16): 0x00 = Content, 0x03 = Background
 *   - Content section: length (u16) + TypeContainers
 *   - Background section: TypedArray<u16>
 */

import { BinaryReader } from "./parser/BinaryReader";
import { fieldParsers } from "./parser/fieldParsers";
import { createParseContext, type ParseContext } from "./parser/types";
import type {
	BoardObjectWithoutId,
	ObjectFlags,
	ParsedBoardData,
} from "./types";

// Re-export for backward compatibility
export { BinaryReader } from "./parser/BinaryReader";

/** Section type */
const SectionType = {
	CONTENT: 0x00,
	BACKGROUND: 0x03,
} as const;

/**
 * Parse board data
 * Returned objects do not include IDs. Use assignObjectIds to add IDs.
 */
export function parseBoardData(data: Uint8Array): ParsedBoardData {
	const reader = new BinaryReader(data);

	// StrategyBoard header (16 bytes)
	const version = reader.readUint32(); // tag/version
	reader.readUint32(); // length (content length, can be used for validation)
	reader.skip(8); // padding

	// Parse field list
	const context = createParseContext();
	let insideContentSection = false;
	let countingEmptyFields = false;

	while (reader.remaining >= 2) {
		const sectionTypeOrFieldId = reader.readUint16();

		// Content section (0x00) start detection
		// Note: SectionType.CONTENT (0x00) and FieldId 0 (Empty) have the same value,
		// so only treat as SectionType when not inside Content section
		if (sectionTypeOrFieldId === SectionType.CONTENT && !insideContentSection) {
			reader.readUint16(); // SectionContent.length (can be used for validation)
			insideContentSection = true;
			countingEmptyFields = true;
			continue;
		}

		// FieldId 0 (Empty) handling
		if (sectionTypeOrFieldId === 0) {
			if (countingEmptyFields) {
				context.emptyFieldCount++;
			}
			continue;
		}

		// Stop counting empty fields once non-empty field is reached
		countingEmptyFields = false;

		// Note: SectionType.BACKGROUND (0x03) and FieldId 3 (TEXT_TERMINATOR) have the same value
		// parseField3 handles length=1 case as terminator marker (Background section)

		// Process as field
		const parser = fieldParsers[sectionTypeOrFieldId];
		if (parser) {
			parser(reader, context);
		} else {
			console.warn(
				`Unknown field ID: ${sectionTypeOrFieldId} at offset ${reader.position - 2}`,
			);
		}
	}

	// Assemble objects
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
 * Assemble BoardObjectWithoutId[] from ParseContext
 */
function assembleObjects(context: ParseContext): BoardObjectWithoutId[] {
	const objects: BoardObjectWithoutId[] = [];
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

		const obj: BoardObjectWithoutId = {
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
