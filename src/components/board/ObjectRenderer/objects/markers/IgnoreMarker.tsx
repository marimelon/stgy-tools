import { useId } from "react";
import { ObjectIds } from "@/lib/stgy";

export function IgnoreMarkerIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const id = useId();
	const glowId = `ignoreMarkerGlow-${id}`;

	const numberMap: Record<number, number> = {
		[ObjectIds.Ignore1]: 1,
		[ObjectIds.Ignore2]: 2,
	};
	const num = numberMap[objectId] ?? 1;

	const radius = 18;

	return (
		<g transform={transform}>
			<rect x={-22} y={-22} width={44} height={44} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="2" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<g filter={`url(#${glowId})`} opacity="0.6">
				<circle
					cx={0}
					cy={0}
					r={radius}
					fill="none"
					stroke="#ff4444"
					strokeWidth="5"
				/>
				<line
					x1={-12}
					y1={12}
					x2={12}
					y2={-12}
					stroke="#ff4444"
					strokeWidth="5"
				/>
			</g>

			<circle
				cx={0}
				cy={0}
				r={radius}
				fill="none"
				stroke="#ff6666"
				strokeWidth="3"
			/>

			<line
				x1={-12}
				y1={12}
				x2={12}
				y2={-12}
				stroke="#ff6666"
				strokeWidth="3"
				strokeLinecap="round"
			/>

			<text
				x={-10}
				y={-10}
				textAnchor="middle"
				dominantBaseline="middle"
				fill="#ffffff"
				fontSize="10"
				fontWeight="bold"
				fontFamily="Arial, sans-serif"
			>
				{num}
			</text>
		</g>
	);
}
