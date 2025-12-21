/**
 * オブジェクトプロパティパネルコンポーネント
 *
 * 選択オブジェクトのプロパティを編集
 */

import { rgbToHex, hexToRgb } from "@/lib/editor";
import { ObjectNames, ObjectIds } from "@/lib/stgy";
import type { BoardObject } from "@/lib/stgy";
import { PropertySection, NumberInput, SliderInput, Checkbox } from "./FormInputs";

/**
 * オブジェクトプロパティパネルのProps
 */
export interface ObjectPropertyPanelProps {
  /** 選択されたオブジェクト */
  object: BoardObject;
  /** オブジェクト更新時のコールバック */
  onUpdate: (updates: Partial<BoardObject>) => void;
  /** 履歴コミット時のコールバック */
  onCommitHistory: (description: string) => void;
}

/**
 * オブジェクトプロパティパネル
 */
export function ObjectPropertyPanel({
  object,
  onUpdate,
  onCommitHistory,
}: ObjectPropertyPanelProps) {
  const handleChange = (updates: Partial<BoardObject>) => {
    onUpdate(updates);
  };

  const handleChangeAndCommit = (
    updates: Partial<BoardObject>,
    description: string
  ) => {
    onUpdate(updates);
    onCommitHistory(description);
  };

  const objectName = ObjectNames[object.objectId] ?? "不明";
  const isTextObject = object.objectId === ObjectIds.Text;
  const isConeAoE = object.objectId === ObjectIds.ConeAoE;
  const isDonutAoE = object.objectId === ObjectIds.DonutAoE;

  return (
    <div className="h-full bg-slate-800 overflow-y-auto">
      <div className="p-3 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-200">プロパティ</h2>
      </div>

      <div className="p-3 space-y-4">
        {/* オブジェクト情報 */}
        <div>
          <div className="text-xs text-slate-400 mb-1">オブジェクト</div>
          <div className="text-sm text-slate-200">
            {objectName} (ID: {object.objectId})
          </div>
        </div>

        {/* 位置 */}
        <PropertySection title="位置">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="X"
              value={object.position.x}
              min={0}
              max={512}
              step={1}
              onChange={(x) =>
                handleChange({ position: { ...object.position, x } })
              }
              onBlur={() => onCommitHistory("位置変更")}
            />
            <NumberInput
              label="Y"
              value={object.position.y}
              min={0}
              max={384}
              step={1}
              onChange={(y) =>
                handleChange({ position: { ...object.position, y } })
              }
              onBlur={() => onCommitHistory("位置変更")}
            />
          </div>
        </PropertySection>

        {/* 変形 */}
        <PropertySection title="変形">
          <div className="space-y-2">
            <SliderInput
              label="回転"
              value={object.rotation}
              min={-180}
              max={180}
              step={1}
              unit="°"
              onChange={(rotation) => handleChange({ rotation })}
              onBlur={() => onCommitHistory("回転変更")}
            />
            <SliderInput
              label="サイズ"
              value={object.size}
              min={50}
              max={200}
              step={1}
              unit="%"
              onChange={(size) => handleChange({ size })}
              onBlur={() => onCommitHistory("サイズ変更")}
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
                  object.color.r,
                  object.color.g,
                  object.color.b
                )}
                onChange={(e) => {
                  const { r, g, b } = hexToRgb(e.target.value);
                  handleChange({ color: { ...object.color, r, g, b } });
                }}
                onBlur={() => onCommitHistory("色変更")}
                className="w-10 h-8 rounded cursor-pointer"
              />
              <span className="text-xs text-slate-400">
                RGB({object.color.r}, {object.color.g},{" "}
                {object.color.b})
              </span>
            </div>
            <SliderInput
              label="透過度"
              value={object.color.opacity}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(opacity) =>
                handleChange({ color: { ...object.color, opacity } })
              }
              onBlur={() => onCommitHistory("透過度変更")}
            />
          </div>
        </PropertySection>

        {/* フラグ */}
        <PropertySection title="状態">
          <div className="space-y-2">
            <Checkbox
              label="表示"
              checked={object.flags.visible}
              onChange={(visible) =>
                handleChangeAndCommit(
                  { flags: { ...object.flags, visible } },
                  "表示状態変更"
                )
              }
            />
            <Checkbox
              label="左右反転"
              checked={object.flags.flipHorizontal}
              onChange={(flipHorizontal) =>
                handleChangeAndCommit(
                  { flags: { ...object.flags, flipHorizontal } },
                  "反転変更"
                )
              }
            />
            <Checkbox
              label="上下反転"
              checked={object.flags.flipVertical}
              onChange={(flipVertical) =>
                handleChangeAndCommit(
                  { flags: { ...object.flags, flipVertical } },
                  "反転変更"
                )
              }
            />
            <Checkbox
              label="ロック解除"
              checked={object.flags.unlocked}
              onChange={(unlocked) =>
                handleChangeAndCommit(
                  { flags: { ...object.flags, unlocked } },
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
              value={object.text ?? ""}
              onChange={(e) => handleChange({ text: e.target.value })}
              onBlur={() => onCommitHistory("テキスト変更")}
              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </PropertySection>
        )}

        {/* 固有パラメータ */}
        {isConeAoE && (
          <PropertySection title="扇の角度">
            <SliderInput
              label="角度"
              value={object.param1 ?? 90}
              min={15}
              max={360}
              step={5}
              unit="°"
              onChange={(param1) => handleChange({ param1 })}
              onBlur={() => onCommitHistory("角度変更")}
            />
          </PropertySection>
        )}

        {isDonutAoE && (
          <PropertySection title="ドーナツ内径">
            <SliderInput
              label="内径"
              value={object.param2 ?? 50}
              min={10}
              max={90}
              step={5}
              unit="%"
              onChange={(param2) => handleChange({ param2 })}
              onBlur={() => onCommitHistory("内径変更")}
            />
          </PropertySection>
        )}
      </div>
    </div>
  );
}
