/**
 * レイヤーグループヘッダーコンポーネント
 */

import type { DragEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ObjectGroup } from "@/lib/editor/types";
import {
	GripVertical,
	Eye,
	EyeOff,
	ChevronRight,
	ChevronDown,
	X,
} from "lucide-react";
import type { DropTarget } from "./types";

interface LayerGroupHeaderProps {
	group: ObjectGroup;
	isAllSelected: boolean;
	isDragging: boolean;
	isAllVisible: boolean;
	isAllHidden: boolean;
	dropTarget: DropTarget | null;
	onDragStart: (e: DragEvent<HTMLDivElement>, groupId: string) => void;
	onDragOver: (e: DragEvent<HTMLDivElement>, index: number) => void;
	onDragEnd: () => void;
	onDrop: (e: DragEvent<HTMLDivElement>) => void;
	onSelect: (groupId: string, e: React.MouseEvent) => void;
	onToggleCollapse: (groupId: string, e: React.MouseEvent) => void;
	onToggleVisibility: (group: ObjectGroup) => void;
	onUngroup: (groupId: string, e: React.MouseEvent) => void;
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
	dropTarget,
	onDragStart,
	onDragOver,
	onDragEnd,
	onDrop,
	onSelect,
	onToggleCollapse,
	onToggleVisibility,
	onUngroup,
}: LayerGroupHeaderProps) {
	const { t } = useTranslation();
	const firstIndex = Math.min(...group.objectIndices);
	const isDropBeforeGroup =
		dropTarget?.index === firstIndex && dropTarget?.position === "before";

	return (
		<div className="relative">
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
				className={`layer-item select-none ${isDragging ? "opacity-50" : ""} ${isAllSelected ? "bg-purple-500/15 border-purple-500" : ""}`}
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

				{/* グループ名 */}
				<span
					className={`flex-1 text-xs truncate font-medium ${isAllHidden ? "text-purple-400/50" : "text-purple-400"}`}
				>
					{t("layerPanel.group")} ({group.objectIndices.length})
				</span>

				{/* グループ表示/非表示トグル */}
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onToggleVisibility(group);
					}}
					className={isAllVisible ? "text-purple-400" : "text-muted-foreground"}
					title={
						isAllVisible ? t("layerPanel.hideGroup") : t("layerPanel.showGroup")
					}
				>
					{isAllVisible ? <Eye size={14} /> : <EyeOff size={14} />}
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
			</div>
		</div>
	);
}
