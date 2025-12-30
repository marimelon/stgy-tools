/**
 * エディターツールバーコンポーネント
 *
 * レスポンシブ対応：画面サイズに応じてレイアウトを変更
 * - large (≥1200px): 全ボタン表示
 * - medium (800-1199px): アイコン化、一部ドロップダウン
 * - small (<800px): 主要機能のみ、その他はドロップダウン
 */

import type { TFunction } from "i18next";
import {
	AlignCenterHorizontal,
	AlignCenterVertical,
	AlignEndHorizontal,
	AlignEndVertical,
	AlignHorizontalSpaceAround,
	AlignStartHorizontal,
	AlignStartVertical,
	AlignVerticalSpaceAround,
	ArrowDown,
	ArrowDownToLine,
	ArrowUp,
	ArrowUpToLine,
	Circle,
	ClipboardPaste,
	Copy,
	CopyPlus,
	Download,
	FolderOpen,
	Grid3x3,
	Group,
	Redo2,
	Trash2,
	Undo2,
	Ungroup,
	Upload,
} from "lucide-react";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
	GRID_SIZES,
	useCanAlign,
	useCanGroup,
	useCanRedo,
	useCanUndo,
	useClipboard,
	useEditorActions,
	useGridSettings,
	useImportExport,
	useIsDirty,
	useSelectedGroup,
	useSelectedIndices,
} from "@/lib/editor";
import { ExportModal } from "./ExportModal";
import { ImportModal } from "./ImportModal";
import { PanelSettingsDropdown } from "./PanelSettingsDropdown";
import { Divider, ToolbarButton } from "./ToolbarButton";
import {
	AlignmentMenu,
	GridSettingsMenu,
	MoreMenu,
	useToolbarSize,
} from "./toolbar";

/** アイコンサイズ */
const ICON_SIZE = 16;

/** EditorToolbarのProps */
export interface EditorToolbarProps {
	/** 最終保存時刻 */
	lastSavedAt?: Date | null;
	/** Board Manager を開くコールバック */
	onOpenBoardManager?: () => void;
	/** インポート時に新しいボードを作成するコールバック */
	onCreateBoardFromImport?: (
		name: string,
		stgyCode: string,
		encodeKey: number,
	) => void;
	/** 短縮リンク機能が有効かどうか */
	shortLinksEnabled?: boolean;
}

/**
 * 相対時間をフォーマット
 */
function formatRelativeTime(date: Date, t: TFunction): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);

	if (diffSec < 10) return t("toolbar.justNow");
	if (diffSec < 60) return `${diffSec}${t("toolbar.secondsAgo")}`;
	if (diffMin < 60) return `${diffMin}${t("toolbar.minutesAgo")}`;
	if (diffHour < 24) return `${diffHour}${t("toolbar.hoursAgo")}`;
	return date.toLocaleDateString();
}

/**
 * エディターツールバー
 */
export function EditorToolbar({
	lastSavedAt,
	onOpenBoardManager,
	onCreateBoardFromImport,
	shortLinksEnabled = false,
}: EditorToolbarProps = {}) {
	const { t } = useTranslation();
	const toolbarRef = useRef<HTMLDivElement>(null);
	const toolbarSize = useToolbarSize(toolbarRef);

	// State
	const selectedIndices = useSelectedIndices();
	const clipboard = useClipboard();
	const gridSettings = useGridSettings();
	const isDirty = useIsDirty();

	// Derived state
	const canUndo = useCanUndo();
	const canRedo = useCanRedo();
	const canGroup = useCanGroup();
	const canAlign = useCanAlign();
	const selectedGroup = useSelectedGroup();

	// Actions
	const {
		undo,
		redo,
		deleteSelected,
		duplicateSelected,
		copySelected,
		paste,
		setBoard,
		moveSelectedLayer,
		groupSelected,
		ungroup,
		setGridSettings,
		alignSelected,
	} = useEditorActions();

	const {
		showImportModal,
		openImportModal,
		closeImportModal,
		importText,
		setImportText,
		importError,
		executeImport,
		resetImport,
		addToBoards,
		setAddToBoards,
		showExportModal,
		openExportModal,
		closeExportModal,
		encodeKey,
		setEncodeKey,
		generateExportCode,
		copyToClipboard,
	} = useImportExport();

	const hasSelection = selectedIndices.length > 0;
	const hasSingleSelection = selectedIndices.length === 1;
	const hasClipboard = clipboard !== null && clipboard.length > 0;

	// インポート処理
	const handleImport = () => {
		const result = executeImport();
		if (result.success && result.board) {
			if (result.key !== undefined) {
				setEncodeKey(result.key);
			}

			// ボード管理に追加する場合は新しいボードを作成してそちらを開く
			// （EditorProviderが再初期化されるため setBoard は不要）
			if (addToBoards && onCreateBoardFromImport) {
				onCreateBoardFromImport(
					result.board.name,
					importText.trim(),
					result.key ?? 0,
				);
			} else {
				// ボード管理に追加しない場合は現在のエディターに読み込む
				setBoard(result.board);
			}

			closeImportModal();
			resetImport();
		}
	};

	// エクスポートコード（モーダル表示時のみ計算）
	const exportedCode = useMemo(() => {
		if (!showExportModal) return "";
		return generateExportCode();
	}, [showExportModal, generateExportCode]);

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
					{onOpenBoardManager && (
						<ToolbarButton
							onClick={onOpenBoardManager}
							title={t("boardManager.title")}
						>
							<FolderOpen size={ICON_SIZE} />
						</ToolbarButton>
					)}
					<ToolbarButton onClick={openImportModal} title={t("toolbar.import")}>
						<Download size={ICON_SIZE} />
					</ToolbarButton>
					<ToolbarButton onClick={openExportModal} title={t("toolbar.export")}>
						<Upload size={ICON_SIZE} />
					</ToolbarButton>
				</div>

				<Divider />

				{/* 履歴操作 */}
				<div className="flex items-center gap-1 flex-shrink-0">
					<ToolbarButton
						onClick={undo}
						disabled={!canUndo}
						title={t("toolbar.undo")}
					>
						<Undo2 size={ICON_SIZE} />
					</ToolbarButton>
					<ToolbarButton
						onClick={redo}
						disabled={!canRedo}
						title={t("toolbar.redo")}
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
						title={t("toolbar.copy")}
					>
						<Copy size={ICON_SIZE} />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => paste()}
						disabled={!hasClipboard}
						title={t("toolbar.paste")}
					>
						<ClipboardPaste size={ICON_SIZE} />
					</ToolbarButton>
					<ToolbarButton
						onClick={duplicateSelected}
						disabled={!hasSelection}
						title={t("toolbar.duplicate")}
					>
						<CopyPlus size={ICON_SIZE} />
					</ToolbarButton>
					<ToolbarButton
						onClick={deleteSelected}
						disabled={!hasSelection}
						title={t("toolbar.delete")}
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
								onClick={() => moveSelectedLayer("front")}
								disabled={!hasSingleSelection}
								title={t("toolbar.bringToFront")}
							>
								<ArrowUpToLine size={ICON_SIZE} />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => moveSelectedLayer("forward")}
								disabled={!hasSingleSelection}
								title={t("toolbar.bringForward")}
							>
								<ArrowUp size={ICON_SIZE} />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => moveSelectedLayer("backward")}
								disabled={!hasSingleSelection}
								title={t("toolbar.sendBackward")}
							>
								<ArrowDown size={ICON_SIZE} />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => moveSelectedLayer("back")}
								disabled={!hasSingleSelection}
								title={t("toolbar.sendToBack")}
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
								title={t("toolbar.group")}
							>
								<Group size={ICON_SIZE} />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => selectedGroup && ungroup(selectedGroup.id)}
								disabled={!selectedGroup}
								title={t("toolbar.ungroup")}
							>
								<Ungroup size={ICON_SIZE} />
							</ToolbarButton>
						</div>

						<Divider />

						{/* 整列操作 - largeでは全ボタン、mediumではドロップダウン */}
						{toolbarSize === "large" ? (
							<div className="flex items-center gap-1 flex-shrink-0">
								<ToolbarButton
									onClick={() => alignSelected("left")}
									disabled={!canAlign}
									title={t("alignment.alignLeft")}
								>
									<AlignStartVertical size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignSelected("center")}
									disabled={!canAlign}
									title={t("alignment.alignCenterH")}
								>
									<AlignCenterVertical size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignSelected("right")}
									disabled={!canAlign}
									title={t("alignment.alignRight")}
								>
									<AlignEndVertical size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignSelected("top")}
									disabled={!canAlign}
									title={t("alignment.alignTop")}
								>
									<AlignStartHorizontal size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignSelected("middle")}
									disabled={!canAlign}
									title={t("alignment.alignCenterV")}
								>
									<AlignCenterHorizontal size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignSelected("bottom")}
									disabled={!canAlign}
									title={t("alignment.alignBottom")}
								>
									<AlignEndHorizontal size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignSelected("distribute-h")}
									disabled={!canAlign}
									title={t("alignment.distributeH")}
								>
									<AlignHorizontalSpaceAround size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignSelected("distribute-v")}
									disabled={!canAlign}
									title={t("alignment.distributeV")}
								>
									<AlignVerticalSpaceAround size={ICON_SIZE} />
								</ToolbarButton>
								<ToolbarButton
									onClick={() => alignSelected("circular")}
									disabled={!canAlign}
									title={t("alignment.circular")}
								>
									<Circle size={ICON_SIZE} />
								</ToolbarButton>
							</div>
						) : (
							<div className="flex-shrink-0">
								<AlignmentMenu onAlign={alignSelected} canAlign={canAlign} />
							</div>
						)}

						<Divider />

						{/* グリッド設定 - largeでは展開表示、mediumではドロップダウン */}
						{toolbarSize === "large" ? (
							<div className="flex items-center gap-2 flex-shrink-0">
								<ToolbarButton
									onClick={() =>
										setGridSettings({ enabled: !gridSettings.enabled })
									}
									title={
										gridSettings.enabled
											? t("toolbar.disableGridSnap")
											: t("toolbar.enableGridSnap")
									}
									active={gridSettings.enabled}
								>
									<Grid3x3 size={ICON_SIZE} />
								</ToolbarButton>
								<select
									value={gridSettings.size}
									onChange={(e) =>
										setGridSettings({ size: Number(e.target.value) })
									}
									disabled={!gridSettings.enabled}
									className="h-8 px-2 text-sm bg-input border border-border rounded-md text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
									title={t("toolbar.gridSize")}
								>
									{GRID_SIZES.map((size) => (
										<option key={size} value={size}>
											{size}px
										</option>
									))}
								</select>
								<label
									className={`flex items-center gap-1.5 text-xs cursor-pointer font-medium ${
										gridSettings.enabled
											? "text-foreground"
											: "text-muted-foreground"
									}`}
								>
									<input
										type="checkbox"
										checked={gridSettings.showGrid}
										onChange={(e) =>
											setGridSettings({ showGrid: e.target.checked })
										}
										disabled={!gridSettings.enabled}
										className="w-3.5 h-3.5 rounded accent-accent"
									/>
									{t("toolbar.show")}
								</label>
							</div>
						) : (
							<div className="flex-shrink-0">
								<GridSettingsMenu
									gridSettings={gridSettings}
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
								onMoveLayer={moveSelectedLayer}
								hasSingleSelection={hasSingleSelection}
								onGroup={groupSelected}
								onUngroup={() => selectedGroup && ungroup(selectedGroup.id)}
								canGroup={canGroup}
								hasSelectedGroup={!!selectedGroup}
								onAlign={alignSelected}
								canAlign={canAlign}
								gridSettings={gridSettings}
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

				{/* 保存状態表示 */}
				<div className="ml-auto text-right text-xs flex-shrink-0 whitespace-nowrap flex items-center gap-2 text-muted-foreground font-mono">
					{isDirty && (
						<span
							className="status-dot dirty"
							title={t("toolbar.unsavedChanges")}
						/>
					)}
					{lastSavedAt && (
						<span title={`${lastSavedAt.toLocaleString()}`}>
							{formatRelativeTime(lastSavedAt, t)}
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
					addToBoards={addToBoards}
					onAddToBoardsChange={setAddToBoards}
					isBoardManagementAvailable={!!onCreateBoardFromImport}
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
					shortLinksEnabled={shortLinksEnabled}
				/>
			)}
		</>
	);
}
