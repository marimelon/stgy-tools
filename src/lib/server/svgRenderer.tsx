/**
 * サーバーサイドでBoardDataをSVG文字列にレンダリングする
 * オリジナル画像をBase64でインライン化
 */

import { renderToStaticMarkup } from "react-dom/server";
import type { BoardData, BoardObject } from "@/lib/stgy/types";
import { ObjectIds } from "@/lib/stgy/types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  OBJECT_BBOX_SIZES,
  DEFAULT_BBOX_SIZE,
  BackgroundRenderer,
} from "@/lib/board";
import { loadImageAsDataUri } from "./imageLoader";

/**
 * 単一オブジェクトをレンダリング
 */
function ObjectRenderer({ object }: { object: BoardObject }) {
  const { objectId, position, rotation, size, color, flags } = object;

  // サイズスケール計算
  const scale = size / 100;

  // バウンディングボックスサイズ取得（共通モジュールから）
  const bboxSize = OBJECT_BBOX_SIZES[objectId] ?? DEFAULT_BBOX_SIZE;

  // 画像をBase64で読み込み
  const imageDataUri = loadImageAsDataUri(objectId);

  // フリップ変換
  const flipX = flags.flipHorizontal ? -1 : 1;
  const flipY = flags.flipVertical ? -1 : 1;

  // 透過度をSVGのopacityに変換 (color.opacity: 0=不透明, 100=透明)
  const opacity = 1 - color.opacity / 100;

  // テキストオブジェクトは特別処理
  if (objectId === ObjectIds.Text && object.text) {
    return (
      <g
        transform={`translate(${position.x}, ${position.y}) rotate(${rotation}) scale(${scale * flipX}, ${scale * flipY})`}
      >
        <text
          x={0}
          y={0}
          fill={`rgb(${color.r}, ${color.g}, ${color.b})`}
          fontSize="14"
          fontFamily="sans-serif"
          textAnchor="middle"
          dominantBaseline="middle"
          opacity={opacity}
        >
          {object.text}
        </text>
      </g>
    );
  }

  // グループオブジェクトはスキップ
  if (objectId === ObjectIds.Group) {
    return null;
  }

  // 画像がない場合はプレースホルダー
  if (!imageDataUri) {
    return (
      <g
        transform={`translate(${position.x}, ${position.y}) rotate(${rotation}) scale(${scale * flipX}, ${scale * flipY})`}
      >
        <rect
          x={-bboxSize.width / 2}
          y={-bboxSize.height / 2}
          width={bboxSize.width}
          height={bboxSize.height}
          fill="#666"
          stroke="#999"
          strokeWidth="1"
          opacity={opacity}
        />
        <text x={0} y={0} fill="#fff" fontSize="10" textAnchor="middle" dominantBaseline="middle">
          {objectId}
        </text>
      </g>
    );
  }

  return (
    <g
      transform={`translate(${position.x}, ${position.y}) rotate(${rotation}) scale(${scale * flipX}, ${scale * flipY})`}
    >
      <image
        href={imageDataUri}
        x={-bboxSize.width / 2}
        y={-bboxSize.height / 2}
        width={bboxSize.width}
        height={bboxSize.height}
        preserveAspectRatio="xMidYMid meet"
        opacity={opacity}
      />
    </g>
  );
}

/**
 * BoardDataをSVG文字列にレンダリング
 */
export function renderBoardToSVG(boardData: BoardData): string {
  const { backgroundId, objects } = boardData;

  // 表示するオブジェクトのみフィルタ（逆順で描画）
  const visibleObjects = objects.filter((obj) => obj.flags.visible).reverse();

  const svgElement = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      style={{ backgroundColor: "#1a1a1a" }}
    >
      {/* 背景色 */}
      <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#1a1a1a" />

      {/* 背景パターン（共通コンポーネント使用） */}
      <BackgroundRenderer backgroundId={backgroundId} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

      {/* オブジェクト */}
      {visibleObjects.map((obj, index) => (
        <ObjectRenderer key={index} object={obj} />
      ))}
    </svg>
  );

  return renderToStaticMarkup(svgElement);
}
