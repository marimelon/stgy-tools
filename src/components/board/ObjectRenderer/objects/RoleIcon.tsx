import { COLORS, ROLE_COLORS, ROLE_LABELS, SIZES } from "../constants";
import { renderOriginalIconIfEnabled } from "../utils";

export function RoleIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const originalIcon = renderOriginalIconIfEnabled(objectId, transform);
	if (originalIcon) return originalIcon;

	const label = ROLE_LABELS[objectId] ?? "?";
	const bgColor = ROLE_COLORS[objectId] ?? COLORS.ROLE_DEFAULT;
	const size = SIZES.ROLE_ICON;

	return (
		<g transform={transform}>
			<circle
				cx={0}
				cy={0}
				r={size / 2}
				fill={bgColor}
				stroke={COLORS.STROKE_WHITE}
				strokeWidth="1"
			/>
			<text
				textAnchor="middle"
				dy="5"
				fill={COLORS.STROKE_WHITE}
				fontSize="10"
				fontWeight="bold"
			>
				{label}
			</text>
		</g>
	);
}
