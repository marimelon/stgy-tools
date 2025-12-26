/**
 * アセットパネルコンポーネント
 *
 * 保存したアセットの一覧表示と管理
 */

import { Download, Package, Save, Search, Undo2 } from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
	offsetObjectsToPosition,
	type StoredAsset,
	useAssets,
} from "@/lib/assets";
import { canAddObjects, useEditor } from "@/lib/editor";
import { AssetContextMenu } from "./AssetContextMenu";
import { AssetItem } from "./AssetItem";
import { ExportAssetModal } from "./ExportAssetModal";
import { ImportAssetModal } from "./ImportAssetModal";
import { SaveAssetModal } from "./SaveAssetModal";

interface ContextMenuState {
	asset: StoredAsset;
	position: { x: number; y: number };
}

/**
 * アセットパネルコンポーネント
 */
export function AssetPanel() {
	const { t } = useTranslation();
	const { state, dispatch, commitHistory } = useEditor();
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

	const [showSaveModal, setShowSaveModal] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [exportAsset, setExportAsset] = useState<StoredAsset | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

	// カスタムイベントでモーダルを開く（ヘッダーアクションボタン用）
	useEffect(() => {
		const handleOpenSaveModal = () => setShowSaveModal(true);
		const handleOpenImportModal = () => setShowImportModal(true);
		window.addEventListener("openSaveAssetModal", handleOpenSaveModal);
		window.addEventListener("openImportAssetModal", handleOpenImportModal);
		return () => {
			window.removeEventListener("openSaveAssetModal", handleOpenSaveModal);
			window.removeEventListener("openImportAssetModal", handleOpenImportModal);
		};
	}, []);

	// 検索フィルタ
	const filteredAssets = searchQuery
		? assets.filter((asset) =>
				asset.name.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: assets;

	// アセットをキャンバスに配置
	const handleApplyAsset = (asset: StoredAsset) => {
		// バリデーション
		const validation = canAddObjects(state.board, asset.objects);
		if (!validation.canAdd) {
			dispatch({
				type: "SET_ERROR",
				error: {
					key: validation.errorKey ?? "editor.errors.unknown",
					params: validation.errorParams,
				},
			});
			return;
		}

		// キャンバス中央に配置
		const targetPosition = { x: 256, y: 192 };
		const offsetObjects = offsetObjectsToPosition(
			asset.objects,
			asset.bounds,
			targetPosition,
		);

		// オブジェクトを追加（ADD_OBJECTは先頭に追加するため逆順で追加）
		for (let i = offsetObjects.length - 1; i >= 0; i--) {
			dispatch({ type: "ADD_OBJECT", object: offsetObjects[i] });
		}

		// 追加後のインデックスは 0 から N-1（先頭に追加されるため）
		const newIndices = offsetObjects.map((_, i) => i);

		// 追加したオブジェクトを選択
		dispatch({ type: "SELECT_OBJECTS", indices: newIndices });

		// 複数オブジェクトの場合はグループ化
		if (newIndices.length >= 2) {
			dispatch({ type: "GROUP_OBJECTS", indices: newIndices });
		}

		// 履歴をコミット
		commitHistory(t("assetPanel.toast.assetApplied", { name: asset.name }));
	};

	// 右クリックメニュー表示
	const handleContextMenu = (e: MouseEvent, asset: StoredAsset) => {
		setContextMenu({
			asset,
			position: { x: e.clientX, y: e.clientY },
		});
	};

	// 名前変更
	const handleRename = (asset: StoredAsset, newName: string) => {
		updateAsset(asset.id, { name: newName });
	};

	// 複製
	const handleDuplicate = (asset: StoredAsset) => {
		duplicateAsset(asset.id);
	};

	// エクスポート
	const handleExport = (asset: StoredAsset) => {
		setExportAsset(asset);
	};

	// 削除
	const handleDelete = (asset: StoredAsset) => {
		deleteAsset(asset.id);
	};

	return (
		<div
			className="flex flex-col h-full"
			style={{ background: "var(--color-bg-base)" }}
		>
			{/* 検索バー */}
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

			{/* アセット一覧 */}
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

			{/* 削除アンドゥトースト */}
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

			{/* モーダル */}
			{showSaveModal && (
				<SaveAssetModal onClose={() => setShowSaveModal(false)} />
			)}

			{showImportModal && (
				<ImportAssetModal onClose={() => setShowImportModal(false)} />
			)}

			{exportAsset && (
				<ExportAssetModal
					asset={exportAsset}
					onClose={() => setExportAsset(null)}
				/>
			)}

			{/* コンテキストメニュー */}
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
 * 空状態コンポーネント
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
 * アセットパネルのアクションボタン（ヘッダー用）
 */
export function AssetPanelActions() {
	const { t } = useTranslation();
	const { state } = useEditor();
	const canSave = state.selectedIndices.length > 0;

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
