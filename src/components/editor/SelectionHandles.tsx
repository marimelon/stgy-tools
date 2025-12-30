/**
 * インタラクティブな選択ハンドル
 *
 * リサイズと回転のためのドラッグ可能なハンドルを提供
 */

import type React from "react";
import type { HandleType, ResizeHandle } from "@/lib/editor";

interface SelectionHandlesProps {
	/** オブジェクト位置X */
	x: number;
	/** オブジェクト位置Y */
	y: number;
	/** バウンディングボックス幅 */
	width: number;
	/** バウンディングボックス高さ */
	height: number;
	/** オブジェクトの回転角度 */
	rotation: number;
	/** オフセットX (バウンディングボックス中心からのオフセット) */
	offsetX?: number;
	/** オフセットY */
	offsetY?: number;
	/** リサイズ開始時のコールバック */
	onResizeStart?: (handle: ResizeHandle, e: React.PointerEvent) => void;
	/** 回転開始時のコールバック */
	onRotateStart?: (e: React.PointerEvent) => void;
}

/** 選択色 */
const SELECTION_COLOR = "#00bfff";
/** ハンドルサイズ */
const HANDLE_SIZE = 8;
/** 回転ハンドルの距離 */
const ROTATE_HANDLE_DISTANCE = 20;

/**
 * インタラクティブ選択ハンドルコンポーネント
 */
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

	// 四隅のハンドル位置
	const corners: { handle: ResizeHandle; cx: number; cy: number }[] = [
		{ handle: "nw", cx: offsetX - halfWidth, cy: offsetY - halfHeight },
		{ handle: "ne", cx: offsetX + halfWidth, cy: offsetY - halfHeight },
		{ handle: "sw", cx: offsetX - halfWidth, cy: offsetY + halfHeight },
		{ handle: "se", cx: offsetX + halfWidth, cy: offsetY + halfHeight },
	];

	// 回転ハンドルの位置 (上部中央から外側)
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
			{/* 選択枠 */}
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

			{/* 回転ハンドルへの接続線 */}
			<line
				x1={offsetX}
				y1={offsetY - halfHeight}
				x2={offsetX}
				y2={rotateHandleY}
				stroke={SELECTION_COLOR}
				strokeWidth="1"
				style={{ pointerEvents: "none" }}
			/>

			{/* 回転ハンドル (円形) */}
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

			{/* 四隅のリサイズハンドル */}
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

/**
 * リサイズハンドルに応じたカーソルを取得
 */
function getResizeCursor(handle: ResizeHandle, rotation: number): string {
	// 回転角度を考慮してカーソルを調整
	const baseAngles: Record<ResizeHandle, number> = {
		nw: -45,
		ne: 45,
		sw: -135,
		se: 135,
	};

	const adjustedAngle = (baseAngles[handle] + rotation + 360) % 360;

	// 角度に応じたカーソル
	if (adjustedAngle >= 337.5 || adjustedAngle < 22.5) return "n-resize";
	if (adjustedAngle >= 22.5 && adjustedAngle < 67.5) return "ne-resize";
	if (adjustedAngle >= 67.5 && adjustedAngle < 112.5) return "e-resize";
	if (adjustedAngle >= 112.5 && adjustedAngle < 157.5) return "se-resize";
	if (adjustedAngle >= 157.5 && adjustedAngle < 202.5) return "s-resize";
	if (adjustedAngle >= 202.5 && adjustedAngle < 247.5) return "sw-resize";
	if (adjustedAngle >= 247.5 && adjustedAngle < 292.5) return "w-resize";
	return "nw-resize";
}
