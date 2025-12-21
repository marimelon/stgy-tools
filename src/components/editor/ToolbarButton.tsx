/**
 * ツールバーボタンコンポーネント
 *
 * エディターツールバーで使用する共通のボタン部品
 */

import type { ReactNode } from "react";

/**
 * ツールバーボタンのProps
 */
export interface ToolbarButtonProps {
  /** ボタンの内容 */
  children: ReactNode;
  /** クリック時のコールバック */
  onClick?: () => void;
  /** 無効状態 */
  disabled?: boolean;
  /** ツールチップ */
  title?: string;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * ツールバーボタン
 */
export function ToolbarButton({
  children,
  onClick,
  disabled,
  title,
  className = "",
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded transition-colors whitespace-nowrap flex items-center ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * 区切り線
 */
export function Divider() {
  return <div className="w-px h-6 bg-slate-600" />;
}
