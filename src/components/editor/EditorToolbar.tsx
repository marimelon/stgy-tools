/**
 * エディターツールバーコンポーネント
 */

import { useState, useMemo } from "react";
import { useEditor, recalculateBoardSize } from "@/lib/editor";
import { encodeStgy, decodeStgy, parseBoardData, extractKeyFromStgy } from "@/lib/stgy";

/**
 * エディターツールバー
 */
export function EditorToolbar() {
  const {
    state,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelected,
    duplicateSelected,
    copySelected,
    paste,
    setBoard,
  } = useEditor();

  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [encodeKey, setEncodeKey] = useState<number | null>(null); // インポート時のキーを保存

  const hasSelection = state.selectedIndices.length > 0;
  const hasClipboard = state.clipboard !== null && state.clipboard.length > 0;

  // インポート処理
  const handleImport = () => {
    try {
      setImportError(null);
      const trimmedText = importText.trim();
      // キーを抽出して保存
      const key = extractKeyFromStgy(trimmedText);
      setEncodeKey(key);
      const binary = decodeStgy(trimmedText);
      const board = parseBoardData(binary);
      setBoard(board);
      setShowImportModal(false);
      setImportText("");
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "インポートに失敗しました");
    }
  };

  // エクスポート処理
  const handleExport = () => {
    setShowExportModal(true);
  };

  // エクスポート用のボード（サイズを再計算）
  const exportBoard = useMemo(() => {
    if (!showExportModal) return null;
    const { width, height } = recalculateBoardSize(state.board);
    return {
      ...state.board,
      width,
      height,
    };
  }, [showExportModal, state.board]);

  // エクスポート時: ボードサイズを再計算してエンコード
  const exportedCode = exportBoard
    ? encodeStgy(exportBoard, encodeKey !== null ? { key: encodeKey } : undefined)
    : "";

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportedCode);
    } catch {
      // フォールバック
      const textarea = document.createElement("textarea");
      textarea.value = exportedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-slate-800 border-b border-slate-700">
        {/* ファイル操作 */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={() => setShowImportModal(true)}>
            インポート
          </ToolbarButton>
          <ToolbarButton onClick={handleExport}>エクスポート</ToolbarButton>
        </div>

        <Divider />

        {/* 履歴操作 */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={undo} disabled={!canUndo} title="元に戻す (Ctrl+Z)">
            ↶
          </ToolbarButton>
          <ToolbarButton onClick={redo} disabled={!canRedo} title="やり直す (Ctrl+Y)">
            ↷
          </ToolbarButton>
        </div>

        <Divider />

        {/* 編集操作 */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={copySelected}
            disabled={!hasSelection}
            title="コピー (Ctrl+C)"
          >
            コピー
          </ToolbarButton>
          <ToolbarButton
            onClick={() => paste()}
            disabled={!hasClipboard}
            title="貼り付け (Ctrl+V)"
          >
            貼り付け
          </ToolbarButton>
          <ToolbarButton
            onClick={duplicateSelected}
            disabled={!hasSelection}
            title="複製 (Ctrl+D)"
          >
            複製
          </ToolbarButton>
          <ToolbarButton
            onClick={deleteSelected}
            disabled={!hasSelection}
            title="削除 (Delete)"
          >
            削除
          </ToolbarButton>
        </div>

        <Divider />

        {/* 状態表示 */}
        <div className="flex-1 text-right text-xs text-slate-400">
          {state.isDirty && <span className="text-yellow-500 mr-2">●</span>}
          オブジェクト数: {state.board.objects.length}
          {hasSelection && ` | 選択: ${state.selectedIndices.length}`}
        </div>
      </div>

      {/* インポートモーダル */}
      {showImportModal && (
        <Modal onClose={() => setShowImportModal(false)} title="インポート">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                stgyコードを貼り付け:
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
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
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded"
              >
                インポート
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* エクスポートモーダル */}
      {showExportModal && (
        <Modal onClose={() => setShowExportModal(false)} title="エクスポート">
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setEncodeKey(null);
                    } else {
                      const num = Number.parseInt(val, 10);
                      if (!Number.isNaN(num)) {
                        setEncodeKey(Math.max(0, Math.min(63, num)));
                      }
                    }
                  }}
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
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded"
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={handleCopyExport}
                className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded"
              >
                コピー
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/**
 * ツールバーボタン
 */
function ToolbarButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded transition-colors"
    >
      {children}
    </button>
  );
}

/**
 * 区切り線
 */
function Divider() {
  return <div className="w-px h-6 bg-slate-600" />;
}

/**
 * モーダルコンポーネント
 */
function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
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
