/**
 * オブジェクトパレットコンポーネント
 *
 * カテゴリ別にオブジェクトを表示し、クリックでボードに追加
 */

import React, { useState, useRef, useEffect } from "react";
import { ObjectRenderer } from "@/components/board";
import { ObjectNames, ObjectIds } from "@/lib/stgy";
import { useEditor, createDefaultObject } from "@/lib/editor";

/** オブジェクトカテゴリ */
const OBJECT_CATEGORIES: Record<string, { name: string; ids: number[] }> = {
  fields: {
    name: "フィールド",
    ids: [
      ObjectIds.CircleWhiteSolid,
      ObjectIds.CircleWhiteTile,
      ObjectIds.CircleGraySolid,
      ObjectIds.CircleCheck,
      ObjectIds.CircleGray,
      ObjectIds.SquareWhiteSolid,
      ObjectIds.SquareWhiteTile,
      ObjectIds.SquareGraySolid,
      ObjectIds.SquareCheck,
      ObjectIds.SquareGray,
    ],
  },
  attacks: {
    name: "攻撃範囲",
    ids: [
      ObjectIds.CircleAoE,
      ObjectIds.ConeAoE,
      ObjectIds.LineAoE,
      ObjectIds.Line,
      ObjectIds.DonutAoE,
      ObjectIds.Stack,
      ObjectIds.StackLine,
      ObjectIds.StackChain,
      ObjectIds.Proximity,
      ObjectIds.ProximityTarget,
      ObjectIds.Tankbuster,
      ObjectIds.KnockbackRadial,
      ObjectIds.KnockbackLine,
      ObjectIds.Block,
      ObjectIds.Gaze,
      ObjectIds.TargetMarker,
      ObjectIds.CircleAoEMoving,
      ObjectIds.Area1P,
      ObjectIds.Area2P,
      ObjectIds.Area3P,
      ObjectIds.Area4P,
    ],
  },
  roles: {
    name: "ロール",
    ids: [
      ObjectIds.Tank,
      ObjectIds.Tank1,
      ObjectIds.Tank2,
      ObjectIds.Healer,
      ObjectIds.Healer1,
      ObjectIds.Healer2,
      ObjectIds.DPS,
      ObjectIds.DPS1,
      ObjectIds.DPS2,
      ObjectIds.DPS3,
      ObjectIds.DPS4,
      ObjectIds.MeleeDPS,
      ObjectIds.RangedDPS,
      ObjectIds.PhysicalRangedDPS,
      ObjectIds.MagicalRangedDPS,
      ObjectIds.PureHealer,
      ObjectIds.BarrierHealer,
    ],
  },
  jobs: {
    name: "ジョブ",
    ids: [
      // タンク
      ObjectIds.Paladin,
      ObjectIds.Warrior,
      ObjectIds.DarkKnight,
      ObjectIds.Gunbreaker,
      // ヒーラー
      ObjectIds.WhiteMage,
      ObjectIds.Scholar,
      ObjectIds.Astrologian,
      ObjectIds.Sage,
      // 近接DPS
      ObjectIds.Monk,
      ObjectIds.Dragoon,
      ObjectIds.Ninja,
      ObjectIds.Samurai,
      ObjectIds.Reaper,
      ObjectIds.Viper,
      // 遠隔物理DPS
      ObjectIds.Bard,
      ObjectIds.Machinist,
      ObjectIds.Dancer,
      // 遠隔魔法DPS
      ObjectIds.BlackMage,
      ObjectIds.Summoner,
      ObjectIds.RedMage,
      ObjectIds.Pictomancer,
      ObjectIds.BlueMage,
    ],
  },
  enemies: {
    name: "エネミー",
    ids: [ObjectIds.EnemySmall, ObjectIds.EnemyMedium, ObjectIds.EnemyLarge],
  },
  markers: {
    name: "マーカー",
    ids: [
      ObjectIds.Attack1,
      ObjectIds.Attack2,
      ObjectIds.Attack3,
      ObjectIds.Attack4,
      ObjectIds.Attack5,
      ObjectIds.Attack6,
      ObjectIds.Attack7,
      ObjectIds.Attack8,
      ObjectIds.Bind1,
      ObjectIds.Bind2,
      ObjectIds.Bind3,
      ObjectIds.Ignore1,
      ObjectIds.Ignore2,
      ObjectIds.Square,
      ObjectIds.Circle,
      ObjectIds.Plus,
      ObjectIds.Triangle,
    ],
  },
  waymarks: {
    name: "フィールドマーカー",
    ids: [
      ObjectIds.WaymarkA,
      ObjectIds.WaymarkB,
      ObjectIds.WaymarkC,
      ObjectIds.WaymarkD,
      ObjectIds.Waymark1,
      ObjectIds.Waymark2,
      ObjectIds.Waymark3,
      ObjectIds.Waymark4,
    ],
  },
  shapes: {
    name: "図形",
    ids: [
      ObjectIds.ShapeCircle,
      ObjectIds.ShapeCross,
      ObjectIds.ShapeTriangle,
      ObjectIds.ShapeSquare,
      ObjectIds.ShapeArrow,
      ObjectIds.ShapeRotation,
      ObjectIds.EmphasisCircle,
      ObjectIds.EmphasisCross,
      ObjectIds.EmphasisSquare,
      ObjectIds.EmphasisTriangle,
      ObjectIds.Clockwise,
      ObjectIds.CounterClockwise,
    ],
  },
  other: {
    name: "その他",
    ids: [
      ObjectIds.Text,
      ObjectIds.Buff,
      ObjectIds.Debuff,
      ObjectIds.LockOnRed,
      ObjectIds.LockOnBlue,
      ObjectIds.LockOnPurple,
      ObjectIds.LockOnGreen,
    ],
  },
};

/**
 * オブジェクトパレットコンポーネント
 */
export function ObjectPalette() {
  const { addObject } = useEditor();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["roles", "attacks"])
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleAddObject = (objectId: number) => {
    addObject(objectId);
  };

  return (
    <div className="h-full bg-slate-800 overflow-y-auto">
      <div className="p-3 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-200">オブジェクト</h2>
      </div>

      <div className="p-2">
        {Object.entries(OBJECT_CATEGORIES).map(([key, { name, ids }]) => (
          <div key={key} className="mb-2">
            {/* カテゴリヘッダー */}
            <button
              type="button"
              onClick={() => toggleCategory(key)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors"
            >
              <span>{name}</span>
              <span className="text-xs text-slate-500">
                {expandedCategories.has(key) ? "▼" : "▶"}
              </span>
            </button>

            {/* カテゴリ内オブジェクト */}
            {expandedCategories.has(key) && (
              <div className="grid grid-cols-4 gap-1 mt-1 px-1">
                {ids.map((objectId) => (
                  <ObjectPaletteItem
                    key={objectId}
                    objectId={objectId}
                    onClick={() => handleAddObject(objectId)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** フィールドオブジェクトのID一覧 */
const FIELD_OBJECT_IDS = [
  ObjectIds.CircleWhiteSolid,
  ObjectIds.CircleWhiteTile,
  ObjectIds.CircleGraySolid,
  ObjectIds.CircleCheck,
  ObjectIds.CircleGray,
  ObjectIds.SquareWhiteSolid,
  ObjectIds.SquareWhiteTile,
  ObjectIds.SquareGraySolid,
  ObjectIds.SquareCheck,
  ObjectIds.SquareGray,
];

/**
 * パレットアイテムコンポーネント
 */
function ObjectPaletteItem({
  objectId,
  onClick,
}: {
  objectId: number;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  
  // フィールドオブジェクトかどうかでviewBoxを調整
  const isFieldObject = FIELD_OBJECT_IDS.includes(objectId);
  
  // viewBoxサイズを決定（フィールドオブジェクトは256pxなので広い範囲を表示）
  const viewBoxSize = isFieldObject ? 280 : 40;
  const objectPos = viewBoxSize / 2;
  
  const object = createDefaultObject(objectId, { x: objectPos, y: objectPos });
  const name = ObjectNames[objectId] ?? `ID: ${objectId}`;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/x-object-id", String(objectId));
    e.dataTransfer.effectAllowed = "copy";
  };

  // ツールチップ位置の計算
  useEffect(() => {
    if (isHovered && buttonRef.current && tooltipRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // ツールチップの中央位置
      let left = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2;

      // 左端からはみ出す場合
      if (left < 8) {
        left = 8;
      }
      // 右端からはみ出す場合
      if (left + tooltipRect.width > viewportWidth - 8) {
        left = viewportWidth - tooltipRect.width - 8;
      }

      setTooltipStyle({
        position: "fixed",
        left: `${left}px`,
        top: `${buttonRect.top - tooltipRect.height - 8}px`,
      });
    }
  }, [isHovered]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        draggable
        onDragStart={handleDragStart}
        className="p-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors cursor-grab active:cursor-grabbing w-full"
      >
        <svg
          width={40}
          height={40}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="bg-slate-800 rounded pointer-events-none"
        >
          <ObjectRenderer
            object={object}
            index={0}
            showBoundingBox={false}
            selected={false}
          />
        </svg>
      </button>
      {/* カスタムツールチップ */}
      {isHovered && (
        <div
          ref={tooltipRef}
          className="z-50 pointer-events-none"
          style={tooltipStyle}
        >
          <div className="px-2 py-1 text-xs font-medium text-white bg-slate-900/95 rounded shadow-lg whitespace-nowrap border border-slate-600">
            {name}
          </div>
        </div>
      )}
    </div>
  );
}
