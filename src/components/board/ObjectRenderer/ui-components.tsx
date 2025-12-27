import { COLORS } from "./constants";

/**
 * 選択インジケーターコンポーネント
 */
export function SelectionIndicator({
	x,
	y,
	width,
	height,
	offsetX,
	offsetY,
	rotation,
}: {
	x: number;
	y: number;
	width: number;
	height: number;
	offsetX: number;
	offsetY: number;
	rotation: number;
}) {
	const boxCenterX = offsetX;
	const boxCenterY = offsetY;
	const handleSize = 6;

	// 四隅のハンドル位置
	const corners = [
		{ x: boxCenterX - width / 2, y: boxCenterY - height / 2 },
		{ x: boxCenterX + width / 2, y: boxCenterY - height / 2 },
		{ x: boxCenterX - width / 2, y: boxCenterY + height / 2 },
		{ x: boxCenterX + width / 2, y: boxCenterY + height / 2 },
	];

	return (
		<g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
			{/* 選択枠 */}
			<rect
				x={boxCenterX - width / 2}
				y={boxCenterY - height / 2}
				width={width}
				height={height}
				fill="none"
				stroke={COLORS.SELECTION}
				strokeWidth="2"
			/>
			{/* 四隅のハンドル */}
			{corners.map((corner) => (
				<rect
					key={`${corner.x}-${corner.y}`}
					x={corner.x - handleSize / 2}
					y={corner.y - handleSize / 2}
					width={handleSize}
					height={handleSize}
					fill={COLORS.SELECTION}
					stroke="#fff"
					strokeWidth="1"
				/>
			))}
		</g>
	);
}
