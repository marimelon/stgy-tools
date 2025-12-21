/**
 * エディターツールバーコンポーネント
 *
 * レスポンシブ対応：画面サイズに応じてレイアウトを変更
 * - large (≥1200px): 全ボタン表示
 * - medium (800-1199px): アイコン化、一部ドロップダウン
 * - small (<800px): 主要機能のみ、その他はドロップダウン
 */

import { useMemo, useRef } from "react";
import {
	Download,
	Upload,
	Undo2,
	Redo2,
	Copy,
	ClipboardPaste,
	CopyPlus,
	Trash2,
	ArrowUpToLine,
	ArrowUp,
	ArrowDown,
	ArrowDownToLine,
	Group,
	Ungroup,
	AlignStartVertical,
	AlignCenterVertical,
	AlignEndVertical,
	AlignStartHorizontal,
	AlignCenterHorizontal,
	AlignEndHorizontal,
	AlignHorizontalSpaceAround,
	AlignVerticalSpaceAround,
	Grid3x3,
} from "lucide-react";
import { useEditor, useImportExport, GRID_SIZES } from "@/lib/editor";
import { ToolbarButton, Divider } from "./ToolbarButton";
import { ImportModal } from "./ImportModal";
import { ExportModal } from "./ExportModal";
import { PanelSettingsDropdown } from "./PanelSettingsDropdown";
import {
	useToolbarSize,
	AlignmentMenu,
	GridSettingsMenu,
	MoreMenu,
} from "./toolbar";

/** アイコンサイズ */
const ICON_SIZE = 16;

/**
 * エディターツールバー
 */
export function EditorToolbar() {
	const toolbarRef = useRef<HTMLDivElement>(null);
	const toolbarSize = useToolbarSize(toolbarRef);

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
			<div
				ref={toolbarRef}
				className="flex items-center gap-2 p-2 bg-slate-800 border-b border-slate-700 flex-shrink-0 flex-nowrap overflow-x-auto"
			>
				{/* ファイル操作 */}
				<div className="flex items-center gap-1 flex-shrink-0">
					<ToolbarButton onClick={openImportModal} title="インポート">
						<Download size={ICON_SIZE} />
					</ToolbarButton>
					<ToolbarButton onClick={openExportModal} title="エクスポート">
						<Upload size={ICON_SIZE} />
					</ToolbarButton>
				</div>

				<Divider />

				{/* 履歴操作 */}
				<div className="flex items-center gap-1 flex-shrink-0">
					<ToolbarButton
						onClick={undo}
						disabled={!canUndo}
						title="元に戻す (Ctrl+Z)"
					>
						<Undo2 size={ICON_SIZE} />
					</ToolbarButton>
					<ToolbarButton
						onClick={redo}
						disabled={!canRedo}
						title="やり直す (Ctrl+Y)"
					>
						<Redo2 size={ICON_SIZE} />
					</ToolbarButton>
				</div>

				<Divider />

				{/* 編集操作 */}
				<div className="flex items-center gap-1 flex-shrink-0">
					<ToolbarButton
						onClick={copySelected}
						disabled={!hasSelection}
						title="コピー (Ctrl+C)"
					>
						<Copy size={ICON_SIZE} />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => paste()}
						disabled={!hasClipboard}
						title="貼り付け (Ctrl+V)"
					>
						<ClipboardPaste size={ICON_SIZE} />
					</ToolbarButton>
					<ToolbarButton
						onClick={duplicateSelected}
						disabled={!hasSelection}
						title="複製 (Ctrl+D)"
					>
						<CopyPlus size={ICON_SIZE} />
					</ToolbarButton>
					<ToolbarButton
						onClick={deleteSelected}
						disabled={!hasSelection}
						title="削除 (Delete)"
					>
						<Trash2 size={ICON_SIZE} />
					</ToolbarButton>
				</div>

				{/* 小画面以外: レイヤー操作、グループ操作、整列、グリッド設定を表示 */}
				{toolbarSize !== "small" && (
					<>
						<Divider />

						{/* レイヤー操作 */}
						<div className="flex items-center gap-1 flex-shrink-0">
							<ToolbarButton
								onClick={() => moveLayer("front")}
								disabled={!hasSingleSelection}
								title="最前面へ"
							>
								<ArrowUpToLine size={ICON_SIZE} />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => moveLayer("forward")}
								disabled={!hasSingleSelection}
								title="前面へ"
							>
								<ArrowUp size={ICON_SIZE} />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => moveLayer("backward")}
								disabled={!hasSingleSelection}
								title="背面へ"
							>
								<ArrowDown size={ICON_SIZE} />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => moveLayer("back")}
								disabled={!hasSingleSelection}
								title="最背面へ"
							>
								<ArrowDownToLine size={ICON_SIZE} />
							</ToolbarButton>
						</div>

						<Divider />

						{/* グループ操作 */}
						<div className="flex items-center gap-1 flex-shrink-0">
							<ToolbarButton
								onClick={groupSelected}
								disabled={!canGroup}
								title="グループ化 (Ctrl+G)"
							>
								<Group size={ICON_SIZE} />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => selectedGroup && ungroup(selectedGroup.id)}
								disabled={!selectedGroup}
								title="グループ解除 (Ctrl+Shift+G)"
							>
								<Ungroup size={ICON_SIZE} />
							</ToolbarButton>
						</div>

						<Divider />

						{/* 整列操作 - largeでは全ボタン、mediumではドロップダウン */}
						{toolbarSize === "large" ? (
							<div className="flex items-center gap-1 flex-shrink-0">
								<ToolbarButton
									onClick={() => alignObjects("left")}
									disabled={!canAlign}
									title="左揃え"
								>
									<AlignStartVertical size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignObjects("center")}
									disabled={!canAlign}
									title="左右中央揃え"
								>
									<AlignCenterVertical size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignObjects("right")}
									disabled={!canAlign}
									title="右揃え"
								>
									<AlignEndVertical size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignObjects("top")}
									disabled={!canAlign}
									title="上揃え"
								>
									<AlignStartHorizontal size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignObjects("middle")}
									disabled={!canAlign}
									title="上下中央揃え"
								>
									<AlignCenterHorizontal size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignObjects("bottom")}
									disabled={!canAlign}
									title="下揃え"
								>
									<AlignEndHorizontal size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignObjects("distribute-h")}
									disabled={!canAlign}
									title="水平方向に均等配置"
								>
									<AlignHorizontalSpaceAround size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignObjects("distribute-v")}
									disabled={!canAlign}
									title="垂直方向に均等配置"
								>
									<AlignVerticalSpaceAround size={ICON_SIZE} />
								</ToolbarButton>
							</div>
						) : (
							<div className="flex-shrink-0">
								<AlignmentMenu onAlign={alignObjects} canAlign={canAlign} />
							</div>
						)}

						<Divider />

						{/* グリッド設定 - largeでは展開表示、mediumではドロップダウン */}
						{toolbarSize === "large" ? (
							<div className="flex items-center gap-2 flex-shrink-0">
								<ToolbarButton
									onClick={() =>
										setGridSettings({ enabled: !state.gridSettings.enabled })
									}
									title={
										state.gridSettings.enabled
											? "グリッドスナップ無効化"
											: "グリッドスナップ有効化"
									}
									className={
										state.gridSettings.enabled
											? "!bg-cyan-600 hover:!bg-cyan-500"
											: ""
									}
								>
									<Grid3x3 size={ICON_SIZE} />
								</ToolbarButton>
								<select
									value={state.gridSettings.size}
									onChange={(e) =>
										setGridSettings({ size: Number(e.target.value) })
									}
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
										state.gridSettings.enabled
											? "text-slate-300"
											: "text-slate-500"
									}`}
								>
									<input
										type="checkbox"
										checked={state.gridSettings.showGrid}
										onChange={(e) =>
											setGridSettings({ showGrid: e.target.checked })
										}
										disabled={!state.gridSettings.enabled}
										className="w-3 h-3 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
									/>
									表示
								</label>
							</div>
						) : (
							<div className="flex-shrink-0">
								<GridSettingsMenu
									gridSettings={state.gridSettings}
									onGridSettingsChange={setGridSettings}
								/>
							</div>
						)}

						<Divider />

						{/* パネルレイアウト設定 */}
						<div className="flex-shrink-0">
							<PanelSettingsDropdown />
						</div>
					</>
				)}

				{/* 小画面: その他メニュー */}
				{toolbarSize === "small" && (
					<>
						<Divider />
						<div className="flex-shrink-0">
							<MoreMenu
								onMoveLayer={moveLayer}
								hasSingleSelection={hasSingleSelection}
								onGroup={groupSelected}
								onUngroup={() => selectedGroup && ungroup(selectedGroup.id)}
								canGroup={canGroup}
								hasSelectedGroup={!!selectedGroup}
								onAlign={alignObjects}
								canAlign={canAlign}
								gridSettings={state.gridSettings}
								onGridSettingsChange={setGridSettings}
							/>
						</div>

						<Divider />

						{/* パネルレイアウト設定 */}
						<div className="flex-shrink-0">
							<PanelSettingsDropdown />
						</div>
					</>
				)}

				{/* 状態表示 */}
				<div className="ml-auto text-right text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
					{state.isDirty && <span className="text-yellow-500 mr-2">●</span>}
					{toolbarSize === "large" ? (
						<>
							オブジェクト数: {state.board.objects.length}
							{hasSelection && ` | 選択: ${state.selectedIndices.length}`}
						</>
					) : (
						<>
							{state.board.objects.length}
							{hasSelection && ` / ${state.selectedIndices.length}`}
						</>
					)}
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
