import { useId } from "react";
import { ObjectIds } from "@/lib/stgy";

export function GenericMarkerIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const id = useId();
	const glowId = `genericMarkerGlow-${id}`;
	const gradId = `genericMarkerGrad-${id}`;

	return (
		<g transform={transform}>
			<rect x={-24} y={-24} width={48} height={48} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="3" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#88ddff" />
					<stop offset="50%" stopColor="#44aaff" />
					<stop offset="100%" stopColor="#2288dd" />
				</linearGradient>
			</defs>

			{objectId === ObjectIds.Square && (
				<>
					<rect
						x={-16}
						y={-16}
						width={32}
						height={32}
						rx={4}
						ry={4}
						fill="none"
						stroke="#66ccff"
						strokeWidth="8"
						filter={`url(#${glowId})`}
						opacity="0.5"
					/>
					<rect
						x={-16}
						y={-16}
						width={32}
						height={32}
						rx={4}
						ry={4}
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="3"
					/>
					<rect
						x={-10}
						y={-10}
						width={20}
						height={20}
						rx={2}
						ry={2}
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="2"
					/>
				</>
			)}

			{objectId === ObjectIds.Circle && (
				<>
					<circle
						cx={0}
						cy={0}
						r={16}
						fill="none"
						stroke="#66ccff"
						strokeWidth="8"
						filter={`url(#${glowId})`}
						opacity="0.5"
					/>
					<circle
						cx={0}
						cy={0}
						r={16}
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="3"
					/>
					<circle
						cx={0}
						cy={0}
						r={10}
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="2"
					/>
				</>
			)}

			{objectId === ObjectIds.Plus && (
				<>
					<g filter={`url(#${glowId})`} opacity="0.5">
						<line
							x1={0}
							y1={-16}
							x2={0}
							y2={16}
							stroke="#66ccff"
							strokeWidth="10"
						/>
						<line
							x1={-16}
							y1={0}
							x2={16}
							y2={0}
							stroke="#66ccff"
							strokeWidth="10"
						/>
					</g>
					<line
						x1={0}
						y1={-16}
						x2={0}
						y2={16}
						stroke={`url(#${gradId})`}
						strokeWidth="4"
						strokeLinecap="round"
					/>
					<line
						x1={-16}
						y1={0}
						x2={16}
						y2={0}
						stroke={`url(#${gradId})`}
						strokeWidth="4"
						strokeLinecap="round"
					/>
				</>
			)}

			{objectId === ObjectIds.Triangle && (
				<>
					<path
						d="M 0 -18 L 16 14 L -16 14 Z"
						fill="none"
						stroke="#66ccff"
						strokeWidth="8"
						filter={`url(#${glowId})`}
						opacity="0.5"
						strokeLinejoin="round"
					/>
					<path
						d="M 0 -18 L 16 14 L -16 14 Z"
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="3"
						strokeLinejoin="round"
					/>
					<path
						d="M 0 -10 L 10 8 L -10 8 Z"
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="2"
						strokeLinejoin="round"
					/>
				</>
			)}
		</g>
	);
}
