/**
 * ボード・オブジェクト生成ファクトリー
 */

import type { BoardData, BoardObject, Position } from "@/lib/stgy";
import { BackgroundId, ObjectIds } from "@/lib/stgy";

/**
 * 空のボードを生成
 */
export function createEmptyBoard(name = ""): BoardData {
  return {
    version: 2,
    width: 512,
    height: 384,
    name,
    backgroundId: BackgroundId.None,
    objects: [],
  };
}

/**
 * デフォルトのオブジェクトを生成
 * @param objectId オブジェクトID
 * @param position 初期位置 (省略時はキャンバス中央)
 */
export function createDefaultObject(
  objectId: number,
  position?: Position
): BoardObject {
  const defaultPosition: Position = position ?? { x: 256, y: 192 };

  const obj: BoardObject = {
    objectId,
    flags: {
      visible: true,
      flipHorizontal: false,
      flipVertical: false,
      locked: false,
    },
    position: defaultPosition,
    rotation: 0,
    size: 100,
    color: { r: 255, g: 100, b: 0, opacity: 0 },
  };

  // オブジェクト固有のデフォルトパラメータ
  switch (objectId) {
    case ObjectIds.ConeAoE:
      // 扇範囲攻撃のデフォルト角度
      obj.param1 = 90;
      break;
    case ObjectIds.DonutAoE:
      // ドーナツ範囲攻撃のデフォルト内径
      obj.param2 = 50;
      break;
    case ObjectIds.Text:
      // テキストオブジェクトのデフォルトテキスト
      obj.text = "";
      break;
  }

  return obj;
}

/**
 * オブジェクトを複製
 * @param object 複製元オブジェクト
 * @param offset 位置オフセット (省略時は10px右下にずらす)
 */
export function duplicateObject(
  object: BoardObject,
  offset: Position = { x: 10, y: 10 }
): BoardObject {
  return {
    ...object,
    position: {
      x: object.position.x + offset.x,
      y: object.position.y + offset.y,
    },
    flags: { ...object.flags },
    color: { ...object.color },
  };
}

/**
 * テキストオブジェクトのテキスト長からボードサイズを計算
 * オリジナルアプリの計算式: width = 104 + textLength * 4, height = 92 + textLength * 4
 * @param textLength テキストの文字数
 */
export function calculateTextBoardSize(textLength: number): {
  width: number;
  height: number;
} {
  // 4バイト境界に合わせる
  const width = 104 + textLength * 4;
  const height = 92 + textLength * 4;
  return { width, height };
}

/**
 * ボードのサイズをコンテンツに基づいて再計算
 * テキストオブジェクトのみのボードはテキスト長からサイズを計算
 * それ以外は全オブジェクトのバウンディングボックスから計算
 * @param board ボードデータ
 */
export function recalculateBoardSize(board: BoardData): {
  width: number;
  height: number;
} {
  const objects = board.objects.filter((o) => o.flags.visible);

  if (objects.length === 0) {
    return { width: board.width, height: board.height };
  }

  // テキストオブジェクトのみの場合、テキスト長から計算
  const textObjects = objects.filter((o) => o.objectId === ObjectIds.Text);
  if (textObjects.length === objects.length && textObjects.length === 1) {
    const textLength = textObjects[0].text?.length ?? 0;
    return calculateTextBoardSize(textLength);
  }

  // 複数オブジェクトや非テキストオブジェクトの場合は現在のサイズを維持
  // TODO: バウンディングボックス計算を実装
  return { width: board.width, height: board.height };
}
