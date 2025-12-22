import type { BoardObject } from "@/lib/stgy";
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

/**
 * デバッグ情報表示コンポーネント
 */
export function DebugInfo({ object }: { object: BoardObject }) {
	const { objectId, position, rotation, size, param1, param2, text, flags } =
		object;

	const lines = [
		`ID: ${objectId}`,
		`Pos: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`,
		`Rot: ${rotation}° Size: ${size}%`,
	];

	if (param1 !== undefined) lines.push(`P1: ${param1}`);
	if (param2 !== undefined) lines.push(`P2: ${param2}`);
	if (text) lines.push(`Text: "${text}"`);

	const flagList: string[] = [];
	if (flags.flipHorizontal) flagList.push("FlipH");
	if (flags.flipVertical) flagList.push("FlipV");
	if (!flags.visible) flagList.push("Hidden");
	if (flagList.length > 0) lines.push(`Flags: ${flagList.join(", ")}`);

	const lineHeight = 11;
	const padding = 4;
	const boxWidth = 120;
	const boxHeight = lines.length * lineHeight + padding * 2;

	// ボックス位置（オブジェクトの右上に表示）
	const boxX = position.x + 20;
	const boxY = position.y - boxHeight - 10;

	return (
		<g>
			{/* 背景ボックス */}
			<rect
				x={boxX}
				y={boxY}
				width={boxWidth}
				height={boxHeight}
				fill="rgba(0, 0, 0, 0.8)"
				stroke={COLORS.DEBUG_GREEN}
				strokeWidth="1"
				rx="3"
			/>
			{/* テキスト */}
			{lines.map((line, i) => (
				<text
					key={line}
					x={boxX + padding}
					y={boxY + padding + (i + 1) * lineHeight - 2}
					fill={COLORS.DEBUG_GREEN}
					fontSize="9"
					fontFamily="monospace"
				>
					{line}
				</text>
			))}
			{/* オブジェクトへの線 */}
			<line
				x1={boxX}
				y1={boxY + boxHeight}
				x2={position.x}
				y2={position.y}
				stroke={COLORS.DEBUG_GREEN}
				strokeWidth="1"
				strokeDasharray="2,2"
			/>
		</g>
	);
}

/**
 * バウンディングボックスコンポーネント
 */
export function BoundingBox({
	x,
	y,
	width,
	height,
	offsetX,
	offsetY,
	rotation,
	objectId,
}: {
	x: number;
	y: number;
	width: number;
	height: number;
	offsetX: number;
	offsetY: number;
	rotation: number;
	objectId: number;
}) {
	// オフセットがある場合、バウンディングボックスの中心をオフセット位置に移動
	const boxCenterX = offsetX;
	const boxCenterY = offsetY;

	return (
		<g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
			<rect
				x={boxCenterX - width / 2}
				y={boxCenterY - height / 2}
				width={width}
				height={height}
				fill="none"
				stroke={COLORS.DEBUG_GREEN}
				strokeWidth="1"
				strokeDasharray="4,2"
			/>
			{/* オブジェクトの原点 */}
			<circle cx={0} cy={0} r={2} fill={COLORS.DEBUG_RED} />
			{/* バウンディングボックスの中心 */}
			{(offsetX !== 0 || offsetY !== 0) && (
				<circle
					cx={boxCenterX}
					cy={boxCenterY}
					r={2}
					fill={COLORS.DEBUG_GREEN}
				/>
			)}
			{/* オブジェクトID表示 */}
			<text
				x={boxCenterX - width / 2 + 2}
				y={boxCenterY - height / 2 - 4}
				fill={COLORS.DEBUG_GREEN}
				fontSize="10"
				fontFamily="monospace"
			>
				{objectId}
			</text>
		</g>
	);
}
