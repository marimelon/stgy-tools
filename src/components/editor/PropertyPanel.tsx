/**
 * プロパティパネルコンポーネント
 *
 * 選択オブジェクトのプロパティを編集
 */

import { useEditor } from "@/lib/editor";
import { ObjectNames, ObjectIds, BackgroundId } from "@/lib/stgy";
import type { BoardObject } from "@/lib/stgy";

/** 背景名のマッピング */
const BACKGROUND_NAMES: Record<BackgroundId, string> = {
  [BackgroundId.None]: "なし",
  [BackgroundId.FullCheck]: "全面チェック",
  [BackgroundId.CircleCheck]: "円形チェック",
  [BackgroundId.SquareCheck]: "四角チェック",
  [BackgroundId.FullGray]: "全面グレー",
  [BackgroundId.CircleGray]: "円形グレー",
  [BackgroundId.SquareGray]: "四角グレー",
};

/**
 * プロパティパネル
 */
export function PropertyPanel() {
  const { state, selectedObjects, updateObject, commitHistory, updateBoardMeta } = useEditor();
  const { selectedIndices, board } = state;

  // 単一選択のみ編集可能
  const selectedObject = selectedObjects.length === 1 ? selectedObjects[0] : null;
  const selectedIndex = selectedIndices.length === 1 ? selectedIndices[0] : null;

  // オブジェクト未選択時はボード情報を表示
  if (!selectedObject || selectedIndex === null) {
    return (
      <div className="w-72 bg-slate-800 border-l border-slate-700 overflow-y-auto">
        <div className="p-3 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-slate-200">ボード設定</h2>
        </div>

        <div className="p-3 space-y-4">
          {/* ボード名 */}
          <PropertySection title="ボード名">
            <input
              type="text"
              value={board.name}
              onChange={(e) => updateBoardMeta({ name: e.target.value })}
              onBlur={() => commitHistory("ボード名変更")}
              placeholder="ボード名を入力"
              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </PropertySection>

          {/* 背景 */}
          <PropertySection title="背景">
            <select
              value={board.backgroundId}
              onChange={(e) => {
                updateBoardMeta({ backgroundId: Number(e.target.value) as BackgroundId });
                commitHistory("背景変更");
              }}
              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {Object.entries(BACKGROUND_NAMES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </PropertySection>

          {/* ボードサイズ（参考情報） */}
          <PropertySection title="サイズ">
            <div className="text-sm text-slate-300">
              {board.width} × {board.height}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ※エクスポート時に自動計算されます
            </div>
          </PropertySection>
        </div>
      </div>
    );
  }

  const handleChange = (updates: Partial<BoardObject>) => {
    updateObject(selectedIndex, updates);
  };

  const handleChangeAndCommit = (
    updates: Partial<BoardObject>,
    description: string
  ) => {
    updateObject(selectedIndex, updates);
    commitHistory(description);
  };

  const objectName = ObjectNames[selectedObject.objectId] ?? "不明";
  const isTextObject = selectedObject.objectId === ObjectIds.Text;
  const isConeAoE = selectedObject.objectId === ObjectIds.ConeAoE;
  const isDonutAoE = selectedObject.objectId === ObjectIds.DonutAoE;

  return (
    <div className="w-72 bg-slate-800 border-l border-slate-700 overflow-y-auto">
      <div className="p-3 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-200">プロパティ</h2>
      </div>

      <div className="p-3 space-y-4">
        {/* オブジェクト情報 */}
        <div>
          <div className="text-xs text-slate-400 mb-1">オブジェクト</div>
          <div className="text-sm text-slate-200">
            {objectName} (ID: {selectedObject.objectId})
          </div>
        </div>

        {/* 位置 */}
        <PropertySection title="位置">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="X"
              value={selectedObject.position.x}
              min={0}
              max={512}
              step={1}
              onChange={(x) =>
                handleChange({ position: { ...selectedObject.position, x } })
              }
              onBlur={() => commitHistory("位置変更")}
            />
            <NumberInput
              label="Y"
              value={selectedObject.position.y}
              min={0}
              max={384}
              step={1}
              onChange={(y) =>
                handleChange({ position: { ...selectedObject.position, y } })
              }
              onBlur={() => commitHistory("位置変更")}
            />
          </div>
        </PropertySection>

        {/* 変形 */}
        <PropertySection title="変形">
          <div className="space-y-2">
            <SliderInput
              label="回転"
              value={selectedObject.rotation}
              min={-180}
              max={180}
              step={1}
              unit="°"
              onChange={(rotation) => handleChange({ rotation })}
              onBlur={() => commitHistory("回転変更")}
            />
            <SliderInput
              label="サイズ"
              value={selectedObject.size}
              min={50}
              max={200}
              step={1}
              unit="%"
              onChange={(size) => handleChange({ size })}
              onBlur={() => commitHistory("サイズ変更")}
            />
          </div>
        </PropertySection>

        {/* 色 */}
        <PropertySection title="色">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={rgbToHex(
                  selectedObject.color.r,
                  selectedObject.color.g,
                  selectedObject.color.b
                )}
                onChange={(e) => {
                  const { r, g, b } = hexToRgb(e.target.value);
                  handleChange({ color: { ...selectedObject.color, r, g, b } });
                }}
                onBlur={() => commitHistory("色変更")}
                className="w-10 h-8 rounded cursor-pointer"
              />
              <span className="text-xs text-slate-400">
                RGB({selectedObject.color.r}, {selectedObject.color.g},{" "}
                {selectedObject.color.b})
              </span>
            </div>
            <SliderInput
              label="透過度"
              value={selectedObject.color.opacity}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(opacity) =>
                handleChange({ color: { ...selectedObject.color, opacity } })
              }
              onBlur={() => commitHistory("透過度変更")}
            />
          </div>
        </PropertySection>

        {/* フラグ */}
        <PropertySection title="状態">
          <div className="space-y-2">
            <Checkbox
              label="表示"
              checked={selectedObject.flags.visible}
              onChange={(visible) =>
                handleChangeAndCommit(
                  { flags: { ...selectedObject.flags, visible } },
                  "表示状態変更"
                )
              }
            />
            <Checkbox
              label="左右反転"
              checked={selectedObject.flags.flipHorizontal}
              onChange={(flipHorizontal) =>
                handleChangeAndCommit(
                  { flags: { ...selectedObject.flags, flipHorizontal } },
                  "反転変更"
                )
              }
            />
            <Checkbox
              label="上下反転"
              checked={selectedObject.flags.flipVertical}
              onChange={(flipVertical) =>
                handleChangeAndCommit(
                  { flags: { ...selectedObject.flags, flipVertical } },
                  "反転変更"
                )
              }
            />
            <Checkbox
              label="ロック解除"
              checked={selectedObject.flags.unlocked}
              onChange={(unlocked) =>
                handleChangeAndCommit(
                  { flags: { ...selectedObject.flags, unlocked } },
                  "ロック変更"
                )
              }
            />
          </div>
        </PropertySection>

        {/* テキスト (テキストオブジェクトのみ) */}
        {isTextObject && (
          <PropertySection title="テキスト">
            <input
              type="text"
              value={selectedObject.text ?? ""}
              onChange={(e) => handleChange({ text: e.target.value })}
              onBlur={() => commitHistory("テキスト変更")}
              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </PropertySection>
        )}

        {/* 固有パラメータ */}
        {isConeAoE && (
          <PropertySection title="扇の角度">
            <SliderInput
              label="角度"
              value={selectedObject.param1 ?? 90}
              min={15}
              max={360}
              step={5}
              unit="°"
              onChange={(param1) => handleChange({ param1 })}
              onBlur={() => commitHistory("角度変更")}
            />
          </PropertySection>
        )}

        {isDonutAoE && (
          <PropertySection title="ドーナツ内径">
            <SliderInput
              label="内径"
              value={selectedObject.param2 ?? 50}
              min={10}
              max={90}
              step={5}
              unit="%"
              onChange={(param2) => handleChange({ param2 })}
              onBlur={() => commitHistory("内径変更")}
            />
          </PropertySection>
        )}
      </div>
    </div>
  );
}

/**
 * プロパティセクション
 */
function PropertySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-2">{title}</div>
      {children}
    </div>
  );
}

/**
 * 数値入力
 */
function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onBlur,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-0.5">{label}</label>
      <input
        type="number"
        value={Math.round(value * 10) / 10}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onBlur}
        className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
      />
    </div>
  );
}

/**
 * スライダー入力
 */
function SliderInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  onBlur,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  onBlur?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-slate-500">{label}</label>
        <span className="text-xs text-slate-400">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onBlur}
        onTouchEnd={onBlur}
        className="w-full h-1.5 bg-slate-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
      />
    </div>
  );
}

/**
 * チェックボックス
 */
function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
      />
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
}

/**
 * RGB → Hex変換
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Hex → RGB変換
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}
