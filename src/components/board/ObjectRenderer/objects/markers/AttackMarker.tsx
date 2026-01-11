import { useId } from "react";
import { ObjectIds } from "@/lib/stgy";

export function AttackMarkerIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const id = useId();
	const glowId = `attackMarkerGlow-${id}`;
	const gradId = `attackMarkerGrad-${id}`;

	const numberMap: Record<number, number> = {
		[ObjectIds.Attack1]: 1,
		[ObjectIds.Attack2]: 2,
		[ObjectIds.Attack3]: 3,
		[ObjectIds.Attack4]: 4,
		[ObjectIds.Attack5]: 5,
		[ObjectIds.Attack6]: 6,
		[ObjectIds.Attack7]: 7,
		[ObjectIds.Attack8]: 8,
	};
	const num = numberMap[objectId] ?? 1;

	// Hexagon path with tab at bottom
	const hexPath = `
		M 0 -20
		L 17 -10
		L 17 10
		L 8 18
		L 8 24
		L -8 24
		L -8 18
		L -17 10
		L -17 -10
		Z
	`;

	return (
		<g transform={transform}>
			<rect x={-20} y={-22} width={40} height={48} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="2" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#ffee88" />
					<stop offset="50%" stopColor="#ffcc00" />
					<stop offset="100%" stopColor="#ff9900" />
				</linearGradient>
			</defs>

			<path
				d={hexPath}
				fill="none"
				stroke="#ffaa00"
				strokeWidth="6"
				filter={`url(#${glowId})`}
				opacity="0.6"
			/>

			<path
				d={hexPath}
				fill="none"
				stroke={`url(#${gradId})`}
				strokeWidth="3"
				strokeLinejoin="round"
			/>

			<path
				d={`
					M 0 -16
					L 13 -8
					L 13 8
					L 6 14
					L 6 20
					L -6 20
					L -6 14
					L -13 8
					L -13 -8
					Z
				`}
				fill="rgba(40, 30, 20, 0.8)"
				stroke="none"
			/>

			<text
				x={0}
				y={2}
				textAnchor="middle"
				dominantBaseline="middle"
				fill="#ffdd66"
				fontSize="18"
				fontWeight="bold"
				fontFamily="Arial, sans-serif"
			>
				{num}
			</text>
		</g>
	);
}
