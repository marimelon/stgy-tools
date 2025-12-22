/**
 * オブジェクトプロパティパネルコンポーネント
 *
 * shadcn/ui ベースの選択オブジェクトプロパティ編集
 */

import { rgbToHex, hexToRgb, useDebugMode } from "@/lib/editor";
import {
  ObjectNames,
  ObjectIds,
  OBJECT_FLIP_FLAGS,
  DEFAULT_FLIP_FLAGS,
  OBJECT_EDIT_PARAMS,
  DEFAULT_EDIT_PARAMS,
  EDIT_PARAMS,
  EditParamIds,
} from "@/lib/stgy";
import type { BoardObject } from "@/lib/stgy";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PropertySection, NumberInput, SliderInput, Checkbox } from "./FormInputs";
import { ColorPalette } from "./ColorPalette";

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
  const { debugMode } = useDebugMode();

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
  const isLineObject = object.objectId === ObjectIds.Line;

  // Lineの角度変更時に中央を軸として回転
  const handleLineRotationChange = (newRotation: number) => {
    const startX = object.position.x;
    const startY = object.position.y;
    const endX = (object.param1 ?? startX * 10 + 2560) / 10;
    const endY = (object.param2 ?? startY * 10) / 10;
    
    // 線分の中央点を計算
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    
    // 中央から端点までの長さ（線分の長さの半分）
    const dx = endX - startX;
    const dy = endY - startY;
    const halfLength = Math.sqrt(dx * dx + dy * dy) / 2;
    
    // 新しい角度で中央から始点・終点を計算
    const radians = newRotation * Math.PI / 180;
    const offsetX = halfLength * Math.cos(radians);
    const offsetY = halfLength * Math.sin(radians);
    
    // 新しい始点（中央から逆方向）
    const newStartX = centerX - offsetX;
    const newStartY = centerY - offsetY;
    
    // 新しい終点（中央から正方向）
    const newEndX = centerX + offsetX;
    const newEndY = centerY + offsetY;
    
    handleChange({
      rotation: newRotation,
      position: { x: newStartX, y: newStartY },
      param1: Math.round(newEndX * 10),
      param2: Math.round(newEndY * 10),
    });
  };
  
  // 反転可能フラグを取得
  const flipFlags = OBJECT_FLIP_FLAGS[object.objectId] ?? DEFAULT_FLIP_FLAGS;
  const canFlipHorizontal = flipFlags.horizontal;
  const canFlipVertical = flipFlags.vertical;

  // 編集可能パラメータを取得
  const editParams = OBJECT_EDIT_PARAMS[object.objectId] ?? DEFAULT_EDIT_PARAMS;
  
  // 追加パラメータ（サイズ、回転、透過度以外）をフィルタリング
  const additionalParams = editParams.filter(
    (paramId) =>
      paramId !== EditParamIds.None &&
      paramId !== EditParamIds.Size &&
      paramId !== EditParamIds.SizeSmall &&
      paramId !== EditParamIds.Rotation &&
      paramId !== EditParamIds.Opacity
  );

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
              onChange={isLineObject ? handleLineRotationChange : (rotation) => handleChange({ rotation })}
              onBlur={() => onCommitHistory("回転変更")}
            />
            {!isLineObject && (() => {
              // オブジェクトタイプに応じたサイズパラメータを取得
              const editParams = OBJECT_EDIT_PARAMS[object.objectId] ?? DEFAULT_EDIT_PARAMS;
              const sizeParamId = editParams.includes(EditParamIds.SizeSmall)
                ? EditParamIds.SizeSmall
                : EditParamIds.Size;
              const sizeParam = EDIT_PARAMS[sizeParamId];
              return (
                <SliderInput
                  label="サイズ"
                  value={object.size}
                  min={sizeParam.min}
                  max={sizeParam.max}
                  step={1}
                  unit="%"
                  onChange={(size) => handleChange({ size })}
                  onBlur={() => onCommitHistory("サイズ変更")}
                />
              );
            })()}
          </div>
        </PropertySection>

        {/* 色 */}
        <PropertySection title="色">
          <div className="space-y-3">
            {/* カラーピッカー（デバッグモード時のみ） */}
            {debugMode && (
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
            )}
            {/* カラーパレット */}
            <ColorPalette
              currentColor={object.color}
              onColorSelect={(color) => {
                handleChange({ color: { ...object.color, ...color } });
                onCommitHistory("色変更");
              }}
            />
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
            {canFlipHorizontal && (
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
            )}
            {canFlipVertical && (
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
            )}
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

        {/* 固有パラメータ（動的生成） */}
        {additionalParams.length > 0 && (
          <PropertySection title="固有パラメータ">
            <div className="space-y-3">
              {additionalParams.map((paramId) => {
                const paramDef = EDIT_PARAMS[paramId];
                if (!paramDef) return null;
                
                // 各パラメータIDに対応するオブジェクトプロパティを決定
                let value: number;
                let onChange: (v: number) => void;
                
                if (paramId === EditParamIds.ConeAngle) {
                  value = object.param1 ?? paramDef.defaultValue;
                  onChange = (v) => handleChange({ param1: v });
                } else if (paramId === EditParamIds.DonutRange) {
                  value = object.param2 ?? paramDef.defaultValue;
                  onChange = (v) => handleChange({ param2: v });
                } else if (paramId === EditParamIds.DisplayCount) {
                  value = object.param1 ?? paramDef.defaultValue;
                  onChange = (v) => handleChange({ param1: v });
                } else if (paramId === EditParamIds.HeightCount) {
                  value = object.param1 ?? paramDef.defaultValue;
                  onChange = (v) => handleChange({ param1: v });
                } else if (paramId === EditParamIds.WidthCount) {
                  value = object.param2 ?? paramDef.defaultValue;
                  onChange = (v) => handleChange({ param2: v });
                } else if (paramId === EditParamIds.LineWidth) {
                  // Lineの場合はparam3（線の太さ）、それ以外はparam1
                  if (isLineObject) {
                    value = object.param3 ?? paramDef.defaultValue;
                    onChange = (v) => handleChange({ param3: v });
                  } else {
                    value = object.param1 ?? paramDef.defaultValue;
                    onChange = (v) => handleChange({ param1: v });
                  }
                } else if (paramId === EditParamIds.Height) {
                  value = object.param1 ?? paramDef.defaultValue;
                  onChange = (v) => handleChange({ param1: v });
                } else if (paramId === EditParamIds.Width) {
                  value = object.param2 ?? paramDef.defaultValue;
                  onChange = (v) => handleChange({ param2: v });
                } else {
                  return null;
                }

                // 単位を決定
                const unit = paramId === EditParamIds.ConeAngle ? "°" :
                             paramId === EditParamIds.DonutRange ? "%" : "";

                return paramDef.useSlider ? (
                  <SliderInput
                    key={paramId}
                    label={paramDef.name}
                    value={value}
                    min={paramDef.min}
                    max={paramDef.max}
                    step={1}
                    unit={unit}
                    onChange={onChange}
                    onBlur={() => onCommitHistory(`${paramDef.name}変更`)}
                  />
                ) : (
                  <NumberInput
                    key={paramId}
                    label={paramDef.name}
                    value={value}
                    min={paramDef.min}
                    max={paramDef.max}
                    step={1}
                    onChange={onChange}
                    onBlur={() => onCommitHistory(`${paramDef.name}変更`)}
                  />
                );
              })}
            </div>
          </PropertySection>
        )}
      </div>
    </div>
  );
}
