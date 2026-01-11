/**
 * Line-specific selection handles for direct endpoint manipulation
 */

import { useState } from "react";

interface LineSelectionHandlesProps {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	onStartPointDragStart?: () => void;
	onStartPointDrag?: (x: number, y: number) => void;
	onStartPointDragEnd?: () => void;
	onEndPointDragStart?: () => void;
	onEndPointDrag?: (x: number, y: number) => void;
	onEndPointDragEnd?: () => void;
}

const HANDLE_SIZE = 8;
const HANDLE_STROKE_WIDTH = 2;

export function LineSelectionHandles({
	startX,
	startY,
	endX,
	endY,
	onStartPointDragStart,
	onStartPointDrag,
	onStartPointDragEnd,
	onEndPointDragStart,
	onEndPointDrag,
	onEndPointDragEnd,
}: LineSelectionHandlesProps) {
	const [draggingStart, setDraggingStart] = useState(false);
	const [draggingEnd, setDraggingEnd] = useState(false);

	const handleStartPointerDown = (e: React.PointerEvent) => {
		e.stopPropagation();
		e.preventDefault();
		setDraggingStart(true);
		(e.target as SVGElement).setPointerCapture(e.pointerId);
		onStartPointDragStart?.();
	};

	const handleEndPointerDown = (e: React.PointerEvent) => {
		e.stopPropagation();
		e.preventDefault();
		setDraggingEnd(true);
		(e.target as SVGElement).setPointerCapture(e.pointerId);
		onEndPointDragStart?.();
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!draggingStart && !draggingEnd) return;

		const svg = (e.target as SVGElement).ownerSVGElement;
		if (!svg) return;

		const point = svg.createSVGPoint();
		point.x = e.clientX;
		point.y = e.clientY;
		const ctm = svg.getScreenCTM()?.inverse();
		if (!ctm) return;

		const svgPoint = point.matrixTransform(ctm);

		if (draggingStart) {
			onStartPointDrag?.(svgPoint.x, svgPoint.y);
		} else if (draggingEnd) {
			onEndPointDrag?.(svgPoint.x, svgPoint.y);
		}
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		if (draggingStart) {
			setDraggingStart(false);
			onStartPointDragEnd?.();
		}
		if (draggingEnd) {
			setDraggingEnd(false);
			onEndPointDragEnd?.();
		}
		(e.target as SVGElement).releasePointerCapture(e.pointerId);
	};

	return (
		<g>
			{/* Visual guide line connecting start and end points */}
			<line
				x1={startX}
				y1={startY}
				x2={endX}
				y2={endY}
				stroke="rgba(59, 130, 246, 0.5)"
				strokeWidth={1}
				strokeDasharray="4,4"
				pointerEvents="none"
			/>

			{/* Start point handle (square) */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: SVG handle element requires onClick for drag interaction */}
			<rect
				x={startX - HANDLE_SIZE / 2}
				y={startY - HANDLE_SIZE / 2}
				width={HANDLE_SIZE}
				height={HANDLE_SIZE}
				fill="#3b82f6"
				stroke="#fff"
				strokeWidth={HANDLE_STROKE_WIDTH}
				style={{ cursor: "move" }}
				onClick={(e) => e.stopPropagation()}
				onPointerDown={handleStartPointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			/>

			{/* End point handle (circle) */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: SVG handle element requires onClick for drag interaction */}
			<circle
				cx={endX}
				cy={endY}
				r={HANDLE_SIZE / 2}
				fill="#22c55e"
				stroke="#fff"
				strokeWidth={HANDLE_STROKE_WIDTH}
				style={{ cursor: "move" }}
				onClick={(e) => e.stopPropagation()}
				onPointerDown={handleEndPointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			/>
		</g>
	);
}
