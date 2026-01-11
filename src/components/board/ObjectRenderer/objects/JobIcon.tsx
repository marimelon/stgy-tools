import { JOB_ABBREVIATIONS, JOB_ROLE_COLORS, JOB_ROLES } from "../constants";
import { renderOriginalIconIfEnabled } from "../utils";

export function JobIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const originalIcon = renderOriginalIconIfEnabled(objectId, transform);
	if (originalIcon) return originalIcon;

	const abbreviation = JOB_ABBREVIATIONS[objectId] ?? "?";
	const role = JOB_ROLES[objectId] ?? "melee";
	const bgColor = JOB_ROLE_COLORS[role];
	const size = 24;

	return (
		<g transform={transform}>
			<circle
				cx={0}
				cy={0}
				r={size / 2}
				fill={bgColor}
				stroke="#ffffff"
				strokeWidth="2"
			/>
			<text
				x={0}
				y={0}
				textAnchor="middle"
				dominantBaseline="central"
				fill="#ffffff"
				fontSize="14"
				fontWeight="bold"
			>
				{abbreviation}
			</text>
		</g>
	);
}
