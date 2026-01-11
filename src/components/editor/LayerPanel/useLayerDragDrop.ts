/**
 * Layer panel drag and drop hook
 */

import { type DragEvent, useCallback, useState } from "react";
import type { ObjectGroup } from "@/lib/editor/types";
import type { BoardObject } from "@/lib/stgy";
import type { DropTarget } from "./types";

export interface UseLayerDragDropParams {
	objects: BoardObject[];
	groups: ObjectGroup[];
	getGroupForObject: (objectId: string) => ObjectGroup | undefined;
	reorderLayer: (objectId: string, toIndex: number) => void;
	reorderGroup: (groupId: string, toIndex: number) => void;
	removeFromGroup: (objectId: string) => void;
}

export interface UseLayerDragDropReturn {
	draggedObjectId: string | null;
	draggedFromGroup: string | null;
	draggedGroupId: string | null;
	dropTarget: DropTarget | null;
	handleDragStart: (e: DragEvent<HTMLDivElement>, objectId: string) => void;
	handleGroupDragStart: (e: DragEvent<HTMLDivElement>, groupId: string) => void;
	handleDragOver: (
		e: DragEvent<HTMLDivElement>,
		targetObjectId: string,
	) => void;
	handleDragEnd: () => void;
	handleDrop: (e: DragEvent<HTMLDivElement>) => void;
	handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
}

export function useLayerDragDrop({
	objects,
	groups,
	getGroupForObject,
	reorderLayer,
	reorderGroup,
	removeFromGroup,
}: UseLayerDragDropParams): UseLayerDragDropReturn {
	const [draggedObjectId, setDraggedObjectId] = useState<string | null>(null);
	const [draggedFromGroup, setDraggedFromGroup] = useState<string | null>(null);
	const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
	const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

	const resetDragState = useCallback(() => {
		setDraggedObjectId(null);
		setDraggedFromGroup(null);
		setDraggedGroupId(null);
		setDropTarget(null);
	}, []);

	const handleDragStart = useCallback(
		(e: DragEvent<HTMLDivElement>, objectId: string) => {
			const group = getGroupForObject(objectId);

			setDraggedObjectId(objectId);
			setDraggedFromGroup(group?.id ?? null);
			setDraggedGroupId(null);
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", objectId);
		},
		[getGroupForObject],
	);

	const handleGroupDragStart = useCallback(
		(e: DragEvent<HTMLDivElement>, groupId: string) => {
			setDraggedObjectId(null);
			setDraggedFromGroup(null);
			setDraggedGroupId(groupId);
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", groupId);
		},
		[],
	);

	const handleDragOver = useCallback(
		(e: DragEvent<HTMLDivElement>, targetObjectId: string) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";

			const targetIndex = objects.findIndex((o) => o.id === targetObjectId);
			if (targetIndex === -1) return;

			if (draggedGroupId) {
				const draggingGroup = groups.find((g) => g.id === draggedGroupId);
				if (draggingGroup?.objectIds.includes(targetObjectId)) {
					setDropTarget(null);
					return;
				}

				const targetGroup = getGroupForObject(targetObjectId);
				if (targetGroup) {
					const firstInTargetGroup = targetGroup.objectIds.find((id) =>
						objects.some((o) => o.id === id),
					);
					if (targetObjectId !== firstInTargetGroup) {
						setDropTarget(null);
						return;
					}
				}

				const rect = e.currentTarget.getBoundingClientRect();
				const midY = rect.top + rect.height / 2;
				const position = e.clientY < midY ? "before" : "after";

				setDropTarget({ index: targetIndex, position });
				return;
			}

			// Allow drag within same group or outside groups
			const targetGroup = getGroupForObject(targetObjectId);

			if (targetGroup && targetGroup.id !== draggedFromGroup) {
				setDropTarget(null);
				return;
			}

			if (draggedObjectId === targetObjectId) {
				setDropTarget(null);
				return;
			}

			const draggedIndex = objects.findIndex((o) => o.id === draggedObjectId);

			const rect = e.currentTarget.getBoundingClientRect();
			const midY = rect.top + rect.height / 2;
			const position = e.clientY < midY ? "before" : "after";

			// Skip adjacent positions where no actual movement occurs
			const potentialToIndex =
				position === "before" ? targetIndex : targetIndex + 1;
			if (
				draggedIndex === potentialToIndex ||
				draggedIndex === potentialToIndex - 1
			) {
				setDropTarget(null);
				return;
			}

			setDropTarget({ index: targetIndex, position });
		},
		[
			objects,
			draggedObjectId,
			draggedFromGroup,
			draggedGroupId,
			groups,
			getGroupForObject,
		],
	);

	const handleDragEnd = useCallback(() => {
		resetDragState();
	}, [resetDragState]);

	const handleDrop = useCallback(
		(e: DragEvent<HTMLDivElement>) => {
			e.preventDefault();

			if (dropTarget === null) return;

			const toIndex =
				dropTarget.position === "before"
					? dropTarget.index
					: dropTarget.index + 1;

			if (draggedGroupId) {
				reorderGroup(draggedGroupId, toIndex);
				resetDragState();
				return;
			}

			if (draggedObjectId === null) return;

			const targetObject = objects[dropTarget.index];
			const targetGroup = targetObject
				? getGroupForObject(targetObject.id)
				: undefined;

			// Remove from group when dropping outside
			if (draggedFromGroup && !targetGroup) {
				removeFromGroup(draggedObjectId);
			}

			reorderLayer(draggedObjectId, toIndex);
			resetDragState();
		},
		[
			objects,
			draggedObjectId,
			draggedFromGroup,
			draggedGroupId,
			dropTarget,
			getGroupForObject,
			removeFromGroup,
			reorderLayer,
			reorderGroup,
			resetDragState,
		],
	);

	const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
			setDropTarget(null);
		}
	}, []);

	return {
		draggedObjectId,
		draggedFromGroup,
		draggedGroupId,
		dropTarget,
		handleDragStart,
		handleGroupDragStart,
		handleDragOver,
		handleDragEnd,
		handleDrop,
		handleDragLeave,
	};
}
