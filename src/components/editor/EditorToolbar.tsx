/**
 * エディターツールバーコンポーネント
 */

import { useMemo } from "react";
import { useEditor, useImportExport, GRID_SIZES } from "@/lib/editor";
import { ToolbarButton, Divider } from "./ToolbarButton";
import { ImportModal } from "./ImportModal";
import { ExportModal } from "./ExportModal";
import { PanelSettingsDropdown } from "./PanelSettingsDropdown";

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
    moveLayer,
    groupSelected,
    ungroup,
    canGroup,
    selectedGroup,
    setGridSettings,
    alignObjects,
    canAlign,
  } = useEditor();

  const {
    showImportModal,
    openImportModal,
    closeImportModal,
    importText,
    setImportText,
    importError,
    executeImport,
    resetImport,
    showExportModal,
    openExportModal,
    closeExportModal,
    encodeKey,
    setEncodeKey,
    generateExportCode,
    copyToClipboard,
  } = useImportExport();

  const hasSelection = state.selectedIndices.length > 0;
  const hasSingleSelection = state.selectedIndices.length === 1;
  const hasClipboard = state.clipboard !== null && state.clipboard.length > 0;

  // インポート処理
  const handleImport = () => {
    const result = executeImport();
    if (result.success && result.board) {
      if (result.key !== undefined) {
        setEncodeKey(result.key);
      }
      setBoard(result.board);
      closeImportModal();
      resetImport();
    }
  };

  // エクスポートコード（モーダル表示時のみ計算）
  const exportedCode = useMemo(() => {
    if (!showExportModal) return "";
    return generateExportCode(state.board);
  }, [showExportModal, state.board, generateExportCode]);

  // コピー処理
  const handleCopyExport = () => {
    copyToClipboard(exportedCode);
  };

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-slate-800 border-b border-slate-700 flex-shrink-0 overflow-x-auto">
        {/* ファイル操作 */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={openImportModal}>
            インポート
          </ToolbarButton>
          <ToolbarButton onClick={openExportModal}>エクスポート</ToolbarButton>
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

        {/* レイヤー操作 */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => moveLayer("front")}
            disabled={!hasSingleSelection}
            title="最前面へ"
          >
            ⤒
          </ToolbarButton>
          <ToolbarButton
            onClick={() => moveLayer("forward")}
            disabled={!hasSingleSelection}
            title="前面へ"
          >
            ↑
          </ToolbarButton>
          <ToolbarButton
            onClick={() => moveLayer("backward")}
            disabled={!hasSingleSelection}
            title="背面へ"
          >
            ↓
          </ToolbarButton>
          <ToolbarButton
            onClick={() => moveLayer("back")}
            disabled={!hasSingleSelection}
            title="最背面へ"
          >
            ⤓
          </ToolbarButton>
        </div>

        <Divider />

        {/* グループ操作 */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={groupSelected}
            disabled={!canGroup}
            title="グループ化 (Ctrl+G)"
          >
            ⊞
          </ToolbarButton>
          <ToolbarButton
            onClick={() => selectedGroup && ungroup(selectedGroup.id)}
            disabled={!selectedGroup}
            title="グループ解除 (Ctrl+Shift+G)"
          >
            ⊟
          </ToolbarButton>
        </div>

        <Divider />

        {/* 整列操作 */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => alignObjects("left")}
            disabled={!canAlign}
            title="左揃え"
          >
            ⫷
          </ToolbarButton>
          <ToolbarButton
            onClick={() => alignObjects("center")}
            disabled={!canAlign}
            title="左右中央揃え"
          >
            ⫿
          </ToolbarButton>
          <ToolbarButton
            onClick={() => alignObjects("right")}
            disabled={!canAlign}
            title="右揃え"
          >
            ⫸
          </ToolbarButton>
          <ToolbarButton
            onClick={() => alignObjects("top")}
            disabled={!canAlign}
            title="上揃え"
          >
            ⤒
          </ToolbarButton>
          <ToolbarButton
            onClick={() => alignObjects("middle")}
            disabled={!canAlign}
            title="上下中央揃え"
          >
            ⎯
          </ToolbarButton>
          <ToolbarButton
            onClick={() => alignObjects("bottom")}
            disabled={!canAlign}
            title="下揃え"
          >
            ⤓
          </ToolbarButton>
          <ToolbarButton
            onClick={() => alignObjects("distribute-h")}
            disabled={!canAlign}
            title="水平方向に均等配置"
          >
            ⋯
          </ToolbarButton>
          <ToolbarButton
            onClick={() => alignObjects("distribute-v")}
            disabled={!canAlign}
            title="垂直方向に均等配置"
          >
            ⋮
          </ToolbarButton>
        </div>

        <Divider />

        {/* グリッド設定 */}
        <div className="flex items-center gap-2">
          <ToolbarButton
            onClick={() => setGridSettings({ enabled: !state.gridSettings.enabled })}
            title={state.gridSettings.enabled ? "グリッドスナップ無効化" : "グリッドスナップ有効化"}
            className={state.gridSettings.enabled ? "!bg-cyan-600 hover:!bg-cyan-500" : ""}
          >
            #
          </ToolbarButton>
          <select
            value={state.gridSettings.size}
            onChange={(e) => setGridSettings({ size: Number(e.target.value) })}
            disabled={!state.gridSettings.enabled}
            className="px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-cyan-500"
            title="グリッドサイズ"
          >
            {GRID_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <label
            className={`flex items-center gap-1 text-xs cursor-pointer ${
              state.gridSettings.enabled ? "text-slate-300" : "text-slate-500"
            }`}
          >
            <input
              type="checkbox"
              checked={state.gridSettings.showGrid}
              onChange={(e) => setGridSettings({ showGrid: e.target.checked })}
              disabled={!state.gridSettings.enabled}
              className="w-3 h-3 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
            />
            表示
          </label>
        </div>

        <Divider />

        {/* パネルレイアウト設定 */}
        <PanelSettingsDropdown />

        {/* 状態表示 */}
        <div className="flex-1 text-right text-xs text-slate-400">
          {state.isDirty && <span className="text-yellow-500 mr-2">●</span>}
          オブジェクト数: {state.board.objects.length}
          {hasSelection && ` | 選択: ${state.selectedIndices.length}`}
        </div>
      </div>

      {/* インポートモーダル */}
      {showImportModal && (
        <ImportModal
          importText={importText}
          onImportTextChange={setImportText}
          importError={importError}
          onImport={handleImport}
          onClose={closeImportModal}
        />
      )}

      {/* エクスポートモーダル */}
      {showExportModal && (
        <ExportModal
          exportedCode={exportedCode}
          encodeKey={encodeKey}
          onEncodeKeyChange={setEncodeKey}
          onCopy={handleCopyExport}
          onClose={closeExportModal}
        />
      )}
    </>
  );
}


