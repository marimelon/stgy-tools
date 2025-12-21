/**
 * オブジェクトプロパティパネルコンポーネント
 *
 * shadcn/ui ベースの選択オブジェクトプロパティ編集
 */

import { rgbToHex, hexToRgb } from "@/lib/editor";
import { ObjectNames, ObjectIds } from "@/lib/stgy";
import type { BoardObject } from "@/lib/stgy";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    <div className="panel h-full overflow-y-auto">
      <div className="panel-header">
        <h2 className="panel-title">プロパティ</h2>
      </div>

      <div className="p-4 space-y-1">
        {/* オブジェクト情報 */}
        <div className="mb-4">
          <div className="text-xs font-medium mb-1.5 uppercase tracking-wide text-muted-foreground font-display">
            オブジェクト
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{objectName}</span>
            <Badge variant="secondary" className="font-mono text-xs">
              ID: {object.objectId}
            </Badge>
          </div>
        </div>

        {/* 位置 */}
        <PropertySection title="位置">
          <div className="grid grid-cols-2 gap-3">
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
          <div className="space-y-3">
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
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative rounded-md overflow-hidden border-2 border-border">
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
                  className="w-10 h-8 cursor-pointer border-0 bg-transparent"
                />
              </div>
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-mono">
                RGB({object.color.r}, {object.color.g}, {object.color.b})
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
          <div className="space-y-2.5">
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
              label="ロック"
              checked={object.flags.locked}
              onChange={(locked) =>
                handleChangeAndCommit(
                  { flags: { ...object.flags, locked } },
                  "ロック変更"
                )
              }
            />
          </div>
        </PropertySection>

        {/* テキスト (テキストオブジェクトのみ) */}
        {isTextObject && (
          <PropertySection title="テキスト">
            <Input
              type="text"
              value={object.text ?? ""}
              onChange={(e) => handleChange({ text: e.target.value })}
              onBlur={() => onCommitHistory("テキスト変更")}
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
