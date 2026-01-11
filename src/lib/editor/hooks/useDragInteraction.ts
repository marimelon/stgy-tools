/**
 * Drag/rotate/resize interaction hook
 *
 * Manages object drag movement, rotation, and resize operations
 */

import { type RefObject, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BoardObject, Position } from "@/lib/stgy";
import {
	DEFAULT_EDIT_PARAMS,
	EDIT_PARAMS,
	EditParamIds,
	OBJECT_EDIT_PARAMS,
} from "@/lib/stgy";
import { calculateRotation, screenToSVG } from "../coordinates";
import type {
	CircularModeState,
	DragState,
	GridSettings,
	ResizeHandle,
} from "../types";
import { isPointInObject } from "./hit-testing";

function getSizeLimits(objectId: number): { min: number; max: number } {
	const editParams = OBJECT_EDIT_PARAMS[objectId] ?? DEFAULT_EDIT_PARAMS;
	const sizeParamId = editParams.includes(EditParamIds.SizeSmall)
		? EditParamIds.SizeSmall
		: EditParamIds.Size;
	const sizeParam = EDIT_PARAMS[sizeParamId];
	return { min: sizeParam.min, max: sizeParam.max };
}

export interface UseDragInteractionParams {
	svgRef: RefObject<SVGSVGElement | null>;
	objects: BoardObject[];
	selectedIds: string[];
	gridSettings: GridSettings;
	/** Focused group ID (null = no focus) */
	focusedGroupId: string | null;
	/** Circular arrangement mode state (null = mode disabled) */
	circularMode: CircularModeState | null;
	selectObject: (objectId: string, additive?: boolean) => void;
	selectGroup: (groupId: string) => void;
	getGroupForObject: (
		objectId: string,
	) => { id: string; objectIds: string[] } | undefined;
	updateObject: (objectId: string, updates: Partial<BoardObject>) => void;
	moveObjects: (objectIds: string[], deltaX: number, deltaY: number) => void;
	/** Batch move with grid snap (performance optimized) */
	moveObjectsWithSnap: (
		startPositions: Map<string, Position>,
		deltaX: number,
		deltaY: number,
		gridSize: number,
	) => void;
	moveObjectOnCircle: (objectId: string, angle: number) => void;
	commitHistory: (description: string) => void;
}

export interface UseDragInteractionReturn {
	dragState: DragState | null;
	handleObjectClick: (objectId: string, e: React.MouseEvent) => void;
	handleObjectPointerDown: (objectId: string, e: React.PointerEvent) => void;
	handleRotateStart: (e: React.PointerEvent) => void;
	handleResizeStart: (handle: ResizeHandle, e: React.PointerEvent) => void;
	handleDragMove: (currentPointer: Position) => void;
	completeDrag: () => void;
}

export function useDragInteraction({
	svgRef,
	objects,
	selectedIds,
	gridSettings,
	focusedGroupId,
	circularMode,
	selectObject,
	selectGroup,
	getGroupForObject,
	updateObject,
	moveObjects,
	moveObjectsWithSnap,
	moveObjectOnCircle,
	commitHistory,
}: UseDragInteractionParams): UseDragInteractionReturn {
	const { t } = useTranslation();
	const [dragState, setDragState] = useState<DragState | null>(null);

	/**
	 * Check if object is outside the focused group
	 */
	const isOutsideFocus = useCallback(
		(objectId: string): boolean => {
			if (focusedGroupId === null) return false;
			const focusedGroup = getGroupForObject(objectId);
			return focusedGroup?.id !== focusedGroupId;
		},
		[focusedGroupId, getGroupForObject],
	);

	const handleObjectClick = useCallback(
		(objectId: string, e: React.MouseEvent) => {
			e.stopPropagation();

			if (isOutsideFocus(objectId)) return;

			// Shift, Command (Mac), Ctrl (Windows) for additive selection
			const additive = e.shiftKey || e.metaKey || e.ctrlKey;

			const group = getGroupForObject(objectId);
			// In focus mode, select individual object (not group)
			if (group && !additive && focusedGroupId === null) {
				selectGroup(group.id);
			} else {
				selectObject(objectId, additive);
			}
		},
		[
			selectObject,
			getGroupForObject,
			selectGroup,
			isOutsideFocus,
			focusedGroupId,
		],
	);

	/**
	 * Start object drag (with group support)
	 *
	 * If a selected object is at click position, drag existing selection
	 * without changing it (same behavior as Figma etc.)
	 */
	const handleObjectPointerDown = useCallback(
		(objectId: string, e: React.PointerEvent) => {
			if (e.button !== 0) return;

			if (isOutsideFocus(objectId)) return;

			const svg = svgRef.current;
			if (!svg) return;

			e.stopPropagation();
			e.preventDefault();

			const additive = e.shiftKey || e.metaKey || e.ctrlKey;
			const startPointer = screenToSVG(e, svg);

			const group = getGroupForObject(objectId);
			let idsToMove = selectedIds;

			if (!selectedIds.includes(objectId)) {
				// Check if any selected object is at click position
				// If so, maintain selection and drag (click-through to front object)
				const selectedObjectAtPoint = selectedIds.find((id) => {
					const obj = objects.find((o) => o.id === id);
					return obj && isPointInObject(startPointer, obj);
				});

				if (selectedObjectAtPoint !== undefined) {
					idsToMove = selectedIds;
				} else {
					// In focus mode, select individual object (not group)
					if (group && !additive && focusedGroupId === null) {
						selectGroup(group.id);
						idsToMove = group.objectIds;
					} else {
						selectObject(objectId, additive);
						idsToMove = additive ? [...selectedIds, objectId] : [objectId];
					}
				}
			}

			// Locked objects cannot be dragged (selection only)
			// For multi-select, allow if any unlocked object exists
			const allLocked = idsToMove.every((id) => {
				const obj = objects.find((o) => o.id === id);
				return obj?.flags.locked;
			});
			if (allLocked) {
				return;
			}

			const firstObject = objects.find((o) => o.id === idsToMove[0]);
			if (!firstObject) return;
			const startObjectState = { ...firstObject };

			const startPositions = new Map<string, Position>();
			for (const id of idsToMove) {
				const obj = objects.find((o) => o.id === id);
				if (obj && !obj.flags.locked) {
					startPositions.set(id, { ...obj.position });
				}
			}

			setDragState({
				mode: "drag",
				startPointer,
				startObjectState,
				startPositions,
				objectId: idsToMove[0],
			});

			(e.target as Element).setPointerCapture(e.pointerId);
		},
		[
			svgRef,
			objects,
			selectedIds,
			selectObject,
			getGroupForObject,
			selectGroup,
			isOutsideFocus,
			focusedGroupId,
		],
	);

	const handleRotateStart = useCallback(
		(e: React.PointerEvent) => {
			if (selectedIds.length !== 1) return;

			const svg = svgRef.current;
			if (!svg) return;

			const selectedId = selectedIds[0];
			const obj = objects.find((o) => o.id === selectedId);
			if (!obj) return;

			if (obj.flags.locked) {
				return;
			}

			const startPointer = screenToSVG(e, svg);
			const startObjectState = { ...obj };

			setDragState({
				mode: "rotate",
				startPointer,
				startObjectState,
				startPositions: new Map(),
				handle: "rotate",
				objectId: selectedId,
			});

			(e.target as Element).setPointerCapture(e.pointerId);
		},
		[svgRef, objects, selectedIds],
	);

	const handleResizeStart = useCallback(
		(handle: ResizeHandle, e: React.PointerEvent) => {
			if (selectedIds.length !== 1) return;

			const svg = svgRef.current;
			if (!svg) return;

			const selectedId = selectedIds[0];
			const obj = objects.find((o) => o.id === selectedId);
			if (!obj) return;

			if (obj.flags.locked) {
				return;
			}

			const startPointer = screenToSVG(e, svg);
			const startObjectState = { ...obj };

			setDragState({
				mode: "resize",
				startPointer,
				startObjectState,
				startPositions: new Map(),
				handle,
				objectId: selectedId,
			});

			(e.target as Element).setPointerCapture(e.pointerId);
		},
		[svgRef, objects, selectedIds],
	);

	const handleDragMove = useCallback(
		(currentPointer: Position) => {
			if (!dragState) return;

			const { mode, startPointer, startObjectState, startPositions, objectId } =
				dragState;

			if (mode === "drag") {
				// In circular mode, constrain movement to circle circumference
				if (objectId && circularMode?.participatingIds.includes(objectId)) {
					const angle = Math.atan2(
						currentPointer.y - circularMode.center.y,
						currentPointer.x - circularMode.center.x,
					);
					moveObjectOnCircle(objectId, angle);
					return;
				}

				const deltaX = currentPointer.x - startPointer.x;
				const deltaY = currentPointer.y - startPointer.y;

				if (gridSettings.enabled && startPositions.size > 0) {
					moveObjectsWithSnap(
						startPositions,
						deltaX,
						deltaY,
						gridSettings.size,
					);
				} else {
					moveObjects(selectedIds, deltaX, deltaY);
					setDragState({
						...dragState,
						startPointer: currentPointer,
					});
				}
			} else if (mode === "rotate" && objectId) {
				const center = startObjectState.position;
				const newRotation = calculateRotation(center, currentPointer);
				updateObject(objectId, { rotation: newRotation });
			} else if (mode === "resize" && objectId) {
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
					const { min, max } = getSizeLimits(startObjectState.objectId);
					const newSize = Math.round(
						Math.max(min, Math.min(max, startObjectState.size * scaleFactor)),
					);
					updateObject(objectId, { size: newSize });
				}
			}
		},
		[
			dragState,
			updateObject,
			gridSettings,
			selectedIds,
			moveObjects,
			moveObjectsWithSnap,
			circularMode,
			moveObjectOnCircle,
		],
	);

	const completeDrag = useCallback(() => {
		if (!dragState) return;

		const descriptions: Record<string, string> = {
			drag: t("history.moveObject"),
			rotate: t("history.rotateObject"),
			resize: t("history.resizeObject"),
		};
		if (dragState.mode !== "none" && dragState.mode !== "marquee") {
			commitHistory(descriptions[dragState.mode]);
		}

		setDragState(null);
	}, [dragState, commitHistory, t]);

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
