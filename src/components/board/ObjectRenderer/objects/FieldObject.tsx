import { useId } from "react";
import type { Color } from "@/lib/stgy";
import { ObjectIds } from "@/lib/stgy";
import {
	CIRCLE_FIELD_IDS,
	COLORS,
	LARGE_FIELD_IDS,
	SIZES,
} from "../constants";
import { colorToRgba, renderOriginalIconIfEnabled } from "../utils";

export function FieldObject({
	objectId,
	transform,
	color,
}: {
	objectId: number;
	transform: string;
	color: Color;
}) {
	const id = useId();

	// オリジナル画像が有効な場合は画像を使用（色が変更されている場合はSVGを使用）
	const originalIcon = renderOriginalIconIfEnabled(objectId, transform, color);
	if (originalIcon) return originalIcon;
	const fill = colorToRgba(color);
	const size = LARGE_FIELD_IDS.includes(objectId)
		? SIZES.FIELD_LARGE
		: SIZES.FIELD;

	// チェッカーパターンのタイルサイズ（参照画像に合わせて調整）
	const tileSize = LARGE_FIELD_IDS.includes(objectId) ? 16 : 4;

	// パターンID
	const checkerPatternId = `checker-${id}`;
	const marblePatternId = `marble-${id}`;
	const borderGradientId = `border-${id}`;

	// チェック柄（CircleCheck, SquareCheck）
	if (
		objectId === ObjectIds.CircleCheck ||
		objectId === ObjectIds.SquareCheck
	) {
		const isCircle = objectId === ObjectIds.CircleCheck;
		return (
			<g transform={transform}>
				<defs>
					{/* チェッカーパターン定義 */}
					<pattern
						id={checkerPatternId}
						width={tileSize * 2}
						height={tileSize * 2}
						patternUnits="userSpaceOnUse"
						patternTransform={`translate(${-size / 2}, ${-size / 2})`}
					>
						<rect width={tileSize * 2} height={tileSize * 2} fill="#a0a0a0" />
						<rect width={tileSize} height={tileSize} fill="#707070" />
						<rect
							x={tileSize}
							y={tileSize}
							width={tileSize}
							height={tileSize}
							fill="#707070"
						/>
					</pattern>
					{/* 縁のグラデーション */}
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#b0b0b0" />
						<stop offset="50%" stopColor="#808080" />
						<stop offset="100%" stopColor="#606060" />
					</linearGradient>
				</defs>
				{isCircle ? (
					<>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill={`url(#${checkerPatternId})`}
						/>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				) : (
					<>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill={`url(#${checkerPatternId})`}
						/>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				)}
			</g>
		);
	}

	// グレー無地（CircleGraySolid, SquareGraySolid）
	if (
		objectId === ObjectIds.CircleGraySolid ||
		objectId === ObjectIds.SquareGraySolid
	) {
		const isCircle = objectId === ObjectIds.CircleGraySolid;
		return (
			<g transform={transform}>
				<defs>
					{/* 大理石風グラデーション */}
					<radialGradient id={marblePatternId} cx="50%" cy="50%" r="70%">
						<stop offset="0%" stopColor="#d8d8d8" />
						<stop offset="50%" stopColor="#b8b8b8" />
						<stop offset="100%" stopColor="#989898" />
					</radialGradient>
					{/* 縁のグラデーション */}
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#a0a0a0" />
						<stop offset="50%" stopColor="#707070" />
						<stop offset="100%" stopColor="#505050" />
					</linearGradient>
				</defs>
				{isCircle ? (
					<>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill={`url(#${marblePatternId})`}
						/>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				) : (
					<>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill={`url(#${marblePatternId})`}
						/>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				)}
			</g>
		);
	}

	// 白タイル（CircleWhiteTile, SquareWhiteTile）
	if (
		objectId === ObjectIds.CircleWhiteTile ||
		objectId === ObjectIds.SquareWhiteTile
	) {
		const isCircle = objectId === ObjectIds.CircleWhiteTile;
		return (
			<g transform={transform}>
				<defs>
					{/* 白タイルチェッカーパターン */}
					<pattern
						id={checkerPatternId}
						width={tileSize * 2}
						height={tileSize * 2}
						patternUnits="userSpaceOnUse"
						patternTransform={`translate(${-size / 2}, ${-size / 2})`}
					>
						<rect width={tileSize * 2} height={tileSize * 2} fill="#e8e8e8" />
						<rect width={tileSize} height={tileSize} fill="#c8c8c8" />
						<rect
							x={tileSize}
							y={tileSize}
							width={tileSize}
							height={tileSize}
							fill="#c8c8c8"
						/>
					</pattern>
					{/* 縁のグラデーション */}
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#b0b0b0" />
						<stop offset="50%" stopColor="#808080" />
						<stop offset="100%" stopColor="#606060" />
					</linearGradient>
				</defs>
				{isCircle ? (
					<>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill={`url(#${checkerPatternId})`}
						/>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				) : (
					<>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill={`url(#${checkerPatternId})`}
						/>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				)}
			</g>
		);
	}

	// 白無地（CircleWhiteSolid, SquareWhiteSolid）
	if (
		objectId === ObjectIds.CircleWhiteSolid ||
		objectId === ObjectIds.SquareWhiteSolid
	) {
		const isCircle = objectId === ObjectIds.CircleWhiteSolid;
		return (
			<g transform={transform}>
				<defs>
					{/* 白大理石風グラデーション */}
					<radialGradient id={marblePatternId} cx="50%" cy="50%" r="70%">
						<stop offset="0%" stopColor="#f0f0f0" />
						<stop offset="50%" stopColor="#e0e0e0" />
						<stop offset="100%" stopColor="#d0d0d0" />
					</radialGradient>
					{/* 縁のグラデーション */}
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#a0a0a0" />
						<stop offset="50%" stopColor="#707070" />
						<stop offset="100%" stopColor="#505050" />
					</linearGradient>
				</defs>
				{isCircle ? (
					<>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill={`url(#${marblePatternId})`}
						/>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				) : (
					<>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill={`url(#${marblePatternId})`}
						/>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				)}
			</g>
		);
	}

	// 円形グレー（CircleGray）- 大きめ、縁ありグレー
	if (objectId === ObjectIds.CircleGray) {
		return (
			<g transform={transform}>
				<defs>
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#a0a0a0" />
						<stop offset="50%" stopColor="#808080" />
						<stop offset="100%" stopColor="#606060" />
					</linearGradient>
				</defs>
				<circle
					cx={0}
					cy={0}
					r={size / 2}
					fill={COLORS.FILL_FIELD_GRAY}
					stroke={`url(#${borderGradientId})`}
					strokeWidth="3"
				/>
			</g>
		);
	}

	// 正方形グレー（SquareGray）- 大きめ、縁ありグレー
	if (objectId === ObjectIds.SquareGray) {
		return (
			<g transform={transform}>
				<defs>
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#a0a0a0" />
						<stop offset="50%" stopColor="#808080" />
						<stop offset="100%" stopColor="#606060" />
					</linearGradient>
				</defs>
				<rect
					x={-size / 2}
					y={-size / 2}
					width={size}
					height={size}
					fill={COLORS.FILL_FIELD_GRAY}
					stroke={`url(#${borderGradientId})`}
					strokeWidth="3"
				/>
			</g>
		);
	}

	// フォールバック（カラー指定のシンプルな図形）
	const isCircle = CIRCLE_FIELD_IDS.includes(objectId);
	return (
		<g transform={transform}>
			{isCircle ? (
				<circle
					cx={0}
					cy={0}
					r={size / 2}
					fill={fill}
					stroke={COLORS.STROKE_DEFAULT}
					strokeWidth="1"
				/>
			) : (
				<rect
					x={-size / 2}
					y={-size / 2}
					width={size}
					height={size}
					fill={fill}
					stroke={COLORS.STROKE_DEFAULT}
					strokeWidth="1"
				/>
			)}
		</g>
	);
}
