/**
 * Marquee (rectangular) selection hook
 *
 * Provides functionality to select multiple objects by dragging on background
 */

import { type RefObject, useCallback, useRef, useState } from "react";
import type { BoardObject, Position } from "@/lib/stgy";
import { screenToSVG } from "../coordinates";
import type { MarqueeState } from "../types";

export interface UseMarqueeSelectionParams {
	svgRef: RefObject<SVGSVGElement | null>;
	objects: BoardObject[];
	/** Focused group ID (null = no focus) */
	focusedGroupId: string | null;
	getGroupForObject: (
		objectId: string,
	) => { id: string; objectIds: string[] } | undefined;
	selectObjects: (objectIds: string[]) => void;
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
	 * @returns true if marquee selection is active
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

	const getObjectsInMarquee = useCallback(
		(marquee: MarqueeState): string[] => {
			const { startPoint, currentPoint } = marquee;
			const minX = Math.min(startPoint.x, currentPoint.x);
			const maxX = Math.max(startPoint.x, currentPoint.x);
			const minY = Math.min(startPoint.y, currentPoint.y);
			const maxY = Math.max(startPoint.y, currentPoint.y);

			const ids: string[] = [];
			for (const obj of objects) {
				if (!obj.flags.visible) continue;

				// Skip objects outside focused group
				if (focusedGroupId !== null) {
					const group = getGroupForObject(obj.id);
					if (group?.id !== focusedGroupId) continue;
				}

				const { x, y } = obj.position;
				if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
					ids.push(obj.id);
				}
			}
			return ids;
		},
		[objects, focusedGroupId, getGroupForObject],
	);

	const completeMarquee = useCallback(() => {
		if (!marqueeStateRef.current) return;

		const { startPoint, currentPoint } = marqueeStateRef.current;
		const width = Math.abs(currentPoint.x - startPoint.x);
		const height = Math.abs(currentPoint.y - startPoint.y);

		// Click without drag (< 5px) clears selection
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
