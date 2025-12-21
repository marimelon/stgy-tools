/**
 * エディターボードコンポーネント
 *
 * BoardViewerを拡張し、ドラッグ/回転/リサイズのインタラクションを追加
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { BackgroundRenderer, ObjectRenderer } from "@/components/board";
import { useEditor } from "@/lib/editor";
import { screenToSVG, calculateRotation, clampToCanvas } from "@/lib/editor";
import {
  SelectionHandles,
  type ResizeHandle,
  type HandleType,
} from "./SelectionHandles";
import type { Position } from "@/lib/stgy";

/** キャンバスサイズ */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

/** インタラクションモード */
type InteractionMode = "none" | "drag" | "rotate" | "resize";

/** ドラッグ状態 */
interface DragState {
  mode: InteractionMode;
  startPointer: Position;
  startObjectState: BoardObject;
  handle?: HandleType;
  objectIndex: number;
}

interface EditorBoardProps {
  /** 表示スケール */
  scale?: number;
}

/**
 * エディターボードコンポーネント
 */
export function EditorBoard({ scale = 1 }: EditorBoardProps) {
  const {
    state,
    selectObject,
    deselectAll,
    updateObject,
    commitHistory,
    deleteSelected,
    addObject,
    getGroupForObject,
    selectGroup,
    moveObjects,
  } = useEditor();

  const { board, selectedIndices } = state;
  const { backgroundId, objects } = board;

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // 可視オブジェクトのみ取得
  const visibleObjects = objects
    .map((obj, index) => ({ obj, index }))
    .filter(({ obj }) => obj.flags.visible);

  // 選択オブジェクトの取得
  const selectedObject =
    selectedIndices.length === 1 ? objects[selectedIndices[0]] : null;

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

      // ドロップ位置をSVG座標に変換
      const position = screenToSVG(e, svg);
      addObject(objectId, position);
    },
    [addObject]
  );

  /**
   * オブジェクトクリック（グループ対応）
   */
  const handleObjectClick = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const additive = e.ctrlKey || e.metaKey;

      // グループに属している場合はグループ全体を選択
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
      if (e.button !== 0) return; // 左クリックのみ

      const svg = svgRef.current;
      if (!svg) return;

      e.stopPropagation();
      e.preventDefault();

      // グループに属している場合はグループ全体を選択
      const group = getGroupForObject(index);
      if (!selectedIndices.includes(index)) {
        if (group) {
          selectGroup(group.id);
        } else {
          selectObject(index);
        }
      }

      const startPointer = screenToSVG(e, svg);
      const startObjectState = { ...objects[index] };

      setDragState({
        mode: "drag",
        startPointer,
        startObjectState,
        objectIndex: index,
      });

      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [objects, selectedIndices, selectObject, getGroupForObject, selectGroup]
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
        handle: "rotate",
        objectIndex: index,
      });

      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [objects, selectedIndices]
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
        handle,
        objectIndex: index,
      });

      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [objects, selectedIndices]
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
      const { mode, startPointer, startObjectState, objectIndex } = dragState;

      if (mode === "drag") {
        // ドラッグ移動（選択中の全オブジェクトを移動）
        const deltaX = currentPointer.x - startPointer.x;
        const deltaY = currentPointer.y - startPointer.y;

        // 選択中のオブジェクトを全て移動
        moveObjects(selectedIndices, deltaX, deltaY);

        // startPointerを更新して累積移動を防ぐ
        setDragState({
          ...dragState,
          startPointer: currentPointer,
        });
      } else if (mode === "rotate") {
        // 回転
        const center = startObjectState.position;
        const newRotation = calculateRotation(center, currentPointer);
        updateObject(objectIndex, { rotation: newRotation });
      } else if (mode === "resize") {
        // リサイズ
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
    [dragState, updateObject]
  );

  /**
   * ポインターアップ
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;

      (e.target as Element).releasePointerCapture(e.pointerId);

      // 履歴に追加
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

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete or Backspace で削除
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIndices.length > 0
      ) {
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndices, deleteSelected]);

  return (
    <svg
      ref={svgRef}
      width={CANVAS_WIDTH * scale}
      height={CANVAS_HEIGHT * scale}
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      onClick={handleBackgroundClick}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="bg-slate-800"
      role="application"
      aria-label="Strategy Board Editor"
    >
      {/* 背景 */}
      <BackgroundRenderer
        backgroundId={backgroundId}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />

      {/* オブジェクト (逆順で描画してレイヤー順を正しくする) */}
      {[...visibleObjects].reverse().map(({ obj, index }) => (
        <g
          key={index}
          onClick={(e) => handleObjectClick(index, e)}
          onPointerDown={(e) => handleObjectPointerDown(index, e)}
          style={{ cursor: "move" }}
        >
          <ObjectRenderer
            object={obj}
            index={index}
            showBoundingBox={false}
            selected={false}
          />
        </g>
      ))}

      {/* 選択ハンドル (単一選択時のみ) */}
      {selectedObject && selectedIndices.length === 1 && (
        <SelectionHandles
          x={selectedObject.position.x}
          y={selectedObject.position.y}
          width={48 * (selectedObject.size / 100)}
          height={48 * (selectedObject.size / 100)}
          rotation={selectedObject.rotation}
          onRotateStart={handleRotateStart}
          onResizeStart={handleResizeStart}
        />
      )}
    </svg>
  );
}
