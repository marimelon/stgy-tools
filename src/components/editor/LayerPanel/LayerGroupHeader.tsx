/**
 * レイヤーグループヘッダーコンポーネント
 */

import {
	ChevronDown,
	ChevronRight,
	Eye,
	EyeOff,
	Focus,
	GripVertical,
	Lock,
	LockOpen,
	X,
} from "lucide-react";
import { type DragEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ObjectGroup } from "@/lib/editor/types";
import type { DropTarget } from "./types";
import { useAutoScrollOnSelect } from "./useAutoScrollOnSelect";

interface LayerGroupHeaderProps {
	group: ObjectGroup;
	isAllSelected: boolean;
	isDragging: boolean;
	isAllVisible: boolean;
	isAllHidden: boolean;
	isAllLocked: boolean;
	isAllUnlocked: boolean;
	dropTarget: DropTarget | null;
	/** 外部から編集モードを開始するためのフラグ（コンテキストメニュー用） */
	shouldStartEditing?: boolean;
	/** このグループがフォーカス中かどうか */
	isFocused?: boolean;
	/** フォーカスモードで他のグループがフォーカスされている場合 */
	isOutsideFocus?: boolean;
	onDragStart: (e: DragEvent<HTMLDivElement>, groupId: string) => void;
	onDragOver: (e: DragEvent<HTMLDivElement>, index: number) => void;
	onDragEnd: () => void;
	onDrop: (e: DragEvent<HTMLDivElement>) => void;
	onSelect: (groupId: string, e: React.MouseEvent) => void;
	onToggleCollapse: (groupId: string, e: React.MouseEvent) => void;
	onToggleVisibility: (group: ObjectGroup) => void;
	onToggleLock: (group: ObjectGroup) => void;
	onUngroup: (groupId: string, e: React.MouseEvent) => void;
	onRename: (groupId: string, name: string) => void;
	onContextMenu: (e: React.MouseEvent, group: ObjectGroup) => void;
	/** 編集モード開始後のクリアコールバック */
	onEditingStarted?: () => void;
	/** フォーカスボタンクリック時のコールバック */
	onFocus?: (groupId: string) => void;
	/** フォーカス解除ボタンクリック時のコールバック */
	onUnfocus?: () => void;
}

/**
 * レイヤーパネルのグループヘッダー
 */
export function LayerGroupHeader({
	group,
	isAllSelected,
	isDragging,
	isAllVisible,
	isAllHidden,
	isAllLocked,
	isAllUnlocked,
	dropTarget,
	shouldStartEditing,
	isFocused = false,
	isOutsideFocus = false,
	onDragStart,
	onDragOver,
	onDragEnd,
	onDrop,
	onSelect,
	onToggleCollapse,
	onToggleVisibility,
	onToggleLock,
	onUngroup,
	onRename,
	onContextMenu,
	onEditingStarted,
	onFocus,
	onUnfocus,
}: LayerGroupHeaderProps) {
	const { t } = useTranslation();
	const firstIndex = Math.min(...group.objectIndices);
	const isDropBeforeGroup =
		dropTarget?.index === firstIndex && dropTarget?.position === "before";

	// 編集状態管理
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const itemRef = useAutoScrollOnSelect(isAllSelected);

	// 編集開始時にフォーカス
	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	// group.id が変わったら編集をリセット（Undo/Redo対応）
	// biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only trigger on group.id change
	useEffect(() => {
		if (isEditing) {
			setIsEditing(false);
		}
	}, [group.id]);

	// 外部から編集モードを開始（コンテキストメニュー用）
	useEffect(() => {
		if (shouldStartEditing) {
			setEditName(group.name || "");
			setIsEditing(true);
			onEditingStarted?.();
		}
	}, [shouldStartEditing, group.name, onEditingStarted]);

	// 編集開始
	const handleStartEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		setEditName(group.name || "");
		setIsEditing(true);
	};

	// 保存
	const handleSaveEdit = () => {
		const trimmed = editName.trim();
		if (trimmed !== (group.name || "")) {
			onRename(group.id, trimmed);
		}
		setIsEditing(false);
	};

	// キャンセル
	const handleCancelEdit = () => {
		setEditName(group.name || "");
		setIsEditing(false);
	};

	// キー入力
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSaveEdit();
		} else if (e.key === "Escape") {
			handleCancelEdit();
		}
	};

	// 表示名取得
	const getDisplayName = () => {
		if (group.name) {
			return group.name;
		}
		return `${t("layerPanel.group")} (${group.objectIndices.length})`;
	};

	return (
		<div ref={itemRef} className="relative">
			{/* ドロップインジケーター（グループの前） */}
			{isDropBeforeGroup && (
				<div className="drop-indicator absolute top-0 left-1 right-1 z-10" />
			)}

			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Drag and drop layer item */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Interactive draggable layer */}
			<div
				draggable
				onDragStart={(e) => onDragStart(e, group.id)}
				onDragOver={(e) => onDragOver(e, firstIndex)}
				onDragEnd={onDragEnd}
				onDrop={onDrop}
				onClick={(e) => onSelect(group.id, e)}
				onContextMenu={(e) => onContextMenu(e, group)}
				className={`layer-item select-none ${isDragging ? "opacity-50" : isOutsideFocus ? "opacity-40" : ""} ${isFocused ? "focused" : isAllSelected ? "group-selected" : ""}`}
			>
				{/* ドラッグハンドル */}
				<span className="cursor-grab active:cursor-grabbing text-muted-foreground">
					<GripVertical size={14} />
				</span>

				{/* 折りたたみトグル */}
				<button
					type="button"
					onClick={(e) => onToggleCollapse(group.id, e)}
					className="w-4 text-muted-foreground hover:text-foreground"
				>
					{group.collapsed ? (
						<ChevronRight size={14} />
					) : (
						<ChevronDown size={14} />
					)}
				</button>

				{/* グループアイコン */}
				<span className="text-purple-400 text-xs">⊞</span>

				{/* グループ名（編集可能） */}
				{isEditing ? (
					<input
						ref={inputRef}
						type="text"
						value={editName}
						onChange={(e) => setEditName(e.target.value)}
						onBlur={handleSaveEdit}
						onKeyDown={handleKeyDown}
						onClick={(e) => e.stopPropagation()}
						maxLength={100}
						className="flex-1 text-xs font-medium px-1 py-0.5 border border-primary rounded bg-background text-purple-400"
						aria-label={t("layerPanel.editGroupName")}
					/>
				) : (
					// biome-ignore lint/a11y/noStaticElementInteractions: Double-click to edit group name
					<span
						onDoubleClick={handleStartEdit}
						className={`flex-1 text-xs truncate cursor-text ${
							isAllHidden ? "text-purple-400/50" : "text-purple-400"
						} ${group.name ? "font-semibold" : "font-medium"}`}
						title={getDisplayName()}
					>
						{getDisplayName()}
					</span>
				)}

				{/* 編集中は他のボタンを非表示 */}
				{!isEditing && (
					<>
						{/* グループ表示/非表示トグル */}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onToggleVisibility(group);
							}}
							className={
								isAllVisible ? "text-purple-400" : "text-muted-foreground"
							}
							title={
								isAllVisible
									? t("layerPanel.hideGroup")
									: t("layerPanel.showGroup")
							}
						>
							{isAllVisible ? <Eye size={14} /> : <EyeOff size={14} />}
						</button>

						{/* グループロック/ロック解除トグル */}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onToggleLock(group);
							}}
							className={
								isAllLocked
									? "text-purple-400"
									: isAllUnlocked
										? "text-muted-foreground"
										: "text-purple-400/50"
							}
							title={
								isAllLocked
									? t("layerPanel.unlockGroup")
									: t("layerPanel.lockGroup")
							}
						>
							{isAllLocked ? <Lock size={14} /> : <LockOpen size={14} />}
						</button>

						{/* フォーカスボタン */}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								if (isFocused) {
									onUnfocus?.();
								} else {
									onFocus?.(group.id);
								}
							}}
							className={
								isFocused
									? "text-blue-400"
									: "text-muted-foreground hover:text-foreground"
							}
							title={
								isFocused
									? t("layerPanel.exitFocus")
									: t("layerPanel.focusGroup")
							}
						>
							<Focus size={14} />
						</button>

						{/* グループ解除ボタン */}
						<button
							type="button"
							onClick={(e) => onUngroup(group.id, e)}
							className="text-muted-foreground hover:text-foreground"
							title={t("layerPanel.ungroup")}
						>
							<X size={14} />
						</button>
					</>
				)}
			</div>
		</div>
	);
}
