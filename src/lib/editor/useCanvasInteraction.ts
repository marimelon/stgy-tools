/**
 * キャンバスインタラクション管理のカスタムフック
 *
 * ドラッグ、回転、リサイズなどのインタラクションを管理
 */

import { useState, useCallback, type RefObject } from "react";
import type { BoardObject, Position } from "@/lib/stgy";
import type { DragState, InteractionMode, ResizeHandle, GridSettings } from "./types";
import { screenToSVG, calculateRotation, snapToGrid } from "./coordinates";

/**
 * フックに渡すパラメータ
 */
export interface UseCanvasInteractionParams {
  /** SVG要素のRef */
  svgRef: RefObject<SVGSVGElement | null>;
  /** オブジェクト配列 */
  objects: BoardObject[];
  /** 選択中のインデックス */
  selectedIndices: number[];
  /** グリッド設定 */
  gridSettings: GridSettings;
  /** オブジェクト選択 */
  selectObject: (index: number, additive?: boolean) => void;
  /** グループ選択 */
  selectGroup: (groupId: string) => void;
  /** オブジェクトが属するグループを取得 */
  getGroupForObject: (index: number) => { id: string; objectIndices: number[] } | undefined;
  /** オブジェクト更新 */
  updateObject: (index: number, updates: Partial<BoardObject>) => void;
  /** オブジェクト移動 */
  moveObjects: (indices: number[], deltaX: number, deltaY: number) => void;
  /** 履歴をコミット */
  commitHistory: (description: string) => void;
  /** オブジェクト追加 */
  addObject: (objectId: number, position?: Position) => void;
  /** 選択解除 */
  deselectAll: () => void;
}

/**
 * フックの戻り値
 */
export interface UseCanvasInteractionReturn {
  /** 現在のドラッグ状態 */
  dragState: DragState | null;
  /** 背景クリックハンドラ */
  handleBackgroundClick: () => void;
  /** ドラッグオーバーハンドラ */
  handleDragOver: (e: React.DragEvent) => void;
  /** ドロップハンドラ */
  handleDrop: (e: React.DragEvent) => void;
  /** オブジェクトクリックハンドラ */
  handleObjectClick: (index: number, e: React.MouseEvent) => void;
  /** オブジェクトポインターダウンハンドラ */
  handleObjectPointerDown: (index: number, e: React.PointerEvent) => void;
  /** 回転開始ハンドラ */
  handleRotateStart: (e: React.PointerEvent) => void;
  /** リサイズ開始ハンドラ */
  handleResizeStart: (handle: ResizeHandle, e: React.PointerEvent) => void;
  /** ポインター移動ハンドラ */
  handlePointerMove: (e: React.PointerEvent) => void;
  /** ポインターアップハンドラ */
  handlePointerUp: (e: React.PointerEvent) => void;
}

/**
 * キャンバスインタラクション管理フック
 */
export function useCanvasInteraction({
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
  addObject,
  deselectAll,
}: UseCanvasInteractionParams): UseCanvasInteractionReturn {
  const [dragState, setDragState] = useState<DragState | null>(null);

  /**
   * 背景クリックで選択解除
   */
  const handleBackgroundClick = useCallback(() => {
    deselectAll();
  }, [deselectAll]);

  /**
   * ドラッグオーバー（ドロップを許可）
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-object-id")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  /**
   * ドロップでオブジェクト追加
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const objectIdStr = e.dataTransfer.getData("application/x-object-id");
      if (!objectIdStr) return;

      const objectId = Number.parseInt(objectIdStr, 10);
      if (Number.isNaN(objectId)) return;

      const svg = svgRef.current;
      if (!svg) return;

      const position = screenToSVG(e, svg);
      addObject(objectId, position);
    },
    [svgRef, addObject]
  );

  /**
   * オブジェクトクリック（グループ対応）
   */
  const handleObjectClick = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const additive = e.ctrlKey || e.metaKey;

      const group = getGroupForObject(index);
      if (group && !additive) {
        selectGroup(group.id);
      } else {
        selectObject(index, additive);
      }
    },
    [selectObject, getGroupForObject, selectGroup]
  );

  /**
   * オブジェクトドラッグ開始（グループ対応）
   */
  const handleObjectPointerDown = useCallback(
    (index: number, e: React.PointerEvent) => {
      if (e.button !== 0) return;

      const svg = svgRef.current;
      if (!svg) return;

      e.stopPropagation();
      e.preventDefault();

      const additive = e.ctrlKey || e.metaKey;

      const group = getGroupForObject(index);
      let indicesToMove = selectedIndices;

      if (!selectedIndices.includes(index)) {
        if (group && !additive) {
          selectGroup(group.id);
          indicesToMove = group.objectIndices;
        } else {
          selectObject(index, additive);
          indicesToMove = additive ? [...selectedIndices, index] : [index];
        }
      }

      const startPointer = screenToSVG(e, svg);
      const startObjectState = { ...objects[index] };

      const startPositions = new Map<number, Position>();
      for (const idx of indicesToMove) {
        if (idx >= 0 && idx < objects.length) {
          startPositions.set(idx, { ...objects[idx].position });
        }
      }

      setDragState({
        mode: "drag",
        startPointer,
        startObjectState,
        startPositions,
        objectIndex: index,
      });

      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [svgRef, objects, selectedIndices, selectObject, getGroupForObject, selectGroup]
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
    [svgRef, objects, selectedIndices]
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
    [svgRef, objects, selectedIndices]
  );

  /**
   * ポインター移動（グループ対応）
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;

      const svg = svgRef.current;
      if (!svg) return;

      const currentPointer = screenToSVG(e, svg);
      const { mode, startPointer, startObjectState, startPositions, objectIndex } = dragState;

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
            (currentPointer.y - startObjectState.position.y) ** 2
        );
        const startDistance = Math.sqrt(
          (startPointer.x - startObjectState.position.x) ** 2 +
            (startPointer.y - startObjectState.position.y) ** 2
        );

        if (startDistance > 0) {
          const scaleFactor = distance / startDistance;
          const newSize = Math.round(
            Math.max(50, Math.min(200, startObjectState.size * scaleFactor))
          );
          updateObject(objectIndex, { size: newSize });
        }
      }
    },
    [svgRef, dragState, updateObject, gridSettings, selectedIndices, moveObjects]
  );

  /**
   * ポインターアップ
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;

      (e.target as Element).releasePointerCapture(e.pointerId);

      const descriptions: Record<InteractionMode, string> = {
        none: "",
        drag: "オブジェクト移動",
        rotate: "オブジェクト回転",
        resize: "オブジェクトリサイズ",
      };
      if (dragState.mode !== "none") {
        commitHistory(descriptions[dragState.mode]);
      }

      setDragState(null);
    },
    [dragState, commitHistory]
  );

  return {
    dragState,
    handleBackgroundClick,
    handleDragOver,
    handleDrop,
    handleObjectClick,
    handleObjectPointerDown,
    handleRotateStart,
    handleResizeStart,
    handlePointerMove,
    handlePointerUp,
  };
}
