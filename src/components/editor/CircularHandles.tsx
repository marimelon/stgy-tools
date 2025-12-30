/**
 * 円形配置モードハンドルコンポーネント
 *
 * 中心移動と半径変更のためのドラッグ可能なハンドルを提供
 */

import { useState } from "react";
import { screenToSVG } from "@/lib/editor/coordinates";
import type { Position } from "@/lib/stgy";

/** ハンドルサイズ */
const HANDLE_SIZE = 10;
/** 中心ハンドルの色 */
const CENTER_HANDLE_COLOR = "#8b5cf6";
/** 半径ハンドルの色 */
const RADIUS_HANDLE_COLOR = "#22c55e";

interface CircularHandlesProps {
	/** 円の中心 */
	center: Position;
	/** 円の半径 */
	radius: number;
	/** 中心ドラッグ時のコールバック */
	onCenterDrag: (center: Position) => void;
	/** 中心ドラッグ終了時のコールバック */
	onCenterDragEnd: () => void;
	/** 半径ドラッグ時のコールバック */
	onRadiusDrag: (radius: number) => void;
	/** 半径ドラッグ終了時のコールバック */
	onRadiusDragEnd: () => void;
}

/**
 * 円形配置モードハンドル
 */
export function CircularHandles({
	center,
	radius,
	onCenterDrag,
	onCenterDragEnd,
	onRadiusDrag,
	onRadiusDragEnd,
}: CircularHandlesProps) {
	const [draggingCenter, setDraggingCenter] = useState(false);
	const [draggingRadius, setDraggingRadius] = useState(false);

	// 半径ハンドルの位置（右側）
	const radiusHandleX = center.x + radius;
	const radiusHandleY = center.y;

	const handleCenterPointerDown = (e: React.PointerEvent) => {
		e.stopPropagation();
		e.preventDefault();
		setDraggingCenter(true);
		(e.target as SVGElement).setPointerCapture(e.pointerId);
	};

	const handleRadiusPointerDown = (e: React.PointerEvent) => {
		e.stopPropagation();
		e.preventDefault();
		setDraggingRadius(true);
		(e.target as SVGElement).setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!draggingCenter && !draggingRadius) return;

		const svg = (e.target as SVGElement).ownerSVGElement;
		if (!svg) return;

		const svgPoint = screenToSVG(e, svg);

		if (draggingCenter) {
			onCenterDrag(svgPoint);
		} else if (draggingRadius) {
			// 中心からの距離を計算
			const dx = svgPoint.x - center.x;
			const dy = svgPoint.y - center.y;
			const newRadius = Math.max(10, Math.sqrt(dx * dx + dy * dy));
			onRadiusDrag(newRadius);
		}
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		if (draggingCenter) {
			setDraggingCenter(false);
			onCenterDragEnd();
		}
		if (draggingRadius) {
			setDraggingRadius(false);
			onRadiusDragEnd();
		}
		(e.target as SVGElement).releasePointerCapture(e.pointerId);
	};

	return (
		<g>
			{/* 中心から半径ハンドルへの接続線 */}
			<line
				x1={center.x}
				y1={center.y}
				x2={radiusHandleX}
				y2={radiusHandleY}
				stroke={CENTER_HANDLE_COLOR}
				strokeWidth={1}
				strokeDasharray="4 2"
				pointerEvents="none"
			/>

			{/* 中心ハンドル（ダイヤモンド形） */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: SVG handle element requires onClick for drag interaction */}
			<rect
				x={center.x - HANDLE_SIZE / 2}
				y={center.y - HANDLE_SIZE / 2}
				width={HANDLE_SIZE}
				height={HANDLE_SIZE}
				fill={CENTER_HANDLE_COLOR}
				stroke="#fff"
				strokeWidth={2}
				transform={`rotate(45, ${center.x}, ${center.y})`}
				style={{ cursor: "move" }}
				onClick={(e) => e.stopPropagation()}
				onPointerDown={handleCenterPointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			/>

			{/* 半径ハンドル（円形） */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: SVG handle element requires onClick for drag interaction */}
			<circle
				cx={radiusHandleX}
				cy={radiusHandleY}
				r={HANDLE_SIZE / 2}
				fill={RADIUS_HANDLE_COLOR}
				stroke="#fff"
				strokeWidth={2}
				style={{ cursor: "ew-resize" }}
				onClick={(e) => e.stopPropagation()}
				onPointerDown={handleRadiusPointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			/>
		</g>
	);
}
