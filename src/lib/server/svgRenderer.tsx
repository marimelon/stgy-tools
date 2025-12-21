/**
 * サーバーサイドでBoardDataをSVG文字列にレンダリングする
 * オリジナル画像をBase64でインライン化
 */

import { renderToStaticMarkup } from "react-dom/server";
import type { BoardData, BoardObject, BackgroundId } from "@/lib/stgy/types";
import { ObjectIds } from "@/lib/stgy/types";
import { loadImageAsDataUri } from "./imageLoader";

/** キャンバスサイズ */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

/** オブジェクトごとのバウンディングボックスサイズ */
const OBJECT_BBOX_SIZES: Record<number, { width: number; height: number }> = {
  // フィールド (256x256)
  [ObjectIds.CircleWhiteSolid]: { width: 256, height: 256 },
  [ObjectIds.CircleWhiteTile]: { width: 256, height: 256 },
  [ObjectIds.CircleGraySolid]: { width: 256, height: 256 },
  [ObjectIds.CircleCheck]: { width: 256, height: 256 },
  [ObjectIds.SquareWhiteSolid]: { width: 256, height: 256 },
  [ObjectIds.SquareWhiteTile]: { width: 256, height: 256 },
  [ObjectIds.SquareGraySolid]: { width: 256, height: 256 },
  [ObjectIds.SquareCheck]: { width: 256, height: 256 },
  [ObjectIds.CircleGray]: { width: 256, height: 256 },
  [ObjectIds.SquareGray]: { width: 256, height: 256 },

  // 攻撃範囲
  [ObjectIds.CircleAoE]: { width: 256, height: 256 },
  [ObjectIds.LineAoE]: { width: 16, height: 96 },
  [ObjectIds.Line]: { width: 16, height: 96 },
  [ObjectIds.Gaze]: { width: 100, height: 100 },
  [ObjectIds.Stack]: { width: 48, height: 48 },
  [ObjectIds.StackLine]: { width: 48, height: 48 },
  [ObjectIds.Proximity]: { width: 48, height: 48 },
  [ObjectIds.DonutAoE]: { width: 48, height: 48 },
  [ObjectIds.StackChain]: { width: 134, height: 134 },
  [ObjectIds.ProximityTarget]: { width: 48, height: 48 },
  [ObjectIds.Tankbuster]: { width: 48, height: 48 },
  [ObjectIds.KnockbackRadial]: { width: 256, height: 256 },
  [ObjectIds.KnockbackLine]: { width: 256, height: 256 },
  [ObjectIds.Block]: { width: 60, height: 60 },
  [ObjectIds.TargetMarker]: { width: 48, height: 48 },
  [ObjectIds.CircleAoEMoving]: { width: 134, height: 134 },
  [ObjectIds.Area1P]: { width: 70, height: 70 },
  [ObjectIds.Area2P]: { width: 70, height: 70 },
  [ObjectIds.Area3P]: { width: 70, height: 70 },
  [ObjectIds.Area4P]: { width: 70, height: 70 },

  // ジョブアイコン (24x24)
  [ObjectIds.Gladiator]: { width: 24, height: 24 },
  [ObjectIds.Pugilist]: { width: 24, height: 24 },
  [ObjectIds.Marauder]: { width: 24, height: 24 },
  [ObjectIds.Lancer]: { width: 24, height: 24 },
  [ObjectIds.Archer]: { width: 24, height: 24 },
  [ObjectIds.Conjurer]: { width: 24, height: 24 },
  [ObjectIds.Thaumaturge]: { width: 24, height: 24 },
  [ObjectIds.Arcanist]: { width: 24, height: 24 },
  [ObjectIds.Rogue]: { width: 24, height: 24 },
  [ObjectIds.Paladin]: { width: 24, height: 24 },
  [ObjectIds.Monk]: { width: 24, height: 24 },
  [ObjectIds.Warrior]: { width: 24, height: 24 },
  [ObjectIds.Dragoon]: { width: 24, height: 24 },
  [ObjectIds.Bard]: { width: 24, height: 24 },
  [ObjectIds.WhiteMage]: { width: 24, height: 24 },
  [ObjectIds.BlackMage]: { width: 24, height: 24 },
  [ObjectIds.Summoner]: { width: 24, height: 24 },
  [ObjectIds.Scholar]: { width: 24, height: 24 },
  [ObjectIds.Ninja]: { width: 24, height: 24 },
  [ObjectIds.Machinist]: { width: 24, height: 24 },
  [ObjectIds.DarkKnight]: { width: 24, height: 24 },
  [ObjectIds.Astrologian]: { width: 24, height: 24 },
  [ObjectIds.Samurai]: { width: 24, height: 24 },
  [ObjectIds.RedMage]: { width: 24, height: 24 },
  [ObjectIds.BlueMage]: { width: 24, height: 24 },
  [ObjectIds.Gunbreaker]: { width: 24, height: 24 },
  [ObjectIds.Dancer]: { width: 24, height: 24 },
  [ObjectIds.Reaper]: { width: 24, height: 24 },
  [ObjectIds.Sage]: { width: 24, height: 24 },
  [ObjectIds.Viper]: { width: 24, height: 24 },
  [ObjectIds.Pictomancer]: { width: 24, height: 24 },

  // ロールアイコン (24x24)
  [ObjectIds.Tank]: { width: 24, height: 24 },
  [ObjectIds.Tank1]: { width: 24, height: 24 },
  [ObjectIds.Tank2]: { width: 24, height: 24 },
  [ObjectIds.Healer]: { width: 24, height: 24 },
  [ObjectIds.Healer1]: { width: 24, height: 24 },
  [ObjectIds.Healer2]: { width: 24, height: 24 },
  [ObjectIds.DPS]: { width: 24, height: 24 },
  [ObjectIds.DPS1]: { width: 24, height: 24 },
  [ObjectIds.DPS2]: { width: 24, height: 24 },
  [ObjectIds.DPS3]: { width: 24, height: 24 },
  [ObjectIds.DPS4]: { width: 24, height: 24 },
  [ObjectIds.MeleeDPS]: { width: 24, height: 24 },
  [ObjectIds.RangedDPS]: { width: 24, height: 24 },
  [ObjectIds.PhysicalRangedDPS]: { width: 24, height: 24 },
  [ObjectIds.MagicalRangedDPS]: { width: 24, height: 24 },
  [ObjectIds.PureHealer]: { width: 24, height: 24 },
  [ObjectIds.BarrierHealer]: { width: 24, height: 24 },

  // エネミー
  [ObjectIds.EnemySmall]: { width: 32, height: 32 },
  [ObjectIds.EnemyMedium]: { width: 48, height: 48 },
  [ObjectIds.EnemyLarge]: { width: 64, height: 64 },

  // マーカー (32x32)
  [ObjectIds.Attack1]: { width: 32, height: 32 },
  [ObjectIds.Attack2]: { width: 32, height: 32 },
  [ObjectIds.Attack3]: { width: 32, height: 32 },
  [ObjectIds.Attack4]: { width: 32, height: 32 },
  [ObjectIds.Attack5]: { width: 32, height: 32 },
  [ObjectIds.Attack6]: { width: 32, height: 32 },
  [ObjectIds.Attack7]: { width: 32, height: 32 },
  [ObjectIds.Attack8]: { width: 32, height: 32 },
  [ObjectIds.Bind1]: { width: 32, height: 32 },
  [ObjectIds.Bind2]: { width: 32, height: 32 },
  [ObjectIds.Bind3]: { width: 32, height: 32 },
  [ObjectIds.Ignore1]: { width: 32, height: 32 },
  [ObjectIds.Ignore2]: { width: 32, height: 32 },
  [ObjectIds.Square]: { width: 32, height: 32 },
  [ObjectIds.Circle]: { width: 32, height: 32 },
  [ObjectIds.Plus]: { width: 32, height: 32 },
  [ObjectIds.Triangle]: { width: 32, height: 32 },

  // ウェイマーク (32x32)
  [ObjectIds.WaymarkA]: { width: 32, height: 32 },
  [ObjectIds.WaymarkB]: { width: 32, height: 32 },
  [ObjectIds.WaymarkC]: { width: 32, height: 32 },
  [ObjectIds.WaymarkD]: { width: 32, height: 32 },
  [ObjectIds.Waymark1]: { width: 32, height: 32 },
  [ObjectIds.Waymark2]: { width: 32, height: 32 },
  [ObjectIds.Waymark3]: { width: 32, height: 32 },
  [ObjectIds.Waymark4]: { width: 32, height: 32 },

  // バフ/デバフ
  [ObjectIds.Buff]: { width: 32, height: 32 },
  [ObjectIds.Debuff]: { width: 32, height: 32 },

  // ロックオンマーカー
  [ObjectIds.LockOnRed]: { width: 70, height: 70 },
  [ObjectIds.LockOnBlue]: { width: 68, height: 68 },
  [ObjectIds.LockOnPurple]: { width: 70, height: 70 },
  [ObjectIds.LockOnGreen]: { width: 60, height: 70 },

  // 図形
  [ObjectIds.ShapeCircle]: { width: 32, height: 32 },
  [ObjectIds.ShapeCross]: { width: 32, height: 32 },
  [ObjectIds.ShapeTriangle]: { width: 32, height: 32 },
  [ObjectIds.ShapeSquare]: { width: 32, height: 32 },
  [ObjectIds.ShapeArrow]: { width: 32, height: 32 },
  [ObjectIds.ShapeRotation]: { width: 32, height: 32 },
  [ObjectIds.EmphasisCircle]: { width: 56, height: 56 },
  [ObjectIds.EmphasisCross]: { width: 68, height: 68 },
  [ObjectIds.EmphasisSquare]: { width: 64, height: 64 },
  [ObjectIds.EmphasisTriangle]: { width: 64, height: 64 },
  [ObjectIds.Clockwise]: { width: 72, height: 40 },
  [ObjectIds.CounterClockwise]: { width: 72, height: 40 },

  // テキスト / グループ（デフォルト）
  [ObjectIds.Text]: { width: 40, height: 20 },
  [ObjectIds.Group]: { width: 16, height: 16 },
};

/** デフォルトサイズ */
const DEFAULT_SIZE = { width: 32, height: 32 };

/** 背景サイズ定数 */
const BACKGROUND_SIZES = {
  SQUARE_GRAY_BASE: 100,
  SQUARE_GRAY_MULTIPLIER: 3.5,
} as const;

/**
 * チェッカーパターンの定義
 */
function CheckerPattern({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} patternUnits="userSpaceOnUse" width="32" height="32">
        <rect width="32" height="32" fill="#2a2a2a" />
        <rect width="16" height="16" fill="#3a3a3a" />
        <rect x="16" y="16" width="16" height="16" fill="#3a3a3a" />
      </pattern>
    </defs>
  );
}

/**
 * 背景レンダラー
 */
function BackgroundRenderer({
  backgroundId,
  width,
  height,
}: {
  backgroundId: BackgroundId;
  width: number;
  height: number;
}) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 10;
  const squareSize = Math.min(width, height) - 20;
  const squareGraySize =
    BACKGROUND_SIZES.SQUARE_GRAY_BASE * BACKGROUND_SIZES.SQUARE_GRAY_MULTIPLIER;

  switch (backgroundId) {
    case 1: // 設定なし
      return null;

    case 2: // 全面チェック
      return (
        <g>
          <rect width={width} height={height} fill="#2a2a2a" />
          <CheckerPattern id="full-checker" />
          <rect width={width} height={height} fill="url(#full-checker)" />
        </g>
      );

    case 3: // 円形チェック
      return (
        <g>
          <CheckerPattern id="circle-checker" />
          <circle cx={cx} cy={cy} r={radius} fill="url(#circle-checker)" />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#666" strokeWidth="2" />
        </g>
      );

    case 4: // 正方形チェック
      return (
        <g>
          <CheckerPattern id="square-checker" />
          <rect
            x={(width - squareSize) / 2}
            y={(height - squareSize) / 2}
            width={squareSize}
            height={squareSize}
            fill="url(#square-checker)"
          />
          <rect
            x={(width - squareSize) / 2}
            y={(height - squareSize) / 2}
            width={squareSize}
            height={squareSize}
            fill="none"
            stroke="#666"
            strokeWidth="2"
          />
        </g>
      );

    case 5: // 全面グレー
      return <rect width={width} height={height} fill="#3a3a3a" />;

    case 6: // 円形グレー
      return (
        <g>
          <circle cx={cx} cy={cy} r={radius} fill="#3a3a3a" />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#666" strokeWidth="2" />
        </g>
      );

    case 7: // 正方形グレー
      return (
        <g>
          <rect
            x={(width - squareGraySize) / 2}
            y={(height - squareGraySize) / 2}
            width={squareGraySize}
            height={squareGraySize}
            fill="#3a3a3a"
          />
          <rect
            x={(width - squareGraySize) / 2}
            y={(height - squareGraySize) / 2}
            width={squareGraySize}
            height={squareGraySize}
            fill="none"
            stroke="#666"
            strokeWidth="2"
          />
        </g>
      );

    default:
      return null;
  }
}

/**
 * 単一オブジェクトをレンダリング
 */
function ObjectRenderer({ object }: { object: BoardObject }) {
  const { objectId, position, rotation, size, color, flags } = object;

  // サイズスケール計算
  const scale = size / 100;

  // バウンディングボックスサイズ取得
  const bboxSize = OBJECT_BBOX_SIZES[objectId] ?? DEFAULT_SIZE;

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

      {/* 背景パターン */}
      <BackgroundRenderer backgroundId={backgroundId} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

      {/* オブジェクト */}
      {visibleObjects.map((obj, index) => (
        <ObjectRenderer key={index} object={obj} />
      ))}
    </svg>
  );

  return renderToStaticMarkup(svgElement);
}

