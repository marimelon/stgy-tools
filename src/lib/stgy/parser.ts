/**
 * stgy バイナリパーサー
 *
 * デコードされたバイナリデータをBoardData構造にパースする
 */

import type {
  BackgroundId,
  BoardData,
  BoardObject,
  Color,
  ObjectFlags,
  Position,
} from "./types";

/**
 * バイナリリーダー
 */
class BinaryReader {
  private view: DataView;
  private offset: number;

  constructor(data: Uint8Array) {
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    this.offset = 0;
  }

  get position(): number {
    return this.offset;
  }

  get remaining(): number {
    return this.view.byteLength - this.offset;
  }

  readUint8(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  readUint16(): number {
    const value = this.view.getUint16(this.offset, true); // Little Endian
    this.offset += 2;
    return value;
  }

  readInt16(): number {
    const value = this.view.getInt16(this.offset, true); // Little Endian
    this.offset += 2;
    return value;
  }

  readUint32(): number {
    const value = this.view.getUint32(this.offset, true); // Little Endian
    this.offset += 4;
    return value;
  }

  readBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(
      this.view.buffer,
      this.view.byteOffset + this.offset,
      length
    );
    this.offset += length;
    return bytes;
  }

  readString(length: number): string {
    const bytes = this.readBytes(length);
    // null終端を除去
    let end = bytes.indexOf(0);
    if (end === -1) end = bytes.length;
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes.subarray(0, end));
  }

  skip(bytes: number): void {
    this.offset += bytes;
  }

  alignTo(boundary: number): void {
    const remainder = this.offset % boundary;
    if (remainder !== 0) {
      this.offset += boundary - remainder;
    }
  }
}

/**
 * フラグをパース
 */
function parseFlags(value: number): ObjectFlags {
  return {
    visible: (value & 0x01) !== 0,
    flipHorizontal: (value & 0x02) !== 0,
    flipVertical: (value & 0x04) !== 0,
    unlocked: (value & 0x08) !== 0,
  };
}

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
  let boardName = "";
  let backgroundId: BackgroundId = 1;
  const objectIds: number[] = [];
  const texts: string[] = [];
  const flagsArray: ObjectFlags[] = [];
  const positions: Position[] = [];
  const rotations: number[] = [];
  const sizes: number[] = [];
  const colors: Color[] = [];
  const param1s: number[] = [];
  const param2s: number[] = [];
  const param3s: number[] = [];
  let sizePaddingByte: number | undefined;

  while (reader.remaining >= 4) {
    const fieldId = reader.readUint16();

    switch (fieldId) {
      case 1: {
        // ボード名
        const stringLength = reader.readUint16();
        // 4バイト境界にパディングされた長さ
        const paddedLength = Math.ceil(stringLength / 4) * 4;
        boardName = reader.readString(paddedLength);
        break;
      }

      case 2: {
        // オブジェクトID
        const objectId = reader.readUint16();
        objectIds.push(objectId);
        break;
      }

      case 3: {
        // テキスト本文 / 終端マーカー
        const length = reader.readUint16();
        if (length > 8) {
          // テキスト
          const paddedLength = Math.ceil(length / 4) * 4;
          const text = reader.readString(paddedLength);
          texts.push(text);
        } else {
          // 終端マーカー
          reader.readUint16(); // = 1
          backgroundId = reader.readUint16() as BackgroundId;
        }
        break;
      }

      case 4: {
        // オブジェクト状態フラグ配列
        reader.readUint16(); // type = 1
        const count = reader.readUint16();
        for (let i = 0; i < count; i++) {
          const flags = reader.readUint16();
          flagsArray.push(parseFlags(flags));
        }
        break;
      }

      case 5: {
        // 座標配列
        reader.readUint16(); // type = 3
        const count = reader.readUint16();
        for (let i = 0; i < count; i++) {
          const x = reader.readUint16() / 10; // 1/10ピクセル → ピクセル
          const y = reader.readUint16() / 10;
          positions.push({ x, y });
        }
        break;
      }

      case 6: {
        // 回転角度配列
        reader.readUint16(); // type = 1
        const count = reader.readUint16();
        for (let i = 0; i < count; i++) {
          const rotation = reader.readInt16();
          rotations.push(rotation);
        }
        break;
      }

      case 7: {
        // サイズ配列
        reader.readUint16(); // type = 0
        const count = reader.readUint16();
        for (let i = 0; i < count; i++) {
          const size = reader.readUint8();
          sizes.push(size);
        }
        // 2バイト境界にアライン (パディングバイトを保存)
        if (count % 2 === 1) {
          sizePaddingByte = reader.readUint8();
        }
        break;
      }

      case 8: {
        // 色・透過度配列
        reader.readUint16(); // type = 2
        const count = reader.readUint16();
        for (let i = 0; i < count; i++) {
          const r = reader.readUint8();
          const g = reader.readUint8();
          const b = reader.readUint8();
          const opacity = reader.readUint8();
          colors.push({ r, g, b, opacity });
        }
        break;
      }

      case 10: {
        // 固有パラメータ1
        reader.readUint16(); // type = 1
        const count = reader.readUint16();
        for (let i = 0; i < count; i++) {
          param1s.push(reader.readUint16());
        }
        break;
      }

      case 11: {
        // 固有パラメータ2
        reader.readUint16(); // type = 1
        const count = reader.readUint16();
        for (let i = 0; i < count; i++) {
          param2s.push(reader.readUint16());
        }
        break;
      }

      case 12: {
        // 固有パラメータ3
        reader.readUint16(); // type = 1
        const count = reader.readUint16();
        for (let i = 0; i < count; i++) {
          param3s.push(reader.readUint16());
        }
        break;
      }

      default:
        // 未知のフィールドは無視
        console.warn(`Unknown field ID: ${fieldId} at offset ${reader.position - 2}`);
        break;
    }
  }

  // オブジェクトを組み立て
  const objects: BoardObject[] = [];
  let textIndex = 0;

  for (let i = 0; i < objectIds.length; i++) {
    const objectId = objectIds[i];
    const isTextObject = objectId === 100;

    const obj: BoardObject = {
      objectId,
      flags: flagsArray[i] ?? { visible: true, flipHorizontal: false, flipVertical: false, unlocked: true },
      position: positions[i] ?? { x: 0, y: 0 },
      rotation: rotations[i] ?? 0,
      size: sizes[i] ?? 100,
      color: colors[i] ?? { r: 255, g: 255, b: 255, opacity: 0 },
    };

    if (isTextObject && textIndex < texts.length) {
      obj.text = texts[textIndex];
      textIndex++;
    }

    if (param1s[i] !== undefined) {
      obj.param1 = param1s[i];
    }
    if (param2s[i] !== undefined) {
      obj.param2 = param2s[i];
    }
    if (param3s[i] !== undefined) {
      obj.param3 = param3s[i];
    }

    objects.push(obj);
  }

  return {
    version,
    width,
    height,
    name: boardName,
    backgroundId,
    objects,
    _sizePaddingByte: sizePaddingByte,
  };
}
