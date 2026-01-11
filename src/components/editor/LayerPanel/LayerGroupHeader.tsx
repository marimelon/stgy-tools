/**
 * Layer group header component
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
import type { BoardObject } from "@/lib/stgy";
import type { DropTarget } from "./types";
import { useAutoScrollOnSelect } from "./useAutoScrollOnSelect";

interface LayerGroupHeaderProps {
	group: ObjectGroup;
	objects: BoardObject[];
	isAllSelected: boolean;
	isDragging: boolean;
	isAllVisible: boolean;
	isAllHidden: boolean;
	isAllLocked: boolean;
	isAllUnlocked: boolean;
	dropTarget: DropTarget | null;
	/** Flag to trigger edit mode from context menu */
	shouldStartEditing?: boolean;
	isFocused?: boolean;
	isOutsideFocus?: boolean;
	onDragStart: (e: DragEvent<HTMLDivElement>, groupId: string) => void;
	onDragOver: (e: DragEvent<HTMLDivElement>, objectId: string) => void;
	onDragEnd: () => void;
	onDrop: (e: DragEvent<HTMLDivElement>) => void;
	onSelect: (groupId: string, e: React.MouseEvent) => void;
	onToggleCollapse: (groupId: string, e: React.MouseEvent) => void;
	onToggleVisibility: (group: ObjectGroup) => void;
	onToggleLock: (group: ObjectGroup) => void;
	onUngroup: (groupId: string, e: React.MouseEvent) => void;
	onRename: (groupId: string, name: string) => void;
	onContextMenu: (e: React.MouseEvent, group: ObjectGroup) => void;
	onEditingStarted?: () => void;
	onFocus?: (groupId: string) => void;
	onUnfocus?: () => void;
}

export function LayerGroupHeader({
	group,
	objects,
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

	// Find the first objectId in group that exists in objects array
	const firstObjectId = group.objectIds.find((id) =>
		objects.some((o) => o.id === id),
	);
	const firstIndex = firstObjectId
		? objects.findIndex((o) => o.id === firstObjectId)
		: -1;
	const isDropBeforeGroup =
		dropTarget?.index === firstIndex && dropTarget?.position === "before";

	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const itemRef = useAutoScrollOnSelect(isAllSelected);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	// Reset editing state on group.id change (for undo/redo)
	// biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only trigger on group.id change
	useEffect(() => {
		if (isEditing) {
			setIsEditing(false);
		}
	}, [group.id]);

	useEffect(() => {
		if (shouldStartEditing) {
			setEditName(group.name || "");
			setIsEditing(true);
			onEditingStarted?.();
		}
	}, [shouldStartEditing, group.name, onEditingStarted]);

	const handleStartEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		setEditName(group.name || "");
		setIsEditing(true);
	};

	const handleSaveEdit = () => {
		const trimmed = editName.trim();
		if (trimmed !== (group.name || "")) {
			onRename(group.id, trimmed);
		}
		setIsEditing(false);
	};

	const handleCancelEdit = () => {
		setEditName(group.name || "");
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSaveEdit();
		} else if (e.key === "Escape") {
			handleCancelEdit();
		}
	};

	const getDisplayName = () => {
		if (group.name) {
			return group.name;
		}
		return `${t("layerPanel.group")} (${group.objectIds.length})`;
	};

	return (
		<div ref={itemRef} className="relative">
			{isDropBeforeGroup && (
				<div className="drop-indicator absolute top-0 left-1 right-1 z-10" />
			)}

			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Drag and drop layer item */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Interactive draggable layer */}
			<div
				draggable
				onDragStart={(e) => onDragStart(e, group.id)}
				onDragOver={(e) => firstObjectId && onDragOver(e, firstObjectId)}
				onDragEnd={onDragEnd}
				onDrop={onDrop}
				onClick={(e) => onSelect(group.id, e)}
				onContextMenu={(e) => onContextMenu(e, group)}
				className={`layer-item select-none ${isDragging ? "opacity-50" : isOutsideFocus ? "opacity-40" : ""} ${isFocused ? "focused" : isAllSelected ? "group-selected" : ""}`}
			>
				<span className="cursor-grab active:cursor-grabbing text-muted-foreground">
					<GripVertical size={14} />
				</span>

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

				<span className="text-purple-400 text-xs">⊞</span>

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

				{!isEditing && (
					<>
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
