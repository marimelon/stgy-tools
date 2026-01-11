import { useId } from "react";
import { ObjectIds } from "@/lib/stgy";

export function BindMarkerIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const id = useId();
	const glowId = `bindMarkerGlow-${id}`;

	const numberMap: Record<number, number> = {
		[ObjectIds.Bind1]: 1,
		[ObjectIds.Bind2]: 2,
		[ObjectIds.Bind3]: 3,
	};
	const num = numberMap[objectId] ?? 1;

	// Elliptical chain link (vertical ellipse)
	const rx = 8;
	const ry = 12;

	return (
		<g transform={transform}>
			<rect x={-20} y={-30} width={44} height={64} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="1.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<g filter={`url(#${glowId})`} opacity="0.5">
				<ellipse
					cx={-4}
					cy={-14}
					rx={rx}
					ry={ry}
					fill="none"
					stroke="#bb77dd"
					strokeWidth="6"
				/>
				<ellipse
					cx={4}
					cy={0}
					rx={rx}
					ry={ry}
					fill="none"
					stroke="#bb77dd"
					strokeWidth="6"
				/>
				<ellipse
					cx={-4}
					cy={14}
					rx={rx}
					ry={ry}
					fill="none"
					stroke="#bb77dd"
					strokeWidth="6"
				/>
			</g>

			{/* Link 1 (top) - outer white border */}
			<ellipse
				cx={-4}
				cy={-14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#ffffff"
				strokeWidth="3"
			/>
			{/* Link 1 - inner purple */}
			<ellipse
				cx={-4}
				cy={-14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#9955bb"
				strokeWidth="1.5"
			/>

			{/* Link 2 (center) - outer white border */}
			<ellipse
				cx={4}
				cy={0}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#ffffff"
				strokeWidth="3"
			/>
			{/* Link 2 - inner purple */}
			<ellipse
				cx={4}
				cy={0}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#9955bb"
				strokeWidth="1.5"
			/>

			{/* Link 3 (bottom) - outer white border */}
			<ellipse
				cx={-4}
				cy={14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#ffffff"
				strokeWidth="3"
			/>
			{/* Link 3 - inner purple */}
			<ellipse
				cx={-4}
				cy={14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#9955bb"
				strokeWidth="1.5"
			/>

			<text
				x={16}
				y={-16}
				textAnchor="middle"
				dominantBaseline="middle"
				fill="#ffffff"
				fontSize="14"
				fontWeight="bold"
				fontFamily="Arial, sans-serif"
			>
				{num}
			</text>
		</g>
	);
}
