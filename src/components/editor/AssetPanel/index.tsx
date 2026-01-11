/**
 * Asset panel component
 *
 * Display and manage saved assets
 */

import NiceModal from "@ebay/nice-modal-react";
import { Download, Package, Save, Search, Undo2 } from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
	type AssetWithRuntimeIds,
	offsetObjectsToPosition,
	useAssets,
} from "@/lib/assets";
import {
	canAddObjects,
	getEditorStore,
	useEditorActions,
	useSelectedIds,
} from "@/lib/editor";
import { AssetContextMenu } from "./AssetContextMenu";
import { AssetItem } from "./AssetItem";
import { ExportAssetModal } from "./ExportAssetModal";
import { ImportAssetModal } from "./ImportAssetModal";
import { SaveAssetModal } from "./SaveAssetModal";

interface ContextMenuState {
	asset: AssetWithRuntimeIds;
	position: { x: number; y: number };
}

/**
 * Asset panel component
 */
export function AssetPanel() {
	const { t } = useTranslation();
	const { addObject, selectObjects, groupObjects, setError, commitHistory } =
		useEditorActions();
	const {
		assets,
		isLoading,
		updateAsset,
		deleteAsset,
		duplicateAsset,
		deletedAsset,
		undoDelete,
		dismissUndo,
	} = useAssets({ sortBy: "updatedAt", sortDirection: "desc" });

	const [searchQuery, setSearchQuery] = useState("");
	const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

	// Open modal via custom event (for header action buttons)
	useEffect(() => {
		const handleOpenSaveModal = () => NiceModal.show(SaveAssetModal);
		const handleOpenImportModal = () => NiceModal.show(ImportAssetModal);
		window.addEventListener("openSaveAssetModal", handleOpenSaveModal);
		window.addEventListener("openImportAssetModal", handleOpenImportModal);
		return () => {
			window.removeEventListener("openSaveAssetModal", handleOpenSaveModal);
			window.removeEventListener("openImportAssetModal", handleOpenImportModal);
		};
	}, []);

	const filteredAssets = searchQuery
		? assets.filter((asset) =>
				asset.name.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: assets;

	const handleApplyAsset = (asset: AssetWithRuntimeIds) => {
		// Validation (get the latest board when callback is executed)
		const board = getEditorStore().state.board;
		const validation = canAddObjects(board, asset.objects);
		if (!validation.canAdd) {
			setError({
				key: validation.errorKey ?? "editor.errors.unknown",
				params: validation.errorParams,
			});
			return;
		}

		const targetPosition = { x: 256, y: 192 };
		const offsetObjects = offsetObjectsToPosition(
			asset.objects,
			asset.bounds,
			targetPosition,
		);

		// Add objects (addObject adds to the front, so add in reverse order)
		// Collect IDs of added objects
		const newIds: string[] = [];
		for (let i = offsetObjects.length - 1; i >= 0; i--) {
			addObject(offsetObjects[i]);
			newIds.push(offsetObjects[i].id);
		}

		selectObjects(newIds);

		if (newIds.length >= 2) {
			groupObjects(newIds);
		}

		commitHistory(t("assetPanel.toast.assetApplied", { name: asset.name }));
	};

	const handleContextMenu = (e: MouseEvent, asset: AssetWithRuntimeIds) => {
		setContextMenu({
			asset,
			position: { x: e.clientX, y: e.clientY },
		});
	};

	const handleRename = (asset: AssetWithRuntimeIds, newName: string) => {
		updateAsset(asset.id, { name: newName });
	};

	const handleDuplicate = (asset: AssetWithRuntimeIds) => {
		duplicateAsset(asset.id);
	};

	const handleExport = (asset: AssetWithRuntimeIds) => {
		NiceModal.show(ExportAssetModal, { asset });
	};

	const handleDelete = (asset: AssetWithRuntimeIds) => {
		deleteAsset(asset.id);
	};

	return (
		<div
			className="flex flex-col h-full"
			style={{ background: "var(--color-bg-base)" }}
		>
			{/* Search bar */}
			<div className="px-2 py-2 border-b border-border">
				<div className="relative">
					<Search
						size={14}
						className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder={t("assetPanel.search")}
						className="h-8 pl-7 text-sm"
					/>
				</div>
			</div>

			{/* Asset list */}
			<div className="flex-1 overflow-y-auto p-2">
				{isLoading ? (
					<div className="flex items-center justify-center h-32 text-muted-foreground">
						<Package size={24} className="animate-pulse" />
					</div>
				) : filteredAssets.length === 0 ? (
					<EmptyState hasAssets={assets.length > 0} />
				) : (
					<div className="grid grid-cols-2 gap-2">
						{filteredAssets.map((asset) => (
							<AssetItem
								key={asset.id}
								asset={asset}
								onApply={handleApplyAsset}
								onContextMenu={handleContextMenu}
							/>
						))}
					</div>
				)}
			</div>

			{/* Delete undo toast */}
			{deletedAsset && (
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-md shadow-lg px-3 py-2 flex items-center gap-2 text-sm">
					<span>
						{t("assetPanel.toast.assetDeleted", { name: deletedAsset.name })}
					</span>
					<button
						type="button"
						onClick={undoDelete}
						className="flex items-center gap-1 text-primary hover:underline"
					>
						<Undo2 size={14} />
						{t("assetPanel.toast.undo")}
					</button>
					<button
						type="button"
						onClick={dismissUndo}
						className="text-muted-foreground hover:text-foreground ml-1"
						aria-label="Dismiss"
					>
						×
					</button>
				</div>
			)}

			{/* Context menu */}
			{contextMenu && (
				<AssetContextMenu
					asset={contextMenu.asset}
					position={contextMenu.position}
					onClose={() => setContextMenu(null)}
					onApply={handleApplyAsset}
					onRename={handleRename}
					onDuplicate={handleDuplicate}
					onExport={handleExport}
					onDelete={handleDelete}
				/>
			)}
		</div>
	);
}

/**
 * Empty state component
 */
function EmptyState({ hasAssets }: { hasAssets: boolean }) {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
			<Package size={32} className="mb-2 opacity-50" />
			<p className="text-sm font-medium">
				{hasAssets
					? t("boardManager.emptyState.noResults")
					: t("assetPanel.noAssets")}
			</p>
			<p className="text-xs mt-1">
				{hasAssets
					? t("boardManager.emptyState.noResultsDescription")
					: t("assetPanel.noAssetsDescription")}
			</p>
		</div>
	);
}

/**
 * Action buttons for asset panel header
 */
export function AssetPanelActions() {
	const { t } = useTranslation();
	const selectedIds = useSelectedIds();
	const canSave = selectedIds.length > 0;

	const handleSaveClick = () => {
		window.dispatchEvent(new CustomEvent("openSaveAssetModal"));
	};

	const handleImportClick = () => {
		window.dispatchEvent(new CustomEvent("openImportAssetModal"));
	};

	return (
		<div className="flex gap-0.5">
			<button
				type="button"
				onClick={handleImportClick}
				className="p-1.5 rounded transition-colors text-foreground hover:bg-muted"
				title={t("assetPanel.importAsset")}
			>
				<Download size={16} />
			</button>
			<button
				type="button"
				onClick={handleSaveClick}
				disabled={!canSave}
				className={`p-1.5 rounded transition-colors ${
					canSave
						? "text-foreground hover:bg-muted"
						: "text-muted-foreground cursor-not-allowed"
				}`}
				title={t("assetPanel.saveSelection")}
			>
				<Save size={16} />
			</button>
		</div>
	);
}
