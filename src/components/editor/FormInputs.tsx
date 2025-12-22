/**
 * フォーム入力コンポーネント
 *
 * shadcn/ui ベースのプロパティパネル用入力部品
 */

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * プロパティセクション
 */
export function PropertySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="text-xs font-medium mb-2 uppercase tracking-wide text-muted-foreground font-display">
        {title}
      </div>
      {children}
    </div>
  );
}

/**
 * 数値入力コンポーネントのProps
 */
export interface NumberInputProps {
  /** ラベル */
  label: string;
  /** 現在の値 */
  value: number;
  /** 最小値 */
  min: number;
  /** 最大値 */
  max: number;
  /** ステップ */
  step: number;
  /** 値変更時のコールバック */
  onChange: (value: number) => void;
  /** フォーカスが外れた時のコールバック */
  onBlur?: () => void;
}

/**
 * 数値入力
 */
export function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onBlur,
}: NumberInputProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={Math.round(value * 10) / 10}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onBlur}
        className="font-mono"
      />
    </div>
  );
}

/**
 * スライダー入力コンポーネントのProps
 */
export interface SliderInputProps {
  /** ラベル */
  label: string;
  /** 現在の値 */
  value: number;
  /** 最小値 */
  min: number;
  /** 最大値 */
  max: number;
  /** ステップ */
  step: number;
  /** 単位（例: "°", "%"） */
  unit?: string;
  /** 値変更時のコールバック */
  onChange: (value: number) => void;
  /** フォーカスが外れた時のコールバック */
  onBlur?: () => void;
}

/**
 * スライダー入力
 */
export function SliderInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  onBlur,
}: SliderInputProps) {
  // 入力値をmin/max範囲にクランプ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // 空文字や入力中の "-" を許容
    if (inputValue === "" || inputValue === "-") {
      return;
    }
    const numValue = Number(inputValue);
    if (!Number.isNaN(numValue)) {
      const clampedValue = Math.min(max, Math.max(min, numValue));
      onChange(clampedValue);
    }
  };

  // フォーカスが外れたときに値を正規化
  const handleInputBlur = () => {
    onBlur?.();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={Math.round(value * 10) / 10}
            min={min}
            max={max}
            step={step}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-16 h-7 text-xs font-mono text-right px-2"
          />
          {unit && (
            <span className="text-xs text-muted-foreground w-4">{unit}</span>
          )}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([newValue]) => onChange(newValue)}
        onValueCommit={() => onBlur?.()}
        className="w-full"
      />
    </div>
  );
}

/**
 * チェックボックスコンポーネントのProps
 */
export interface CheckboxProps {
  /** ラベル */
  label: string;
  /** チェック状態 */
  checked: boolean;
  /** 状態変更時のコールバック */
  onChange: (checked: boolean) => void;
}

/**
 * チェックボックス
 */
export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  const id = `checkbox-${label.replace(/\s/g, "-")}`;
  
  return (
    <div className="flex items-center gap-2.5">
      <ShadcnCheckbox
        id={id}
        checked={checked}
        onCheckedChange={(checkedState) => onChange(checkedState === true)}
      />
      <Label htmlFor={id} className="text-sm cursor-pointer">
        {label}
      </Label>
    </div>
  );
}
