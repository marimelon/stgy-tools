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

/** EditorToolbarのProps */
export interface EditorToolbarProps {
	/** 最終保存時刻 */
	lastSavedAt?: Date | null;
}

/**
 * 相対時間をフォーマット
 */
function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);

	if (diffSec < 10) return "たった今";
	if (diffSec < 60) return `${diffSec}秒前`;
	if (diffMin < 60) return `${diffMin}分前`;
	if (diffHour < 24) return `${diffHour}時間前`;
	return date.toLocaleDateString();
}

/**
 * エディターツールバー
 */
export function EditorToolbar({ lastSavedAt }: EditorToolbarProps = {}) {
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
				className="app-toolbar flex items-center gap-2 flex-shrink-0 flex-nowrap overflow-x-auto"
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
									active={state.gridSettings.enabled}
								>
									<Grid3x3 size={ICON_SIZE} />
								</ToolbarButton>
								<select
									value={state.gridSettings.size}
									onChange={(e) =>
										setGridSettings({ size: Number(e.target.value) })
									}
									disabled={!state.gridSettings.enabled}
									className="h-8 px-2 text-sm bg-input border border-border rounded-md text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
									title="グリッドサイズ"
								>
									{GRID_SIZES.map((size) => (
										<option key={size} value={size}>
											{size}px
										</option>
									))}
								</select>
								<label
									className={`flex items-center gap-1.5 text-xs cursor-pointer font-medium ${
										state.gridSettings.enabled
											? "text-foreground"
											: "text-muted-foreground"
									}`}
								>
									<input
										type="checkbox"
										checked={state.gridSettings.showGrid}
										onChange={(e) =>
											setGridSettings({ showGrid: e.target.checked })
										}
										disabled={!state.gridSettings.enabled}
										className="w-3.5 h-3.5 rounded accent-accent"
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
				<div className="ml-auto text-right text-xs flex-shrink-0 whitespace-nowrap flex items-center gap-3 text-muted-foreground font-mono">
					{state.isDirty && (
						<span className="status-dot dirty" title="未保存の変更があります" />
					)}
					{lastSavedAt && (
						<span title={`保存: ${lastSavedAt.toLocaleString()}`}>
							{formatRelativeTime(lastSavedAt)}
						</span>
					)}
					{toolbarSize === "large" ? (
						<span>
							オブジェクト数: <span className="text-primary">{state.board.objects.length}</span>
							{hasSelection && (
								<>
									{" | "}選択: <span className="text-accent">{state.selectedIndices.length}</span>
								</>
							)}
						</span>
					) : (
						<span>
							<span className="text-primary">{state.board.objects.length}</span>
							{hasSelection && (
								<span className="text-accent"> / {state.selectedIndices.length}</span>
							)}
						</span>
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
