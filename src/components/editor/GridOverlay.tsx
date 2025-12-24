/**
 * SVGオーバーレイコンポーネント
 *
 * グリッド線や選択インジケーターなどのSVGオーバーレイ
 */

import type { ReactNode } from "react";

/**
 * グリッドオーバーレイのProps
 */
export interface GridOverlayProps {
	/** キャンバス幅 */
	width: number;
	/** キャンバス高さ */
	height: number;
	/** グリッドサイズ */
	gridSize: number;
}

/**
 * グリッドオーバーレイコンポーネント
 *
 * キャンバス上にグリッド線を表示
 */
export function GridOverlay({ width, height, gridSize }: GridOverlayProps) {
	const lines: ReactNode[] = [];

	// 縦線
	for (let x = gridSize; x < width; x += gridSize) {
		lines.push(
			<line
				key={`v-${x}`}
				x1={x}
				y1={0}
				x2={x}
				y2={height}
				stroke="rgba(255, 255, 255, 0.1)"
				strokeWidth={1}
			/>,
		);
	}

	// 横線
	for (let y = gridSize; y < height; y += gridSize) {
		lines.push(
			<line
				key={`h-${y}`}
				x1={0}
				y1={y}
				x2={width}
				y2={y}
				stroke="rgba(255, 255, 255, 0.1)"
				strokeWidth={1}
			/>,
		);
	}

	return <g pointerEvents="none">{lines}</g>;
}

/**
 * 選択インジケーターのProps
 */
export interface SelectionIndicatorProps {
	/** X座標 */
	x: number;
	/** Y座標 */
	y: number;
	/** 幅 */
	width: number;
	/** 高さ */
	height: number;
	/** X方向オフセット */
	offsetX?: number;
	/** Y方向オフセット */
	offsetY?: number;
	/** 回転角度 */
	rotation: number;
}

/**
 * 選択インジケーターコンポーネント
 *
 * 選択されたオブジェクトのバウンディングボックスを表示
 */
export function SelectionIndicator({
	x,
	y,
	width,
	height,
	offsetX = 0,
	offsetY = 0,
	rotation,
}: SelectionIndicatorProps) {
	const padding = 4;
	const boxWidth = width + padding * 2;
	const boxHeight = height + padding * 2;

	// ボックスの中心位置（offsetを考慮）
	const boxCenterX = offsetX;
	const boxCenterY = offsetY;

	return (
		<g
			transform={`translate(${x}, ${y}) rotate(${rotation})`}
			pointerEvents="none"
		>
			<rect
				x={boxCenterX - boxWidth / 2}
				y={boxCenterY - boxHeight / 2}
				width={boxWidth}
				height={boxHeight}
				fill="none"
				stroke="#22d3ee"
				strokeWidth={2}
				strokeDasharray="4 2"
			/>
		</g>
	);
}
