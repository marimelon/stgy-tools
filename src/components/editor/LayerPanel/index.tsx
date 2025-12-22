/**
 * レイヤーパネルコンポーネント
 *
 * オブジェクトのレイヤー順を表示・編集（グループ対応）
 * ドラッグ&ドロップでレイヤー順序を変更可能
 */

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useEditor } from "@/lib/editor";
import type { ObjectGroup } from "@/lib/editor/types";
import { useLayerDragDrop } from "./useLayerDragDrop";
import { useLayerItems } from "./useLayerItems";
import { LayerObjectItem } from "./LayerObjectItem";
import { LayerGroupHeader } from "./LayerGroupHeader";

/**
 * レイヤーパネル
 */
export function LayerPanel() {
	const { t } = useTranslation();
	const {
		state,
		dispatch,
		selectObject,
		updateObject,
		commitHistory,
		selectGroup,
		ungroup,
		toggleGroupCollapse,
		getGroupForObject,
		reorderLayer,
		reorderGroup,
		removeFromGroup,
	} = useEditor();
	const { board, selectedIndices, groups } = state;
	const { objects } = board;

	// レイヤーアイテムと可視性ヘルパー
	const { layerItems, isGroupAllVisible, isGroupAllHidden } = useLayerItems({
		objects,
		getGroupForObject,
	});

	// ドラッグ&ドロップ
	const {
		draggedIndex,
		draggedGroupId,
		dropTarget,
		handleDragStart,
		handleGroupDragStart,
		handleDragOver,
		handleDragEnd,
		handleDrop,
		handleDragLeave,
	} = useLayerDragDrop({
		groups,
		getGroupForObject,
		reorderLayer,
		reorderGroup,
		removeFromGroup,
	});

	// オブジェクトの表示/非表示トグル
	const handleToggleVisibility = useCallback(
		(index: number) => {
			const obj = objects[index];
			updateObject(index, {
				flags: { ...obj.flags, visible: !obj.flags.visible },
			});
			commitHistory(t("layerPanel.visibilityChanged"));
		},
		[objects, updateObject, commitHistory, t],
	);

	// グループの表示/非表示トグル
	const handleToggleGroupVisibility = useCallback(
		(group: ObjectGroup) => {
			const allVisible = group.objectIndices.every(
				(i) => objects[i]?.flags.visible,
			);
			const newVisible = !allVisible;

			dispatch({
				type: "UPDATE_OBJECTS_BATCH",
				indices: group.objectIndices,
				updates: { flags: { visible: newVisible } },
			});
			commitHistory(t("layerPanel.groupVisibilityChanged"));
		},
		[objects, dispatch, commitHistory, t],
	);

	// オブジェクト選択
	const handleSelectObject = useCallback(
		(index: number, e: React.MouseEvent) => {
			const additive = e.ctrlKey || e.metaKey;
			selectObject(index, additive);
		},
		[selectObject],
	);

	// グループ選択
	const handleSelectGroup = useCallback(
		(groupId: string, e: React.MouseEvent) => {
			e.stopPropagation();
			selectGroup(groupId);
		},
		[selectGroup],
	);

	// グループ解除
	const handleUngroupClick = useCallback(
		(groupId: string, e: React.MouseEvent) => {
			e.stopPropagation();
			ungroup(groupId);
		},
		[ungroup],
	);

	// 折りたたみトグル
	const handleToggleCollapse = useCallback(
		(groupId: string, e: React.MouseEvent) => {
			e.stopPropagation();
			toggleGroupCollapse(groupId);
		},
		[toggleGroupCollapse],
	);

	return (
		<div
			className="panel flex flex-col h-full"
			style={{ background: "var(--color-bg-base)" }}
		>
			<div className="panel-header flex-shrink-0">
				<h2 className="panel-title">{t("layerPanel.title")}</h2>
			</div>

			{/* biome-ignore lint/a11y/noStaticElementInteractions: Drag container for layer reordering */}
			<div className="flex-1 overflow-y-auto" onDragLeave={handleDragLeave}>
				{objects.length === 0 ? (
					<div className="p-4 text-sm text-center text-muted-foreground">
						<div className="text-3xl mb-2 opacity-50">📋</div>
						{t("layerPanel.noObjects")}
					</div>
				) : (
					<div className="py-1">
						{layerItems.map((item) => {
							if (item.type === "group-header" && item.group) {
								const group = item.group;
								const allSelected = group.objectIndices.every((i) =>
									selectedIndices.includes(i),
								);

								return (
									<LayerGroupHeader
										key={`group-${group.id}`}
										group={group}
										isAllSelected={allSelected}
										isDragging={draggedGroupId === group.id}
										isAllVisible={isGroupAllVisible(group)}
										isAllHidden={isGroupAllHidden(group)}
										dropTarget={dropTarget}
										onDragStart={handleGroupDragStart}
										onDragOver={handleDragOver}
										onDragEnd={handleDragEnd}
										onDrop={handleDrop}
										onSelect={handleSelectGroup}
										onToggleCollapse={handleToggleCollapse}
										onToggleVisibility={handleToggleGroupVisibility}
										onUngroup={handleUngroupClick}
									/>
								);
							}

							if (item.type === "object" && item.index !== undefined) {
								const index = item.index;
								const obj = objects[index];

								return (
									<LayerObjectItem
										key={`obj-${index}`}
										index={index}
										object={obj}
										isSelected={selectedIndices.includes(index)}
										isInGroup={item.isInGroup}
										isDragging={draggedIndex === index}
										dropTarget={dropTarget}
										draggedGroupId={draggedGroupId}
										onDragStart={handleDragStart}
										onDragOver={handleDragOver}
										onDragEnd={handleDragEnd}
										onDrop={handleDrop}
										onSelect={handleSelectObject}
										onToggleVisibility={handleToggleVisibility}
									/>
								);
							}

							return null;
						})}
					</div>
				)}
			</div>

			{/* レイヤー数表示 */}
			<div className="px-3 py-2 text-xs flex justify-between flex-shrink-0 border-t border-border text-muted-foreground font-mono">
				<span>
					<span className="text-primary">{objects.length}</span> {t("layerPanel.objectCount")}
				</span>
				{groups.length > 0 && (
					<span>
						<span className="text-purple-400">{groups.length}</span> {t("layerPanel.groupCount")}
					</span>
				)}
			</div>
		</div>
	);
}
