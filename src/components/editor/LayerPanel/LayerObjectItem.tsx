/**
 * Layer object item component
 */

import { Eye, EyeOff, GripVertical, Lock, LockOpen } from "lucide-react";
import type { DragEvent } from "react";
import { useTranslation } from "react-i18next";
import type { BoardObject } from "@/lib/stgy";
import type { DropTarget } from "./types";
import { useAutoScrollOnSelect } from "./useAutoScrollOnSelect";

interface LayerObjectItemProps {
	objectId: string;
	object: BoardObject;
	isSelected: boolean;
	isInGroup: boolean;
	isLastInGroup?: boolean;
	groupId?: string;
	isDragging: boolean;
	dropTarget: DropTarget | null;
	draggedGroupId: string | null;
	isOutsideFocus?: boolean;
	onDragStart: (e: DragEvent<HTMLDivElement>, objectId: string) => void;
	onDragOver: (e: DragEvent<HTMLDivElement>, objectId: string) => void;
	onDragEnd: () => void;
	onDrop: (e: DragEvent<HTMLDivElement>) => void;
	onSelect: (objectId: string, e: React.MouseEvent) => void;
	onToggleVisibility: (objectId: string) => void;
	onToggleLock: (objectId: string) => void;
	onContextMenu: (
		e: React.MouseEvent,
		objectId: string,
		isInGroup: boolean,
		groupId?: string,
	) => void;
}

export function LayerObjectItem({
	objectId,
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

	const isDropBefore =
		dropTarget !== null &&
		!(draggedGroupId && isInGroup) &&
		dropTarget.position === "before";
	const isDropAfter =
		dropTarget !== null &&
		!(draggedGroupId && isInGroup) &&
		dropTarget.position === "after";

	return (
		<div ref={itemRef} className="relative">
			{isDropBefore && (
				<div className="drop-indicator absolute top-0 left-1 right-1 z-10" />
			)}

			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Drag and drop layer item */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Interactive draggable layer */}
			<div
				draggable
				onDragStart={(e) => onDragStart(e, objectId)}
				onDragOver={(e) => onDragOver(e, objectId)}
				onDragEnd={onDragEnd}
				onDrop={onDrop}
				onClick={(e) => onSelect(objectId, e)}
				onContextMenu={(e) => onContextMenu(e, objectId, isInGroup, groupId)}
				className={`layer-item select-none ${isInGroup ? "in-group" : ""} ${isLastInGroup ? "last-in-group" : ""} ${isDragging ? "opacity-50" : isOutsideFocus ? "opacity-40" : ""} ${isSelected ? "selected" : ""}`}
			>
				<span className="cursor-grab active:cursor-grabbing text-muted-foreground">
					<GripVertical size={14} />
				</span>

				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onToggleVisibility(objectId);
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

				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onToggleLock(objectId);
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

				<span
					className={`flex-1 text-xs truncate ${object.flags.visible ? "text-foreground" : "text-muted-foreground"}`}
				>
					{name}
					{object.text && (
						<span className="text-muted-foreground"> "{object.text}"</span>
					)}
				</span>
			</div>

			{isDropAfter && (
				<div className="drop-indicator absolute bottom-0 left-1 right-1 z-10" />
			)}
		</div>
	);
}
