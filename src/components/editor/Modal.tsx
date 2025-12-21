/**
 * モーダルコンポーネント
 *
 * 汎用的なモーダルダイアログ
 */

import type { ReactNode } from "react";

/**
 * モーダルコンポーネントのProps
 */
export interface ModalProps {
  /** モーダルのタイトル */
  title: string;
  /** モーダルの内容 */
  children: ReactNode;
  /** 閉じるときのコールバック */
  onClose: () => void;
}

/**
 * モーダルコンポーネント
 */
export function Modal({ children, onClose, title }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
