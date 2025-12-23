/**
 * Line専用の選択ハンドルコンポーネント
 *
 * 始点・終点を直接操作できるハンドルを表示
 */

import { useState } from "react";

interface LineSelectionHandlesProps {
	/** 始点X座標 */
	startX: number;
	/** 始点Y座標 */
	startY: number;
	/** 終点X座標 */
	endX: number;
	/** 終点Y座標 */
	endY: number;
	/** 始点移動開始時のコールバック */
	onStartPointDragStart?: () => void;
	/** 始点移動時のコールバック */
	onStartPointDrag?: (x: number, y: number) => void;
	/** 始点移動終了時のコールバック */
	onStartPointDragEnd?: () => void;
	/** 終点移動開始時のコールバック */
	onEndPointDragStart?: () => void;
	/** 終点移動時のコールバック */
	onEndPointDrag?: (x: number, y: number) => void;
	/** 終点移動終了時のコールバック */
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

	// 始点ドラッグ開始
	const handleStartPointerDown = (e: React.PointerEvent) => {
		e.stopPropagation();
		e.preventDefault();
		setDraggingStart(true);
		(e.target as SVGElement).setPointerCapture(e.pointerId);
		onStartPointDragStart?.();
	};

	// 終点ドラッグ開始
	const handleEndPointerDown = (e: React.PointerEvent) => {
		e.stopPropagation();
		e.preventDefault();
		setDraggingEnd(true);
		(e.target as SVGElement).setPointerCapture(e.pointerId);
		onEndPointDragStart?.();
	};

	// ポインター移動
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

	// ドラッグ終了
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
			{/* 始点と終点を結ぶ線（視覚的なガイド） */}
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

			{/* 始点ハンドル（四角） */}
			<rect
				x={startX - HANDLE_SIZE / 2}
				y={startY - HANDLE_SIZE / 2}
				width={HANDLE_SIZE}
				height={HANDLE_SIZE}
				fill="#3b82f6"
				stroke="#fff"
				strokeWidth={HANDLE_STROKE_WIDTH}
				style={{ cursor: "move" }}
				onPointerDown={handleStartPointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			/>

			{/* 終点ハンドル（丸） */}
			<circle
				cx={endX}
				cy={endY}
				r={HANDLE_SIZE / 2}
				fill="#22c55e"
				stroke="#fff"
				strokeWidth={HANDLE_STROKE_WIDTH}
				style={{ cursor: "move" }}
				onPointerDown={handleEndPointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			/>

			{/* 始点ラベル */}
			<text
				x={startX}
				y={startY - 12}
				textAnchor="middle"
				fill="#3b82f6"
				fontSize="10"
				fontWeight="bold"
				pointerEvents="none"
			>
				始点
			</text>

			{/* 終点ラベル */}
			<text
				x={endX}
				y={endY - 12}
				textAnchor="middle"
				fill="#22c55e"
				fontSize="10"
				fontWeight="bold"
				pointerEvents="none"
			>
				終点
			</text>
		</g>
	);
}
