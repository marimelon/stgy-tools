/**
 * Editor toolbar component
 *
 * Responsive: adapts layout based on screen size
 * - large (>=1200px): all buttons visible
 * - medium (800-1199px): icons only, some dropdowns
 * - small (<800px): main functions only, rest in dropdown
 */

import NiceModal from "@ebay/nice-modal-react";
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
	Settings,
	Trash2,
	Undo2,
	Ungroup,
	Upload,
} from "lucide-react";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SettingsModal } from "@/components/settings";
import { useBoards } from "@/lib/boards";
import {
	GRID_SIZES,
	useCanAlign,
	useCanGroup,
	useCanRedo,
	useCanUndo,
	useEditorActions,
	useGlobalClipboard,
	useGridSettings,
	useIsDirty,
	useOpenTabs,
	useSelectedGroup,
	useSelectedIds,
} from "@/lib/editor";
import { ExportModal } from "./ExportModal";
import { ImportModal, type ImportResult } from "./ImportModal";
import { PanelSettingsDropdown } from "./PanelSettingsDropdown";
import { Divider, ToolbarButton } from "./ToolbarButton";
import {
	AlignmentMenu,
	GridSettingsMenu,
	MoreMenu,
	useToolbarSize,
} from "./toolbar";

const ICON_SIZE = 16;

export interface EditorToolbarProps {
	lastSavedAt?: Date | null;
	onOpenBoardManager?: () => void;
	onCreateBoardFromImport?: (name: string, stgyCode: string) => void;
	shortLinksEnabled?: boolean;
}
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

export function EditorToolbar({
	lastSavedAt,
	onOpenBoardManager,
	onCreateBoardFromImport,
	shortLinksEnabled = false,
}: EditorToolbarProps = {}) {
	const { t } = useTranslation();
	const toolbarRef = useRef<HTMLDivElement>(null);
	const toolbarSize = useToolbarSize(toolbarRef);

	const selectedIds = useSelectedIds();
	const hasClipboard = useGlobalClipboard();
	const gridSettings = useGridSettings();
	const isDirty = useIsDirty();
	const openTabs = useOpenTabs();
	const { getBoard } = useBoards();

	const canUndo = useCanUndo();
	const canRedo = useCanRedo();
	const canGroup = useCanGroup();
	const canAlign = useCanAlign();
	const selectedGroup = useSelectedGroup();

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

	const hasSelection = selectedIds.length > 0;
	const hasSingleSelection = selectedIds.length === 1;

	// Get all board codes from open tabs for export all feature
	const allTabBoardCodes = useMemo(() => {
		return openTabs
			.map((tabId) => {
				const storedBoard = getBoard(tabId);
				return storedBoard?.stgyCode ?? null;
			})
			.filter((code): code is string => code !== null);
	}, [openTabs, getBoard]);

	const openImportModal = async () => {
		const result = (await NiceModal.show(ImportModal)) as
			| ImportResult
			| undefined;
		if (result) {
			if (onCreateBoardFromImport) {
				onCreateBoardFromImport(result.board.name, result.stgyCode);
			} else {
				setBoard(result.board);
			}
		}
	};

	const openExportModal = () => {
		NiceModal.show(ExportModal, { shortLinksEnabled, allTabBoardCodes });
	};

	return (
		<div
			ref={toolbarRef}
			className="app-toolbar flex items-center gap-2 flex-shrink-0 flex-nowrap overflow-x-auto"
		>
			{/* File operations */}
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

			{/* History operations */}
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

			{/* Edit operations */}
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

			{/* Non-small screens: show layer, group, alignment, and grid settings */}
			{toolbarSize !== "small" && (
				<>
					<Divider />

					{/* Layer operations */}
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

					{/* Group operations */}
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

					{/* Alignment: full buttons on large, dropdown on medium */}
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

					{/* Grid settings: expanded on large, dropdown on medium */}
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

					<div className="flex-shrink-0">
						<PanelSettingsDropdown />
					</div>
				</>
			)}

			{/* Small screen: more menu */}
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

					<div className="flex-shrink-0">
						<PanelSettingsDropdown />
					</div>
				</>
			)}

			<div className="flex-shrink-0">
				<ToolbarButton
					onClick={() => NiceModal.show(SettingsModal)}
					title={t("settings.title")}
				>
					<Settings size={ICON_SIZE} />
				</ToolbarButton>
			</div>

			{/* Save status */}
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
	);
}
