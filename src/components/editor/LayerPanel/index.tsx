/**
 * Layer panel component
 *
 * Displays and edits object layer order with group support.
 * Drag and drop to reorder layers.
 */

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	useCanGroup,
	useEditorActions,
	useFocusedGroupId,
	useGlobalClipboard,
	useGroups,
	useIsFocusMode,
	useObjects,
	useSelectedIds,
} from "@/lib/editor";
import type { ObjectGroup } from "@/lib/editor/types";
import { LayerContextMenu } from "./LayerContextMenu";
import { LayerGroupHeader } from "./LayerGroupHeader";
import { LayerObjectItem } from "./LayerObjectItem";
import { useLayerContextMenu } from "./useLayerContextMenu";
import { useLayerDragDrop } from "./useLayerDragDrop";
import { useLayerItems } from "./useLayerItems";

export function LayerPanel() {
	const { t } = useTranslation();

	const objects = useObjects();
	const selectedIds = useSelectedIds();
	const groups = useGroups();
	const hasClipboard = useGlobalClipboard();

	const canGroup = useCanGroup();
	const focusedGroupId = useFocusedGroupId();
	const isFocusMode = useIsFocusMode();

	const selectedIdsSet = new Set(selectedIds);

	const {
		selectObject,
		updateObject,
		updateObjectsBatch,
		commitHistory,
		selectGroup,
		ungroup,
		renameGroup,
		toggleGroupCollapse,
		reorderLayer,
		reorderGroup,
		removeFromGroup,
		copySelected,
		paste,
		duplicateSelected,
		deleteSelected,
		groupSelected,
		moveSelectedLayer,
		focusGroup,
		unfocus,
	} = useEditorActions();

	const getGroupForObject = useCallback(
		(objectId: string): ObjectGroup | undefined => {
			return groups.find((g) => g.objectIds.includes(objectId));
		},
		[groups],
	);

	const { menuState, openObjectMenu, openGroupMenu, closeMenu } =
		useLayerContextMenu();

	const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

	const {
		layerItems,
		isGroupAllVisible,
		isGroupAllHidden,
		isGroupAllLocked,
		isGroupAllUnlocked,
	} = useLayerItems({
		objects,
		getGroupForObject,
	});

	const {
		draggedObjectId,
		draggedGroupId,
		dropTarget,
		handleDragStart,
		handleGroupDragStart,
		handleDragOver,
		handleDragEnd,
		handleDrop,
		handleDragLeave,
	} = useLayerDragDrop({
		objects,
		groups,
		getGroupForObject,
		reorderLayer,
		reorderGroup,
		removeFromGroup,
	});

	const handleToggleVisibility = useCallback(
		(objectId: string) => {
			const obj = objects.find((o) => o.id === objectId);
			if (!obj) return;
			updateObject(objectId, {
				flags: { ...obj.flags, visible: !obj.flags.visible },
			});
			commitHistory(t("layerPanel.visibilityChanged"));
		},
		[objects, updateObject, commitHistory, t],
	);

	const handleToggleGroupVisibility = useCallback(
		(group: ObjectGroup) => {
			const groupObjects = objects.filter((o) =>
				group.objectIds.includes(o.id),
			);
			const allVisible = groupObjects.every((o) => o.flags.visible);
			const newVisible = !allVisible;

			updateObjectsBatch(group.objectIds, {
				flags: { visible: newVisible },
			});
			commitHistory(t("layerPanel.groupVisibilityChanged"));
		},
		[objects, updateObjectsBatch, commitHistory, t],
	);

	const handleToggleLock = useCallback(
		(objectId: string) => {
			const obj = objects.find((o) => o.id === objectId);
			if (!obj) return;
			updateObject(objectId, {
				flags: { ...obj.flags, locked: !obj.flags.locked },
			});
			commitHistory(t("layerPanel.lockChanged"));
		},
		[objects, updateObject, commitHistory, t],
	);

	const handleToggleGroupLock = useCallback(
		(group: ObjectGroup) => {
			const groupObjects = objects.filter((o) =>
				group.objectIds.includes(o.id),
			);
			const allLocked = groupObjects.every((o) => o.flags.locked);
			const newLocked = !allLocked;

			updateObjectsBatch(group.objectIds, {
				flags: { locked: newLocked },
			});
			commitHistory(t("layerPanel.groupLockChanged"));
		},
		[objects, updateObjectsBatch, commitHistory, t],
	);

	const handleSelectObject = useCallback(
		(objectId: string, e: React.MouseEvent) => {
			const additive = e.shiftKey || e.metaKey || e.ctrlKey;
			selectObject(objectId, additive);
		},
		[selectObject],
	);

	const handleSelectGroup = useCallback(
		(groupId: string, e: React.MouseEvent) => {
			e.stopPropagation();
			selectGroup(groupId);
		},
		[selectGroup],
	);

	const handleUngroupClick = useCallback(
		(groupId: string, e: React.MouseEvent) => {
			e.stopPropagation();
			ungroup(groupId);
		},
		[ungroup],
	);

	const handleRenameGroup = useCallback(
		(groupId: string, name: string) => {
			renameGroup(groupId, name);
		},
		[renameGroup],
	);

	const handleToggleCollapse = useCallback(
		(groupId: string, e: React.MouseEvent) => {
			e.stopPropagation();
			toggleGroupCollapse(groupId);
		},
		[toggleGroupCollapse],
	);

	const handleStartRenameGroup = useCallback((groupId: string) => {
		setEditingGroupId(groupId);
	}, []);

	const handleEditingStarted = useCallback(() => {
		setEditingGroupId(null);
	}, []);

	const contextMenuActions = useMemo(
		() => ({
			copy: () => {
				copySelected();
				commitHistory(t("contextMenu.copy"));
			},
			paste: () => {
				paste();
				commitHistory(t("contextMenu.paste"));
			},
			duplicate: () => {
				duplicateSelected();
				commitHistory(t("contextMenu.duplicate"));
			},
			delete: () => {
				deleteSelected();
				commitHistory(t("contextMenu.delete"));
			},
			group: () => {
				groupSelected();
				commitHistory(t("contextMenu.group"));
			},
			ungroup: (groupId: string) => {
				ungroup(groupId);
			},
			removeFromGroup: (objectId: string) => {
				removeFromGroup(objectId);
			},
			toggleVisibility: (objectId: string) => {
				handleToggleVisibility(objectId);
			},
			toggleLock: (objectId: string) => {
				handleToggleLock(objectId);
			},
			toggleGroupVisibility: (group: ObjectGroup) => {
				handleToggleGroupVisibility(group);
			},
			toggleGroupLock: (group: ObjectGroup) => {
				handleToggleGroupLock(group);
			},
			moveLayer: (direction: "front" | "back" | "forward" | "backward") => {
				if (selectedIds.length === 1) {
					moveSelectedLayer(direction);
				}
			},
			startRenameGroup: handleStartRenameGroup,
			toggleGroupCollapse: (groupId: string) => {
				toggleGroupCollapse(groupId);
			},
			focusGroup,
			unfocus,
		}),
		[
			copySelected,
			paste,
			duplicateSelected,
			deleteSelected,
			groupSelected,
			ungroup,
			removeFromGroup,
			handleToggleVisibility,
			handleToggleLock,
			handleToggleGroupVisibility,
			handleToggleGroupLock,
			moveSelectedLayer,
			selectedIds,
			handleStartRenameGroup,
			toggleGroupCollapse,
			commitHistory,
			t,
			focusGroup,
			unfocus,
		],
	);

	return (
		<div
			className="flex flex-col h-full"
			style={{ background: "var(--color-bg-base)" }}
		>
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
								const allSelected = group.objectIds.every((id) =>
									selectedIdsSet.has(id),
								);

								return (
									<LayerGroupHeader
										key={`group-${group.id}`}
										group={group}
										objects={objects}
										isAllSelected={allSelected}
										isDragging={draggedGroupId === group.id}
										isAllVisible={isGroupAllVisible(group)}
										isAllHidden={isGroupAllHidden(group)}
										isAllLocked={isGroupAllLocked(group)}
										isAllUnlocked={isGroupAllUnlocked(group)}
										dropTarget={dropTarget}
										shouldStartEditing={editingGroupId === group.id}
										isFocused={focusedGroupId === group.id}
										isOutsideFocus={isFocusMode && focusedGroupId !== group.id}
										onDragStart={handleGroupDragStart}
										onDragOver={handleDragOver}
										onDragEnd={handleDragEnd}
										onDrop={handleDrop}
										onSelect={handleSelectGroup}
										onToggleCollapse={handleToggleCollapse}
										onToggleVisibility={handleToggleGroupVisibility}
										onToggleLock={handleToggleGroupLock}
										onUngroup={handleUngroupClick}
										onRename={handleRenameGroup}
										onContextMenu={openGroupMenu}
										onEditingStarted={handleEditingStarted}
										onFocus={focusGroup}
										onUnfocus={unfocus}
									/>
								);
							}

							if (item.type === "object" && item.objectId !== undefined) {
								const objectId = item.objectId;
								const obj = objects.find((o) => o.id === objectId);
								if (!obj) return null;

								const focusedGroupObj = focusedGroupId
									? groups.find((g) => g.id === focusedGroupId)
									: null;
								const isObjectOutsideFocus =
									isFocusMode && !focusedGroupObj?.objectIds.includes(objectId);

								return (
									<LayerObjectItem
										key={`obj-${objectId}`}
										objectId={objectId}
										object={obj}
										isSelected={selectedIdsSet.has(objectId)}
										isInGroup={item.isInGroup}
										isLastInGroup={item.isLastInGroup}
										groupId={item.groupId}
										isDragging={draggedObjectId === objectId}
										dropTarget={dropTarget}
										draggedGroupId={draggedGroupId}
										isOutsideFocus={isObjectOutsideFocus}
										onDragStart={handleDragStart}
										onDragOver={handleDragOver}
										onDragEnd={handleDragEnd}
										onDrop={handleDrop}
										onSelect={handleSelectObject}
										onToggleVisibility={handleToggleVisibility}
										onToggleLock={handleToggleLock}
										onContextMenu={openObjectMenu}
									/>
								);
							}

							return null;
						})}
					</div>
				)}
			</div>

			<div className="px-3 py-2 text-xs flex justify-between flex-shrink-0 border-t border-border text-muted-foreground font-mono">
				<span>
					<span className="text-primary">{objects.length}</span>{" "}
					{t("layerPanel.objectCount")}
				</span>
				{groups.length > 0 && (
					<span>
						<span className="text-purple-400">{groups.length}</span>{" "}
						{t("layerPanel.groupCount")}
					</span>
				)}
			</div>

			<LayerContextMenu
				menuState={menuState}
				onClose={closeMenu}
				objects={objects}
				selectedIds={selectedIds}
				hasClipboard={hasClipboard}
				canGroup={canGroup}
				isGroupAllVisible={isGroupAllVisible}
				isGroupAllLocked={isGroupAllLocked}
				focusedGroupId={focusedGroupId}
				actions={contextMenuActions}
			/>
		</div>
	);
}
