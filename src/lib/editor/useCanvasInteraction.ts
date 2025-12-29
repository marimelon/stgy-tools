/**
 * キャンバスインタラクション管理のカスタムフック
 *
 * ドラッグ、回転、リサイズ、マーキー選択などのインタラクションを統合管理
 */

import { type RefObject, useCallback } from "react";
import type { BoardObject, Position } from "@/lib/stgy";
import { screenToSVG } from "./coordinates";
import { useDragInteraction } from "./hooks/useDragInteraction";
import { useMarqueeSelection } from "./hooks/useMarqueeSelection";
import type {
	DragState,
	GridSettings,
	MarqueeState,
	ResizeHandle,
} from "./types";

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
	/** フォーカス中のグループID（null = フォーカスなし） */
	focusedGroupId: string | null;
	/** オブジェクト選択 */
	selectObject: (index: number, additive?: boolean) => void;
	/** 複数オブジェクト選択 */
	selectObjects: (indices: number[]) => void;
	/** グループ選択 */
	selectGroup: (groupId: string) => void;
	/** オブジェクトが属するグループを取得 */
	getGroupForObject: (
		index: number,
	) => { id: string; objectIndices: number[] } | undefined;
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
	/** マーキー選択状態 */
	marqueeState: MarqueeState | null;
	/** 背景クリックハンドラ */
	handleBackgroundClick: () => void;
	/** 背景ポインターダウンハンドラ（マーキー選択開始） */
	handleBackgroundPointerDown: (e: React.PointerEvent) => void;
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
 *
 * マーキー選択とドラッグ/回転/リサイズを統合し、
 * 統一されたハンドラを提供
 */
export function useCanvasInteraction({
	svgRef,
	objects,
	selectedIndices,
	gridSettings,
	focusedGroupId,
	selectObject,
	selectObjects,
	selectGroup,
	getGroupForObject,
	updateObject,
	moveObjects,
	commitHistory,
	addObject,
	deselectAll,
}: UseCanvasInteractionParams): UseCanvasInteractionReturn {
	// マーキー選択フック
	const {
		marqueeState,
		marqueeStateRef,
		handleBackgroundPointerDown,
		updateMarqueePosition,
		completeMarquee,
		skipNextClickRef,
	} = useMarqueeSelection({
		svgRef,
		objects,
		focusedGroupId,
		getGroupForObject,
		selectObjects,
		deselectAll,
	});

	// ドラッグ/回転/リサイズフック
	const {
		dragState,
		handleObjectClick,
		handleObjectPointerDown,
		handleRotateStart,
		handleResizeStart,
		handleDragMove,
		completeDrag,
	} = useDragInteraction({
		svgRef,
		objects,
		selectedIndices,
		gridSettings,
		focusedGroupId,
		selectObject,
		selectGroup,
		getGroupForObject,
		updateObject,
		moveObjects,
		commitHistory,
	});

	/**
	 * 背景クリックで選択解除
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: skipNextClickRef はRefなので依存配列に含めない
	const handleBackgroundClick = useCallback(() => {
		if (skipNextClickRef.current) {
			skipNextClickRef.current = false;
			return;
		}
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
		[svgRef, addObject],
	);

	/**
	 * ポインター移動（マーキー/ドラッグ/回転/リサイズ統合）
	 */
	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			const svg = svgRef.current;
			if (!svg) return;

			const currentPointer = screenToSVG(e, svg);

			// マーキー選択中
			if (updateMarqueePosition(currentPointer)) {
				return;
			}

			// ドラッグ/回転/リサイズ中
			handleDragMove(currentPointer);
		},
		[svgRef, updateMarqueePosition, handleDragMove],
	);

	/**
	 * ポインターアップ（マーキー/ドラッグ統合）
	 */
	const handlePointerUp = useCallback(
		(e: React.PointerEvent) => {
			(e.target as Element).releasePointerCapture(e.pointerId);

			// マーキー選択の完了
			if (marqueeStateRef.current) {
				completeMarquee();
				return;
			}

			// ドラッグ/回転/リサイズの完了
			completeDrag();
		},
		[marqueeStateRef, completeMarquee, completeDrag],
	);

	return {
		dragState,
		marqueeState,
		handleBackgroundClick,
		handleBackgroundPointerDown,
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
