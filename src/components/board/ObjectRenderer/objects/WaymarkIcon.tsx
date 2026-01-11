import { COLORS, SIZES, WAYMARK_INFO } from "../constants";
import { renderOriginalIconIfEnabled } from "../utils";

export function WaymarkIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const originalIcon = renderOriginalIconIfEnabled(objectId, transform);
	if (originalIcon) return originalIcon;

	const size = SIZES.WAYMARK;
	const info = WAYMARK_INFO[objectId] ?? {
		label: "?",
		color: COLORS.ROLE_DEFAULT,
	};

	return (
		<g transform={transform}>
			<circle
				cx={0}
				cy={0}
				r={size / 2}
				fill={info.color}
				stroke={COLORS.STROKE_WHITE}
				strokeWidth="2"
			/>
			<text
				textAnchor="middle"
				dy="6"
				fill={COLORS.STROKE_WHITE}
				fontSize="16"
				fontWeight="bold"
			>
				{info.label}
			</text>
		</g>
	);
}
