/**
 * エクスポートモーダルコンポーネント
 */

import { Modal } from "./Modal";

/**
 * エクスポートモーダルのProps
 */
export interface ExportModalProps {
  /** エクスポートされたコード */
  exportedCode: string;
  /** エンコードキー */
  encodeKey: number | null;
  /** エンコードキー変更時のコールバック */
  onEncodeKeyChange: (key: number | null) => void;
  /** コピー時のコールバック */
  onCopy: () => void;
  /** 閉じる時のコールバック */
  onClose: () => void;
}

/**
 * エクスポートモーダル
 */
export function ExportModal({
  exportedCode,
  encodeKey,
  onEncodeKeyChange,
  onCopy,
  onClose,
}: ExportModalProps) {
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      onEncodeKeyChange(null);
    } else {
      const num = Number.parseInt(val, 10);
      if (!Number.isNaN(num)) {
        onEncodeKeyChange(Math.max(0, Math.min(63, num)));
      }
    }
  };

  return (
    <Modal onClose={onClose} title="エクスポート">
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">
            暗号化キー (0-63):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={63}
              value={encodeKey ?? ""}
              onChange={handleKeyChange}
              placeholder="ランダム"
              className="w-24 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
            />
            <span className="text-xs text-slate-400">
              {encodeKey !== null ? `キー ${encodeKey} を使用` : "ランダムキーを使用"}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">
            生成されたstgyコード:
          </label>
          <textarea
            value={exportedCode}
            readOnly
            className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm font-mono resize-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded"
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded"
          >
            コピー
          </button>
        </div>
      </div>
    </Modal>
  );
}
