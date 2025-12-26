/**
 * stgy バイナリパーサー
 *
 * デコードされたバイナリデータをBoardData構造にパースする
 */

import { BinaryReader } from "./parser/BinaryReader";
import { fieldParsers } from "./parser/fieldParsers";
import { createParseContext, type ParseContext } from "./parser/types";
import type { BoardData, BoardObject, ObjectFlags } from "./types";

// Re-export for backward compatibility
export { BinaryReader } from "./parser/BinaryReader";

/**
 * ボードデータをパース
 */
export function parseBoardData(data: Uint8Array): BoardData {
	const reader = new BinaryReader(data);

	// ヘッダー (24バイト)
	const version = reader.readUint32();
	const width = reader.readUint32();
	reader.readUint32(); // 未使用
	reader.readUint32(); // 未使用
	reader.readUint16(); // 未使用
	const height = reader.readUint16();
	reader.readUint32(); // 未使用

	// フィールドリストをパース
	const context = createParseContext();

	while (reader.remaining >= 4) {
		const fieldId = reader.readUint16();
		const parser = fieldParsers[fieldId];

		if (parser) {
			parser(reader, context);
		} else {
			console.warn(
				`Unknown field ID: ${fieldId} at offset ${reader.position - 2}`,
			);
		}
	}

	// オブジェクトを組み立て
	const objects = assembleObjects(context);

	return {
		version,
		width,
		height,
		name: context.boardName,
		backgroundId: context.backgroundId,
		objects,
		_sizePaddingByte: context.sizePaddingByte,
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
