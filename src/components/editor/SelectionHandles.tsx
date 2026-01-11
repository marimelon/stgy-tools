/**
 * Interactive selection handles
 *
 * Provides draggable handles for resize and rotation
 */

import type React from "react";
import type { HandleType, ResizeHandle } from "@/lib/editor";

interface SelectionHandlesProps {
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: number;
	/** Offset from bounding box center */
	offsetX?: number;
	offsetY?: number;
	onResizeStart?: (handle: ResizeHandle, e: React.PointerEvent) => void;
	onRotateStart?: (e: React.PointerEvent) => void;
}

const SELECTION_COLOR = "#00bfff";
const HANDLE_SIZE = 8;
const ROTATE_HANDLE_DISTANCE = 20;

export function SelectionHandles({
	x,
	y,
	width,
	height,
	rotation,
	offsetX = 0,
	offsetY = 0,
	onResizeStart,
	onRotateStart,
}: SelectionHandlesProps) {
	const halfWidth = width / 2;
	const halfHeight = height / 2;

	const corners: { handle: ResizeHandle; cx: number; cy: number }[] = [
		{ handle: "nw", cx: offsetX - halfWidth, cy: offsetY - halfHeight },
		{ handle: "ne", cx: offsetX + halfWidth, cy: offsetY - halfHeight },
		{ handle: "sw", cx: offsetX - halfWidth, cy: offsetY + halfHeight },
		{ handle: "se", cx: offsetX + halfWidth, cy: offsetY + halfHeight },
	];

	const rotateHandleY = offsetY - halfHeight - ROTATE_HANDLE_DISTANCE;

	const handlePointerDown = (handleType: HandleType, e: React.PointerEvent) => {
		e.stopPropagation();
		if (handleType === "rotate") {
			onRotateStart?.(e);
		} else {
			onResizeStart?.(handleType, e);
		}
	};

	return (
		<g
			transform={`translate(${x}, ${y}) rotate(${rotation})`}
			style={{ pointerEvents: "all" }}
		>
			<rect
				x={offsetX - halfWidth}
				y={offsetY - halfHeight}
				width={width}
				height={height}
				fill="none"
				stroke={SELECTION_COLOR}
				strokeWidth="2"
				style={{ pointerEvents: "none" }}
			/>

			<line
				x1={offsetX}
				y1={offsetY - halfHeight}
				x2={offsetX}
				y2={rotateHandleY}
				stroke={SELECTION_COLOR}
				strokeWidth="1"
				style={{ pointerEvents: "none" }}
			/>

			{/* biome-ignore lint/a11y/noStaticElementInteractions: SVG handle element requires onClick for drag interaction */}
			<circle
				cx={offsetX}
				cy={rotateHandleY}
				r={HANDLE_SIZE / 2}
				fill={SELECTION_COLOR}
				stroke="#fff"
				strokeWidth="1"
				style={{ cursor: "grab" }}
				onClick={(e) => e.stopPropagation()}
				onPointerDown={(e) => handlePointerDown("rotate", e)}
			/>

			{corners.map(({ handle, cx, cy }) => (
				// biome-ignore lint/a11y/noStaticElementInteractions: SVG handle element requires onClick for drag interaction
				<rect
					key={handle}
					x={cx - HANDLE_SIZE / 2}
					y={cy - HANDLE_SIZE / 2}
					width={HANDLE_SIZE}
					height={HANDLE_SIZE}
					fill={SELECTION_COLOR}
					stroke="#fff"
					strokeWidth="1"
					style={{ cursor: getResizeCursor(handle, rotation) }}
					onClick={(e) => e.stopPropagation()}
					onPointerDown={(e) => handlePointerDown(handle, e)}
				/>
			))}
		</g>
	);
}

/** Returns cursor style adjusted for rotation angle */
function getResizeCursor(handle: ResizeHandle, rotation: number): string {
	const baseAngles: Record<ResizeHandle, number> = {
		nw: -45,
		ne: 45,
		sw: -135,
		se: 135,
	};

	const adjustedAngle = (baseAngles[handle] + rotation + 360) % 360;

	if (adjustedAngle >= 337.5 || adjustedAngle < 22.5) return "n-resize";
	if (adjustedAngle >= 22.5 && adjustedAngle < 67.5) return "ne-resize";
	if (adjustedAngle >= 67.5 && adjustedAngle < 112.5) return "e-resize";
	if (adjustedAngle >= 112.5 && adjustedAngle < 157.5) return "se-resize";
	if (adjustedAngle >= 157.5 && adjustedAngle < 202.5) return "s-resize";
	if (adjustedAngle >= 202.5 && adjustedAngle < 247.5) return "sw-resize";
	if (adjustedAngle >= 247.5 && adjustedAngle < 292.5) return "w-resize";
	return "nw-resize";
}
