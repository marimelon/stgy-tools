/**
 * ドラッグ/回転/リサイズインタラクションフック
 *
 * オブジェクトのドラッグ移動、回転、リサイズ操作を管理
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

/**
 * オブジェクトタイプに応じたサイズ制限を取得
 */
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
	/** フォーカス中のグループID（null = フォーカスなし） */
	focusedGroupId: string | null;
	/** 円形配置モード状態（null = モードなし） */
	circularMode: CircularModeState | null;
	selectObject: (objectId: string, additive?: boolean) => void;
	selectGroup: (groupId: string) => void;
	getGroupForObject: (
		objectId: string,
	) => { id: string; objectIds: string[] } | undefined;
	updateObject: (objectId: string, updates: Partial<BoardObject>) => void;
	moveObjects: (objectIds: string[], deltaX: number, deltaY: number) => void;
	/** グリッドスナップ付きバッチ移動（パフォーマンス最適化） */
	moveObjectsWithSnap: (
		startPositions: Map<string, Position>,
		deltaX: number,
		deltaY: number,
		gridSize: number,
	) => void;
	/** 円周上でオブジェクトを移動 */
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

/**
 * ドラッグ/回転/リサイズインタラクションフック
 */
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
	 * フォーカスモード中に、指定オブジェクトがフォーカス外かどうかを判定
	 */
	const isOutsideFocus = useCallback(
		(objectId: string): boolean => {
			if (focusedGroupId === null) return false;
			const focusedGroup = getGroupForObject(objectId);
			// フォーカス中のグループに属していない場合はフォーカス外
			return focusedGroup?.id !== focusedGroupId;
		},
		[focusedGroupId, getGroupForObject],
	);

	/**
	 * オブジェクトクリック（グループ対応）
	 */
	const handleObjectClick = useCallback(
		(objectId: string, e: React.MouseEvent) => {
			e.stopPropagation();

			// フォーカスモード中、フォーカス外のオブジェクトはクリック無視
			if (isOutsideFocus(objectId)) return;

			// Shift, Command (Mac), Ctrl (Windows) で追加選択
			const additive = e.shiftKey || e.metaKey || e.ctrlKey;

			const group = getGroupForObject(objectId);
			// フォーカスモード中は個別オブジェクト選択（グループ選択しない）
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
	 * オブジェクトドラッグ開始（グループ対応）
	 *
	 * 選択中のオブジェクトがクリック位置にある場合は、
	 * 選択を変更せずに既存の選択をドラッグする（Figma等と同様の動作）
	 */
	const handleObjectPointerDown = useCallback(
		(objectId: string, e: React.PointerEvent) => {
			if (e.button !== 0) return;

			// フォーカスモード中、フォーカス外のオブジェクトはドラッグ無視
			if (isOutsideFocus(objectId)) return;

			const svg = svgRef.current;
			if (!svg) return;

			e.stopPropagation();
			e.preventDefault();

			// Shift, Command (Mac), Ctrl (Windows) で追加選択
			const additive = e.shiftKey || e.metaKey || e.ctrlKey;
			const startPointer = screenToSVG(e, svg);

			const group = getGroupForObject(objectId);
			let idsToMove = selectedIds;

			// クリックされたオブジェクトが選択されていない場合
			if (!selectedIds.includes(objectId)) {
				// 選択中のオブジェクトがクリック位置にあるかチェック
				// あれば選択を維持してそのままドラッグ（前面オブジェクトをクリックスルー）
				const selectedObjectAtPoint = selectedIds.find((id) => {
					const obj = objects.find((o) => o.id === id);
					return obj && isPointInObject(startPointer, obj);
				});

				if (selectedObjectAtPoint !== undefined) {
					// 選択中のオブジェクトがクリック位置にある場合は、
					// 選択を変更せずに既存の選択をドラッグ
					idsToMove = selectedIds;
				} else {
					// 選択中のオブジェクトがクリック位置にない場合は、
					// クリックされたオブジェクトを選択
					// フォーカスモード中は個別オブジェクト選択（グループ選択しない）
					if (group && !additive && focusedGroupId === null) {
						selectGroup(group.id);
						idsToMove = group.objectIds;
					} else {
						selectObject(objectId, additive);
						idsToMove = additive ? [...selectedIds, objectId] : [objectId];
					}
				}
			}

			// ロックされたオブジェクトはドラッグ不可（選択のみ）
			// 複数選択時は、移動対象にロックされていないオブジェクトが含まれていれば移動可能
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

	/**
	 * 回転開始
	 */
	const handleRotateStart = useCallback(
		(e: React.PointerEvent) => {
			if (selectedIds.length !== 1) return;

			const svg = svgRef.current;
			if (!svg) return;

			const selectedId = selectedIds[0];
			const obj = objects.find((o) => o.id === selectedId);
			if (!obj) return;

			// ロックされたオブジェクトは回転不可
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

	/**
	 * リサイズ開始
	 */
	const handleResizeStart = useCallback(
		(handle: ResizeHandle, e: React.PointerEvent) => {
			if (selectedIds.length !== 1) return;

			const svg = svgRef.current;
			if (!svg) return;

			const selectedId = selectedIds[0];
			const obj = objects.find((o) => o.id === selectedId);
			if (!obj) return;

			// ロックされたオブジェクトはリサイズ不可
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

	/**
	 * ドラッグ/回転/リサイズ中の移動処理
	 */
	const handleDragMove = useCallback(
		(currentPointer: Position) => {
			if (!dragState) return;

			const { mode, startPointer, startObjectState, startPositions, objectId } =
				dragState;

			if (mode === "drag") {
				// 円形モード中で、ドラッグ対象が円形配置に参加している場合
				// 円周上のみに移動を制約
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
					// バッチ更新で1回のstate更新に最適化
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

	/**
	 * ドラッグ完了（履歴コミット）
	 */
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
