/**
 * SVG overlay components for grid lines and selection indicators
 */

import type { ReactNode } from "react";

export interface GridOverlayProps {
	width: number;
	height: number;
	gridSize: number;
}
export function GridOverlay({ width, height, gridSize }: GridOverlayProps) {
	const lines: ReactNode[] = [];

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

export interface SelectionIndicatorProps {
	x: number;
	y: number;
	width: number;
	height: number;
	offsetX?: number;
	offsetY?: number;
	rotation: number;
}
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
