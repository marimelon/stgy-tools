/**
 * レイヤーパネルのドラッグ&ドロップフック
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

/**
 * レイヤーのドラッグ&ドロップを管理するフック
 */
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

	// ドラッグ状態をリセット
	const resetDragState = useCallback(() => {
		setDraggedObjectId(null);
		setDraggedFromGroup(null);
		setDraggedGroupId(null);
		setDropTarget(null);
	}, []);

	// オブジェクトのドラッグ開始
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

	// グループヘッダーのドラッグ開始
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

	// ドラッグオーバー（ドロップ位置の計算）
	const handleDragOver = useCallback(
		(e: DragEvent<HTMLDivElement>, targetObjectId: string) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";

			const targetIndex = objects.findIndex((o) => o.id === targetObjectId);
			if (targetIndex === -1) return;

			// グループをドラッグ中の場合
			if (draggedGroupId) {
				// 自分のグループ内オブジェクトの上はスキップ
				const draggingGroup = groups.find((g) => g.id === draggedGroupId);
				if (draggingGroup?.objectIds.includes(targetObjectId)) {
					setDropTarget(null);
					return;
				}

				// 他のグループの判定
				const targetGroup = getGroupForObject(targetObjectId);
				if (targetGroup) {
					// 他のグループのヘッダー上（firstObject）ならドロップ許可
					const firstInTargetGroup = targetGroup.objectIds.find((id) =>
						objects.some((o) => o.id === id),
					);
					if (targetObjectId !== firstInTargetGroup) {
						// グループ内の非先頭要素上→不可
						setDropTarget(null);
						return;
					}
					// 先頭要素上（グループヘッダー上）→許可して続行
				}

				// 上半分か下半分かを判定
				const rect = e.currentTarget.getBoundingClientRect();
				const midY = rect.top + rect.height / 2;
				const position = e.clientY < midY ? "before" : "after";

				setDropTarget({ index: targetIndex, position });
				return;
			}

			// オブジェクトをドラッグ中の場合
			// 同じグループ内でのドラッグの場合のみ許可
			// または、グループ外へのドラッグ（グループから除外）
			const targetGroup = getGroupForObject(targetObjectId);

			// ターゲットがグループ内で、ドラッグ元と異なるグループの場合は不可
			if (targetGroup && targetGroup.id !== draggedFromGroup) {
				setDropTarget(null);
				return;
			}

			// 自分自身の上はスキップ
			if (draggedObjectId === targetObjectId) {
				setDropTarget(null);
				return;
			}

			const draggedIndex = objects.findIndex((o) => o.id === draggedObjectId);

			// 上半分か下半分かを判定
			const rect = e.currentTarget.getBoundingClientRect();
			const midY = rect.top + rect.height / 2;
			const position = e.clientY < midY ? "before" : "after";

			// 実際に移動が発生しない位置（隣接位置）はスキップ
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

	// ドラッグ終了（リセット）
	const handleDragEnd = useCallback(() => {
		resetDragState();
	}, [resetDragState]);

	// ドロップ処理
	const handleDrop = useCallback(
		(e: DragEvent<HTMLDivElement>) => {
			e.preventDefault();

			if (dropTarget === null) return;

			// toIndex を計算
			// position が "before" なら targetIndex、"after" なら targetIndex + 1
			const toIndex =
				dropTarget.position === "before"
					? dropTarget.index
					: dropTarget.index + 1;

			// グループをドロップした場合
			if (draggedGroupId) {
				reorderGroup(draggedGroupId, toIndex);
				resetDragState();
				return;
			}

			// オブジェクトをドロップした場合
			if (draggedObjectId === null) return;

			// ドロップ先のグループを確認
			const targetObject = objects[dropTarget.index];
			const targetGroup = targetObject
				? getGroupForObject(targetObject.id)
				: undefined;

			// グループ外へドロップした場合、グループから除外
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

	// ドラッグリーブ時のリセット
	const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
		// リスト外に出た場合のみリセット
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
