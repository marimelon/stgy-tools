/**
 * 円形ガイドオーバーレイコンポーネント
 *
 * 円形配置モード時に円形ガイドを表示
 */

import type { Position } from "@/lib/stgy";

/** ガイドの色 */
const GUIDE_COLOR = "#8b5cf6";
/** ガイドのストローク幅 */
const GUIDE_STROKE_WIDTH = 2;

interface CircularGuideOverlayProps {
	/** 円の中心 */
	center: Position;
	/** 円の半径 */
	radius: number;
}

/**
 * 円形ガイドオーバーレイ
 */
export function CircularGuideOverlay({
	center,
	radius,
}: CircularGuideOverlayProps) {
	return (
		<g pointerEvents="none">
			{/* メインの円 */}
			<circle
				cx={center.x}
				cy={center.y}
				r={radius}
				fill="none"
				stroke={GUIDE_COLOR}
				strokeWidth={GUIDE_STROKE_WIDTH}
				strokeDasharray="8 4"
				opacity={0.8}
			/>

			{/* 中心のクロスヘア */}
			<line
				x1={center.x - 8}
				y1={center.y}
				x2={center.x + 8}
				y2={center.y}
				stroke={GUIDE_COLOR}
				strokeWidth={1}
				opacity={0.6}
			/>
			<line
				x1={center.x}
				y1={center.y - 8}
				x2={center.x}
				y2={center.y + 8}
				stroke={GUIDE_COLOR}
				strokeWidth={1}
				opacity={0.6}
			/>
		</g>
	);
}
