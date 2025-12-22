import { COLORS, SIZES } from "../constants";

export function PlaceholderObject({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	return (
		<g transform={transform}>
			<circle
				cx={0}
				cy={0}
				r={SIZES.PLACEHOLDER}
				fill={COLORS.FILL_PLACEHOLDER}
				stroke="#999"
				strokeWidth="1"
			/>
			<text textAnchor="middle" dy="4" fill={COLORS.STROKE_WHITE} fontSize="10">
				{objectId}
			</text>
		</g>
	);
}
