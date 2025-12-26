/**
 * アセットコンテキストメニューコンポーネント
 *
 * アセットの右クリックメニュー
 */

import { Copy, MousePointer, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import type { StoredAsset } from "@/lib/assets";

interface ContextMenuPosition {
	x: number;
	y: number;
}

interface AssetContextMenuProps {
	/** 対象のアセット */
	asset: StoredAsset;
	/** メニューの位置 */
	position: ContextMenuPosition;
	/** 閉じるときのコールバック */
	onClose: () => void;
	/** 配置アクション */
	onApply: (asset: StoredAsset) => void;
	/** 名前変更アクション */
	onRename: (asset: StoredAsset, newName: string) => void;
	/** 複製アクション */
	onDuplicate: (asset: StoredAsset) => void;
	/** 削除アクション */
	onDelete: (asset: StoredAsset) => void;
}

/**
 * アセットコンテキストメニュー
 */
export function AssetContextMenu({
	asset,
	position,
	onClose,
	onApply,
	onRename,
	onDuplicate,
	onDelete,
}: AssetContextMenuProps) {
	const { t } = useTranslation();
	const menuRef = useRef<HTMLDivElement>(null);
	const [isRenaming, setIsRenaming] = useState(false);
	const [newName, setNewName] = useState(asset.name);
	const inputRef = useRef<HTMLInputElement>(null);

	// クリック外で閉じる
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [onClose]);

	// ESCで閉じる
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (isRenaming) {
					setIsRenaming(false);
					setNewName(asset.name);
				} else {
					onClose();
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose, isRenaming, asset.name]);

	// リネームモード時にinputにフォーカス
	useEffect(() => {
		if (isRenaming && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isRenaming]);

	const handleApply = () => {
		onApply(asset);
		onClose();
	};

	const handleRename = () => {
		setIsRenaming(true);
	};

	const handleRenameSubmit = () => {
		if (newName.trim() && newName !== asset.name) {
			onRename(asset, newName.trim());
		}
		setIsRenaming(false);
		onClose();
	};

	const handleRenameKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleRenameSubmit();
		}
	};

	const handleDuplicate = () => {
		onDuplicate(asset);
		onClose();
	};

	const handleDelete = () => {
		onDelete(asset);
		onClose();
	};

	// メニュー位置の調整（画面外にはみ出さないように）
	const adjustedPosition = { ...position };
	if (menuRef.current) {
		const rect = menuRef.current.getBoundingClientRect();
		if (position.x + rect.width > window.innerWidth) {
			adjustedPosition.x = window.innerWidth - rect.width - 8;
		}
		if (position.y + rect.height > window.innerHeight) {
			adjustedPosition.y = window.innerHeight - rect.height - 8;
		}
	}

	return (
		<div
			ref={menuRef}
			className="fixed z-50 min-w-[160px] bg-popover border border-border rounded-md shadow-lg py-1"
			style={{
				left: adjustedPosition.x,
				top: adjustedPosition.y,
			}}
		>
			{isRenaming ? (
				<div className="px-2 py-1">
					<Input
						ref={inputRef}
						type="text"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						onKeyDown={handleRenameKeyDown}
						onBlur={handleRenameSubmit}
						className="h-7 text-sm"
					/>
				</div>
			) : (
				<>
					<button
						type="button"
						onClick={handleApply}
						className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
					>
						<MousePointer size={14} />
						{t("assetPanel.contextMenu.apply")}
					</button>
					<button
						type="button"
						onClick={handleRename}
						className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
					>
						<Pencil size={14} />
						{t("assetPanel.contextMenu.rename")}
					</button>
					<button
						type="button"
						onClick={handleDuplicate}
						className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
					>
						<Copy size={14} />
						{t("assetPanel.contextMenu.duplicate")}
					</button>
					<div className="my-1 border-t border-border" />
					<button
						type="button"
						onClick={handleDelete}
						className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-destructive hover:bg-destructive/10 transition-colors"
					>
						<Trash2 size={14} />
						{t("assetPanel.contextMenu.delete")}
					</button>
				</>
			)}
		</div>
	);
}
