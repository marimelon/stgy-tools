/**
 * レイヤーオブジェクトアイテムコンポーネント
 */

import { Eye, EyeOff, GripVertical, Lock, LockOpen } from "lucide-react";
import type { DragEvent } from "react";
import { useTranslation } from "react-i18next";
import type { BoardObject } from "@/lib/stgy";
import type { DropTarget } from "./types";
import { useAutoScrollOnSelect } from "./useAutoScrollOnSelect";

interface LayerObjectItemProps {
	index: number;
	object: BoardObject;
	isSelected: boolean;
	isInGroup: boolean;
	isLastInGroup?: boolean;
	groupId?: string;
	isDragging: boolean;
	dropTarget: DropTarget | null;
	draggedGroupId: string | null;
	/** フォーカスモードでフォーカス外のオブジェクトかどうか */
	isOutsideFocus?: boolean;
	onDragStart: (e: DragEvent<HTMLDivElement>, index: number) => void;
	onDragOver: (e: DragEvent<HTMLDivElement>, index: number) => void;
	onDragEnd: () => void;
	onDrop: (e: DragEvent<HTMLDivElement>) => void;
	onSelect: (index: number, e: React.MouseEvent) => void;
	onToggleVisibility: (index: number) => void;
	onToggleLock: (index: number) => void;
	onContextMenu: (
		e: React.MouseEvent,
		index: number,
		isInGroup: boolean,
		groupId?: string,
	) => void;
}

/**
 * レイヤーパネルのオブジェクトアイテム
 */
export function LayerObjectItem({
	index,
	object,
	isSelected,
	isInGroup,
	isLastInGroup,
	groupId,
	isDragging,
	dropTarget,
	draggedGroupId,
	isOutsideFocus = false,
	onDragStart,
	onDragOver,
	onDragEnd,
	onDrop,
	onSelect,
	onToggleVisibility,
	onToggleLock,
	onContextMenu,
}: LayerObjectItemProps) {
	const { t } = useTranslation();
	const itemRef = useAutoScrollOnSelect(isSelected);
	const name = t(`object.${object.objectId}`, {
		defaultValue: `ID: ${object.objectId}`,
	});

	// グループドラッグ中でグループ内アイテムの場合はグループヘッダーに任せる
	const isDropBefore =
		dropTarget?.index === index &&
		dropTarget?.position === "before" &&
		!(draggedGroupId && isInGroup);
	const isDropAfter =
		dropTarget?.index === index &&
		dropTarget?.position === "after" &&
		!(draggedGroupId && isInGroup);

	return (
		<div ref={itemRef} className="relative">
			{/* ドロップインジケーター（前） */}
			{isDropBefore && (
				<div className="drop-indicator absolute top-0 left-1 right-1 z-10" />
			)}

			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Drag and drop layer item */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Interactive draggable layer */}
			<div
				draggable
				onDragStart={(e) => onDragStart(e, index)}
				onDragOver={(e) => onDragOver(e, index)}
				onDragEnd={onDragEnd}
				onDrop={onDrop}
				onClick={(e) => onSelect(index, e)}
				onContextMenu={(e) => onContextMenu(e, index, isInGroup, groupId)}
				className={`layer-item select-none ${isInGroup ? "in-group" : ""} ${isLastInGroup ? "last-in-group" : ""} ${isDragging ? "opacity-50" : isOutsideFocus ? "opacity-40" : ""} ${isSelected ? "selected" : ""}`}
			>
				{/* ドラッグハンドル */}
				<span className="cursor-grab active:cursor-grabbing text-muted-foreground">
					<GripVertical size={14} />
				</span>

				{/* 表示/非表示トグル */}
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onToggleVisibility(index);
					}}
					className={
						object.flags.visible ? "text-foreground" : "text-muted-foreground"
					}
					title={
						object.flags.visible
							? t("layerPanel.hideObject")
							: t("layerPanel.showObject")
					}
				>
					{object.flags.visible ? <Eye size={14} /> : <EyeOff size={14} />}
				</button>

				{/* ロック/ロック解除トグル */}
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onToggleLock(index);
					}}
					className={
						object.flags.locked ? "text-foreground" : "text-muted-foreground"
					}
					title={
						object.flags.locked
							? t("layerPanel.unlockObject")
							: t("layerPanel.lockObject")
					}
				>
					{object.flags.locked ? <Lock size={14} /> : <LockOpen size={14} />}
				</button>

				{/* オブジェクト名 */}
				<span
					className={`flex-1 text-xs truncate ${object.flags.visible ? "text-foreground" : "text-muted-foreground"}`}
				>
					{name}
					{object.text && (
						<span className="text-muted-foreground"> "{object.text}"</span>
					)}
				</span>
			</div>

			{/* ドロップインジケーター（後） */}
			{isDropAfter && (
				<div className="drop-indicator absolute bottom-0 left-1 right-1 z-10" />
			)}
		</div>
	);
}
