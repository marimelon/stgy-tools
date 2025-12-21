/**
 * インポートモーダルコンポーネント
 */

import { Modal } from "./Modal";

/**
 * インポートモーダルのProps
 */
export interface ImportModalProps {
  /** インポートテキスト */
  importText: string;
  /** インポートテキスト変更時のコールバック */
  onImportTextChange: (text: string) => void;
  /** インポートエラー */
  importError: string | null;
  /** インポート実行時のコールバック */
  onImport: () => void;
  /** 閉じる時のコールバック */
  onClose: () => void;
}

/**
 * インポートモーダル
 */
export function ImportModal({
  importText,
  onImportTextChange,
  importError,
  onImport,
  onClose,
}: ImportModalProps) {
  return (
    <Modal onClose={onClose} title="インポート">
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">
            stgyコードを貼り付け:
          </label>
          <textarea
            value={importText}
            onChange={(e) => onImportTextChange(e.target.value)}
            className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm font-mono resize-none focus:outline-none focus:border-cyan-500"
            placeholder="[stgy:a...]"
          />
        </div>
        {importError && (
          <div className="text-sm text-red-400">{importError}</div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onImport}
            disabled={!importText.trim()}
            className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded"
          >
            インポート
          </button>
        </div>
      </div>
    </Modal>
  );
}
