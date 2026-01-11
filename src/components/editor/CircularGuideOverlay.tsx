/**
 * Circular guide overlay component
 *
 * Displays circular guide during circular placement mode
 */

import type { Position } from "@/lib/stgy";

const GUIDE_COLOR = "#8b5cf6";
const GUIDE_STROKE_WIDTH = 2;

interface CircularGuideOverlayProps {
	center: Position;
	radius: number;
}

export function CircularGuideOverlay({
	center,
	radius,
}: CircularGuideOverlayProps) {
	return (
		<g pointerEvents="none">
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
