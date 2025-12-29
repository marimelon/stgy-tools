/**
 * マーキー（範囲）選択フック
 *
 * 背景をドラッグして複数オブジェクトを範囲選択する機能を提供
 */

import { type RefObject, useCallback, useRef, useState } from "react";
import type { BoardObject, Position } from "@/lib/stgy";
import { screenToSVG } from "../coordinates";
import type { MarqueeState } from "../types";

export interface UseMarqueeSelectionParams {
	svgRef: RefObject<SVGSVGElement | null>;
	objects: BoardObject[];
	/** フォーカス中のグループID（null = フォーカスなし） */
	focusedGroupId: string | null;
	/** オブジェクトが属するグループを取得 */
	getGroupForObject: (
		index: number,
	) => { id: string; objectIndices: number[] } | undefined;
	selectObjects: (indices: number[]) => void;
	deselectAll: () => void;
}

export interface UseMarqueeSelectionReturn {
	marqueeState: MarqueeState | null;
	marqueeStateRef: React.MutableRefObject<MarqueeState | null>;
	handleBackgroundPointerDown: (e: React.PointerEvent) => void;
	updateMarqueePosition: (currentPointer: Position) => boolean;
	completeMarquee: () => void;
	skipNextClickRef: React.MutableRefObject<boolean>;
}

/**
 * マーキー選択フック
 */
export function useMarqueeSelection({
	svgRef,
	objects,
	focusedGroupId,
	getGroupForObject,
	selectObjects,
	deselectAll,
}: UseMarqueeSelectionParams): UseMarqueeSelectionReturn {
	const [marqueeState, setMarqueeState] = useState<MarqueeState | null>(null);
	const marqueeStateRef = useRef<MarqueeState | null>(null);
	const skipNextClickRef = useRef(false);

	/**
	 * 背景ポインターダウンでマーキー選択開始
	 */
	const handleBackgroundPointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (e.button !== 0) return;

			const svg = svgRef.current;
			if (!svg) return;

			e.preventDefault();

			const point = screenToSVG(e, svg);
			const newState = {
				startPoint: point,
				currentPoint: point,
			};
			marqueeStateRef.current = newState;
			setMarqueeState(newState);

			(e.target as Element).setPointerCapture(e.pointerId);
		},
		[svgRef],
	);

	/**
	 * マーキー位置を更新
	 * @returns マーキー選択中の場合true
	 */
	const updateMarqueePosition = useCallback(
		(currentPointer: Position): boolean => {
			if (!marqueeStateRef.current) return false;

			const newState = {
				...marqueeStateRef.current,
				currentPoint: currentPointer,
			};
			marqueeStateRef.current = newState;
			setMarqueeState(newState);
			return true;
		},
		[],
	);

	/**
	 * マーキー範囲内のオブジェクトを取得
	 */
	const getObjectsInMarquee = useCallback(
		(marquee: MarqueeState): number[] => {
			const { startPoint, currentPoint } = marquee;
			const minX = Math.min(startPoint.x, currentPoint.x);
			const maxX = Math.max(startPoint.x, currentPoint.x);
			const minY = Math.min(startPoint.y, currentPoint.y);
			const maxY = Math.max(startPoint.y, currentPoint.y);

			const indices: number[] = [];
			for (let i = 0; i < objects.length; i++) {
				const obj = objects[i];
				if (!obj.flags.visible) continue;

				// フォーカスモード中はフォーカス外のオブジェクトを除外
				if (focusedGroupId !== null) {
					const group = getGroupForObject(i);
					if (group?.id !== focusedGroupId) continue;
				}

				const { x, y } = obj.position;
				if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
					indices.push(i);
				}
			}
			return indices;
		},
		[objects, focusedGroupId, getGroupForObject],
	);

	/**
	 * マーキー選択を完了
	 */
	const completeMarquee = useCallback(() => {
		if (!marqueeStateRef.current) return;

		const { startPoint, currentPoint } = marqueeStateRef.current;
		const width = Math.abs(currentPoint.x - startPoint.x);
		const height = Math.abs(currentPoint.y - startPoint.y);

		// ドラッグせずクリックした場合（5px未満）は選択解除
		const isClick = width < 5 && height < 5;

		if (isClick) {
			deselectAll();
		} else {
			skipNextClickRef.current = true;
			const selectedByMarquee = getObjectsInMarquee(marqueeStateRef.current);
			if (selectedByMarquee.length > 0) {
				selectObjects(selectedByMarquee);
			}
		}

		marqueeStateRef.current = null;
		setMarqueeState(null);
	}, [getObjectsInMarquee, selectObjects, deselectAll]);

	return {
		marqueeState,
		marqueeStateRef,
		handleBackgroundPointerDown,
		updateMarqueePosition,
		completeMarquee,
		skipNextClickRef,
	};
}
