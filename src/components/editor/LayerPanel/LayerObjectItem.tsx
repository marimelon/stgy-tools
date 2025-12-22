/**
 * レイヤーオブジェクトアイテムコンポーネント
 */

import type { DragEvent } from "react";
import type { BoardObject } from "@/lib/stgy";
import { ObjectNames } from "@/lib/stgy";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import type { DropTarget } from "./types";

interface LayerObjectItemProps {
	index: number;
	object: BoardObject;
	isSelected: boolean;
	isInGroup: boolean;
	isDragging: boolean;
	dropTarget: DropTarget | null;
	draggedGroupId: string | null;
	onDragStart: (e: DragEvent<HTMLDivElement>, index: number) => void;
	onDragOver: (e: DragEvent<HTMLDivElement>, index: number) => void;
	onDragEnd: () => void;
	onDrop: (e: DragEvent<HTMLDivElement>) => void;
	onSelect: (index: number, e: React.MouseEvent) => void;
	onToggleVisibility: (index: number) => void;
}

/**
 * レイヤーパネルのオブジェクトアイテム
 */
export function LayerObjectItem({
	index,
	object,
	isSelected,
	isInGroup,
	isDragging,
	dropTarget,
	draggedGroupId,
	onDragStart,
	onDragOver,
	onDragEnd,
	onDrop,
	onSelect,
	onToggleVisibility,
}: LayerObjectItemProps) {
	const name = ObjectNames[object.objectId] ?? `ID: ${object.objectId}`;

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
		<div className="relative">
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
				className={`layer-item select-none ${isInGroup ? "ml-4" : ""} ${isDragging ? "opacity-50" : ""} ${isSelected ? "bg-accent/20 border-accent" : ""}`}
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
					title={object.flags.visible ? "非表示にする" : "表示する"}
				>
					{object.flags.visible ? <Eye size={14} /> : <EyeOff size={14} />}
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
