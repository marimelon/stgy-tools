/**
 * ドラッグ/回転/リサイズインタラクションフック
 *
 * オブジェクトのドラッグ移動、回転、リサイズ操作を管理
 */

import { useState, useCallback, type RefObject } from "react";
import type { BoardObject, Position } from "@/lib/stgy";
import type { DragState, ResizeHandle, GridSettings } from "../types";
import { screenToSVG, calculateRotation, snapToGrid } from "../coordinates";
import { isPointInObject } from "./hit-testing";

export interface UseDragInteractionParams {
	svgRef: RefObject<SVGSVGElement | null>;
	objects: BoardObject[];
	selectedIndices: number[];
	gridSettings: GridSettings;
	selectObject: (index: number, additive?: boolean) => void;
	selectGroup: (groupId: string) => void;
	getGroupForObject: (
		index: number,
	) => { id: string; objectIndices: number[] } | undefined;
	updateObject: (index: number, updates: Partial<BoardObject>) => void;
	moveObjects: (indices: number[], deltaX: number, deltaY: number) => void;
	commitHistory: (description: string) => void;
}

export interface UseDragInteractionReturn {
	dragState: DragState | null;
	handleObjectClick: (index: number, e: React.MouseEvent) => void;
	handleObjectPointerDown: (index: number, e: React.PointerEvent) => void;
	handleRotateStart: (e: React.PointerEvent) => void;
	handleResizeStart: (handle: ResizeHandle, e: React.PointerEvent) => void;
	handleDragMove: (currentPointer: Position) => void;
	completeDrag: () => void;
}

/**
 * ドラッグ/回転/リサイズインタラクションフック
 */
export function useDragInteraction({
	svgRef,
	objects,
	selectedIndices,
	gridSettings,
	selectObject,
	selectGroup,
	getGroupForObject,
	updateObject,
	moveObjects,
	commitHistory,
}: UseDragInteractionParams): UseDragInteractionReturn {
	const [dragState, setDragState] = useState<DragState | null>(null);

	/**
	 * オブジェクトクリック（グループ対応）
	 */
	const handleObjectClick = useCallback(
		(index: number, e: React.MouseEvent) => {
			e.stopPropagation();
			const additive = e.shiftKey;

			const group = getGroupForObject(index);
			if (group && !additive) {
				selectGroup(group.id);
			} else {
				selectObject(index, additive);
			}
		},
		[selectObject, getGroupForObject, selectGroup],
	);

	/**
	 * オブジェクトドラッグ開始（グループ対応）
	 *
	 * 選択中のオブジェクトがクリック位置にある場合は、
	 * 選択を変更せずに既存の選択をドラッグする（Figma等と同様の動作）
	 */
	const handleObjectPointerDown = useCallback(
		(index: number, e: React.PointerEvent) => {
			if (e.button !== 0) return;

			const svg = svgRef.current;
			if (!svg) return;

			e.stopPropagation();
			e.preventDefault();

			const additive = e.shiftKey;
			const startPointer = screenToSVG(e, svg);

			const group = getGroupForObject(index);
			let indicesToMove = selectedIndices;

			// クリックされたオブジェクトが選択されていない場合
			if (!selectedIndices.includes(index)) {
				// 選択中のオブジェクトがクリック位置にあるかチェック
				// あれば選択を維持してそのままドラッグ（前面オブジェクトをクリックスルー）
				const selectedObjectAtPoint = selectedIndices.find((idx) => {
					const obj = objects[idx];
					return obj && isPointInObject(startPointer, obj);
				});

				if (selectedObjectAtPoint !== undefined) {
					// 選択中のオブジェクトがクリック位置にある場合は、
					// 選択を変更せずに既存の選択をドラッグ
					indicesToMove = selectedIndices;
				} else {
					// 選択中のオブジェクトがクリック位置にない場合は、
					// クリックされたオブジェクトを選択
					if (group && !additive) {
						selectGroup(group.id);
						indicesToMove = group.objectIndices;
					} else {
						selectObject(index, additive);
						indicesToMove = additive ? [...selectedIndices, index] : [index];
					}
				}
			}

			// ロックされたオブジェクトはドラッグ不可（選択のみ）
			// 複数選択時は、移動対象にロックされていないオブジェクトが含まれていれば移動可能
			const allLocked = indicesToMove.every(
				(idx) => objects[idx]?.flags.locked,
			);
			if (allLocked) {
				return;
			}

			const startObjectState = { ...objects[indicesToMove[0]] };

			const startPositions = new Map<number, Position>();
			for (const idx of indicesToMove) {
				if (idx >= 0 && idx < objects.length && !objects[idx].flags.locked) {
					startPositions.set(idx, { ...objects[idx].position });
				}
			}

			setDragState({
				mode: "drag",
				startPointer,
				startObjectState,
				startPositions,
				objectIndex: indicesToMove[0],
			});

			(e.target as Element).setPointerCapture(e.pointerId);
		},
		[
			svgRef,
			objects,
			selectedIndices,
			selectObject,
			getGroupForObject,
			selectGroup,
		],
	);

	/**
	 * 回転開始
	 */
	const handleRotateStart = useCallback(
		(e: React.PointerEvent) => {
			if (selectedIndices.length !== 1) return;

			const svg = svgRef.current;
			if (!svg) return;

			const index = selectedIndices[0];

			// ロックされたオブジェクトは回転不可
			const obj = objects[index];
			if (obj.flags.locked) {
				return;
			}

			const startPointer = screenToSVG(e, svg);
			const startObjectState = { ...objects[index] };

			setDragState({
				mode: "rotate",
				startPointer,
				startObjectState,
				startPositions: new Map(),
				handle: "rotate",
				objectIndex: index,
			});

			(e.target as Element).setPointerCapture(e.pointerId);
		},
		[svgRef, objects, selectedIndices],
	);

	/**
	 * リサイズ開始
	 */
	const handleResizeStart = useCallback(
		(handle: ResizeHandle, e: React.PointerEvent) => {
			if (selectedIndices.length !== 1) return;

			const svg = svgRef.current;
			if (!svg) return;

			const index = selectedIndices[0];

			// ロックされたオブジェクトはリサイズ不可
			const obj = objects[index];
			if (obj.flags.locked) {
				return;
			}

			const startPointer = screenToSVG(e, svg);
			const startObjectState = { ...objects[index] };

			setDragState({
				mode: "resize",
				startPointer,
				startObjectState,
				startPositions: new Map(),
				handle,
				objectIndex: index,
			});

			(e.target as Element).setPointerCapture(e.pointerId);
		},
		[svgRef, objects, selectedIndices],
	);

	/**
	 * ドラッグ/回転/リサイズ中の移動処理
	 */
	const handleDragMove = useCallback(
		(currentPointer: Position) => {
			if (!dragState) return;

			const { mode, startPointer, startObjectState, startPositions, objectIndex } =
				dragState;

			if (mode === "drag") {
				const deltaX = currentPointer.x - startPointer.x;
				const deltaY = currentPointer.y - startPointer.y;

				if (gridSettings.enabled && startPositions.size > 0) {
					for (const [idx, startPos] of startPositions) {
						const newPos = {
							x: startPos.x + deltaX,
							y: startPos.y + deltaY,
						};
						const snappedPos = snapToGrid(newPos, gridSettings.size);
						updateObject(idx, { position: snappedPos });
					}
				} else {
					moveObjects(selectedIndices, deltaX, deltaY);
					setDragState({
						...dragState,
						startPointer: currentPointer,
					});
				}
			} else if (mode === "rotate") {
				const center = startObjectState.position;
				const newRotation = calculateRotation(center, currentPointer);
				updateObject(objectIndex, { rotation: newRotation });
			} else if (mode === "resize") {
				const distance = Math.sqrt(
					(currentPointer.x - startObjectState.position.x) ** 2 +
						(currentPointer.y - startObjectState.position.y) ** 2,
				);
				const startDistance = Math.sqrt(
					(startPointer.x - startObjectState.position.x) ** 2 +
						(startPointer.y - startObjectState.position.y) ** 2,
				);

				if (startDistance > 0) {
					const scaleFactor = distance / startDistance;
					const newSize = Math.round(
						Math.max(50, Math.min(200, startObjectState.size * scaleFactor)),
					);
					updateObject(objectIndex, { size: newSize });
				}
			}
		},
		[dragState, updateObject, gridSettings, selectedIndices, moveObjects],
	);

	/**
	 * ドラッグ完了（履歴コミット）
	 */
	const completeDrag = useCallback(() => {
		if (!dragState) return;

		const descriptions: Record<string, string> = {
			drag: "オブジェクト移動",
			rotate: "オブジェクト回転",
			resize: "オブジェクトリサイズ",
		};
		if (dragState.mode !== "none" && dragState.mode !== "marquee") {
			commitHistory(descriptions[dragState.mode]);
		}

		setDragState(null);
	}, [dragState, commitHistory]);

	return {
		dragState,
		handleObjectClick,
		handleObjectPointerDown,
		handleRotateStart,
		handleResizeStart,
		handleDragMove,
		completeDrag,
	};
}
