/**
 * レイヤーパネルのドラッグ&ドロップフック
 */

import { type DragEvent, useCallback, useState } from "react";
import type { ObjectGroup } from "@/lib/editor/types";
import type { DropTarget } from "./types";

export interface UseLayerDragDropParams {
	groups: ObjectGroup[];
	getGroupForObject: (index: number) => ObjectGroup | undefined;
	reorderLayer: (fromIndex: number, toIndex: number) => void;
	reorderGroup: (groupId: string, toIndex: number) => void;
	removeFromGroup: (objectIndex: number) => void;
}

export interface UseLayerDragDropReturn {
	draggedIndex: number | null;
	draggedFromGroup: string | null;
	draggedGroupId: string | null;
	dropTarget: DropTarget | null;
	handleDragStart: (e: DragEvent<HTMLDivElement>, index: number) => void;
	handleGroupDragStart: (e: DragEvent<HTMLDivElement>, groupId: string) => void;
	handleDragOver: (e: DragEvent<HTMLDivElement>, targetIndex: number) => void;
	handleDragEnd: () => void;
	handleDrop: (e: DragEvent<HTMLDivElement>) => void;
	handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
}

/**
 * レイヤーのドラッグ&ドロップを管理するフック
 */
export function useLayerDragDrop({
	groups,
	getGroupForObject,
	reorderLayer,
	reorderGroup,
	removeFromGroup,
}: UseLayerDragDropParams): UseLayerDragDropReturn {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [draggedFromGroup, setDraggedFromGroup] = useState<string | null>(null);
	const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
	const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

	// ドラッグ状態をリセット
	const resetDragState = useCallback(() => {
		setDraggedIndex(null);
		setDraggedFromGroup(null);
		setDraggedGroupId(null);
		setDropTarget(null);
	}, []);

	// オブジェクトのドラッグ開始
	const handleDragStart = useCallback(
		(e: DragEvent<HTMLDivElement>, index: number) => {
			const group = getGroupForObject(index);

			setDraggedIndex(index);
			setDraggedFromGroup(group?.id ?? null);
			setDraggedGroupId(null);
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", String(index));
		},
		[getGroupForObject],
	);

	// グループヘッダーのドラッグ開始
	const handleGroupDragStart = useCallback(
		(e: DragEvent<HTMLDivElement>, groupId: string) => {
			setDraggedIndex(null);
			setDraggedFromGroup(null);
			setDraggedGroupId(groupId);
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", groupId);
		},
		[],
	);

	// ドラッグオーバー（ドロップ位置の計算）
	const handleDragOver = useCallback(
		(e: DragEvent<HTMLDivElement>, targetIndex: number) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";

			// グループをドラッグ中の場合
			if (draggedGroupId) {
				// 自分のグループ内オブジェクトの上はスキップ
				const draggingGroup = groups.find((g) => g.id === draggedGroupId);
				if (draggingGroup?.objectIndices.includes(targetIndex)) {
					setDropTarget(null);
					return;
				}

				// 他のグループの判定
				const targetGroup = getGroupForObject(targetIndex);
				if (targetGroup) {
					// 他のグループのヘッダー上（firstIndex）ならドロップ許可
					const firstInTargetGroup = Math.min(...targetGroup.objectIndices);
					if (targetIndex !== firstInTargetGroup) {
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
			const targetGroup = getGroupForObject(targetIndex);

			// ターゲットがグループ内で、ドラッグ元と異なるグループの場合は不可
			if (targetGroup && targetGroup.id !== draggedFromGroup) {
				setDropTarget(null);
				return;
			}

			// 自分自身の上はスキップ
			if (draggedIndex === targetIndex) {
				setDropTarget(null);
				return;
			}

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
		[draggedIndex, draggedFromGroup, draggedGroupId, groups, getGroupForObject],
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
			if (draggedIndex === null) return;

			// ドロップ先のグループを確認
			const targetGroup = getGroupForObject(dropTarget.index);

			// グループ外へドロップした場合、グループから除外
			if (draggedFromGroup && !targetGroup) {
				removeFromGroup(draggedIndex);
			}

			reorderLayer(draggedIndex, toIndex);
			resetDragState();
		},
		[
			draggedIndex,
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
		draggedIndex,
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
