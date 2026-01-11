/**
 * Canvas interaction management hook
 *
 * Integrates drag, rotate, resize, and marquee selection interactions
 */

import { type RefObject, useCallback } from "react";
import type { BoardObject, Position } from "@/lib/stgy";
import { screenToSVG } from "./coordinates";
import { useDragInteraction } from "./hooks/useDragInteraction";
import { useMarqueeSelection } from "./hooks/useMarqueeSelection";
import type {
	CircularModeState,
	DragState,
	GridSettings,
	MarqueeState,
	ResizeHandle,
} from "./types";

export interface UseCanvasInteractionParams {
	/** SVG element ref */
	svgRef: RefObject<SVGSVGElement | null>;
	/** Object array */
	objects: BoardObject[];
	/** Selected IDs */
	selectedIds: string[];
	/** Grid settings */
	gridSettings: GridSettings;
	/** Focused group ID (null = no focus) */
	focusedGroupId: string | null;
	/** Circular arrangement mode state (null = mode not active) */
	circularMode: CircularModeState | null;
	selectObject: (objectId: string, additive?: boolean) => void;
	selectObjects: (objectIds: string[]) => void;
	selectGroup: (groupId: string) => void;
	/** Get the group an object belongs to */
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
	/** Move object along circle */
	moveObjectOnCircle: (objectId: string, angle: number) => void;
	commitHistory: (description: string) => void;
	addObject: (objectId: number, position?: Position) => void;
	deselectAll: () => void;
}

export interface UseCanvasInteractionReturn {
	/** Current drag state */
	dragState: DragState | null;
	/** Marquee selection state */
	marqueeState: MarqueeState | null;
	/** Background click handler */
	handleBackgroundClick: () => void;
	/** Background pointer down handler (starts marquee selection) */
	handleBackgroundPointerDown: (e: React.PointerEvent) => void;
	handleDragOver: (e: React.DragEvent) => void;
	handleDrop: (e: React.DragEvent) => void;
	handleObjectClick: (objectId: string, e: React.MouseEvent) => void;
	handleObjectPointerDown: (objectId: string, e: React.PointerEvent) => void;
	handleRotateStart: (e: React.PointerEvent) => void;
	handleResizeStart: (handle: ResizeHandle, e: React.PointerEvent) => void;
	handlePointerMove: (e: React.PointerEvent) => void;
	handlePointerUp: (e: React.PointerEvent) => void;
}

/**
 * Canvas interaction management hook
 *
 * Integrates marquee selection and drag/rotate/resize,
 * providing unified handlers
 */
export function useCanvasInteraction({
	svgRef,
	objects,
	selectedIds,
	gridSettings,
	focusedGroupId,
	circularMode,
	selectObject,
	selectObjects,
	selectGroup,
	getGroupForObject,
	updateObject,
	moveObjects,
	moveObjectsWithSnap,
	moveObjectOnCircle,
	commitHistory,
	addObject,
	deselectAll,
}: UseCanvasInteractionParams): UseCanvasInteractionReturn {
	// Marquee selection hook
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

	// Drag/rotate/resize hook
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
	});

	/** Background click deselects all */
	// biome-ignore lint/correctness/useExhaustiveDependencies: skipNextClickRef is a ref, exclude from deps
	const handleBackgroundClick = useCallback(() => {
		if (skipNextClickRef.current) {
			skipNextClickRef.current = false;
			return;
		}
		deselectAll();
	}, [deselectAll]);

	/** Drag over (allow drop) */
	const handleDragOver = useCallback((e: React.DragEvent) => {
		if (e.dataTransfer.types.includes("application/x-object-id")) {
			e.preventDefault();
			e.dataTransfer.dropEffect = "copy";
		}
	}, []);

	/** Drop to add object */
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

	/** Pointer move (integrated marquee/drag/rotate/resize) */
	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			const svg = svgRef.current;
			if (!svg) return;

			const currentPointer = screenToSVG(e, svg);

			// During marquee selection
			if (updateMarqueePosition(currentPointer)) {
				return;
			}

			// During drag/rotate/resize
			handleDragMove(currentPointer);
		},
		[svgRef, updateMarqueePosition, handleDragMove],
	);

	/** Pointer up (integrated marquee/drag) */
	const handlePointerUp = useCallback(
		(e: React.PointerEvent) => {
			(e.target as Element).releasePointerCapture(e.pointerId);

			// Complete marquee selection
			if (marqueeStateRef.current) {
				completeMarquee();
				return;
			}

			// Complete drag/rotate/resize
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
