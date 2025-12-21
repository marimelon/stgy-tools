/**
 * フォーム入力コンポーネント
 *
 * プロパティパネルなどで使用する共通のフォーム入力部品
 */

import type { ReactNode } from "react";

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
    <div>
      <div className="text-xs text-slate-400 mb-2">{title}</div>
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
