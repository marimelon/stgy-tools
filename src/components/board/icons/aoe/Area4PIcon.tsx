/**
 * 4人用エリアアイコン
 */

import { useId } from "react";
import type { IconProps } from "../types";

export function Area4PIcon({ transform }: IconProps) {
	const id = useId();
	const bgGlowId = `area4pGlow-${id}`;
	const orbGlowId = `area4pOrbGlow-${id}`;

	const outerRadius = 32;
	const orbRadius = 8;
	const orbOffset = 12;
	const notchCount = 16;

	const notchPath = [];
	for (let i = 0; i < notchCount; i++) {
		const angle1 = (i * 360) / notchCount;
		const angle2 = ((i + 0.5) * 360) / notchCount;
		const rad1 = (angle1 * Math.PI) / 180;
		const rad2 = (angle2 * Math.PI) / 180;
		const r1 = outerRadius;
		const r2 = outerRadius - 4;
		const x1 = Math.cos(rad1) * r1;
		const y1 = Math.sin(rad1) * r1;
		const x2 = Math.cos(rad2) * r2;
		const y2 = Math.sin(rad2) * r2;
		if (i === 0) {
			notchPath.push(`M ${x1} ${y1}`);
		} else {
			notchPath.push(`L ${x1} ${y1}`);
		}
		notchPath.push(`L ${x2} ${y2}`);
	}
	notchPath.push("Z");

	const orbPositions = [
		{ x: -orbOffset, y: -orbOffset },
		{ x: orbOffset, y: -orbOffset },
		{ x: -orbOffset, y: orbOffset },
		{ x: orbOffset, y: orbOffset },
	];

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={bgGlowId}>
					<stop offset="0%" stopColor="#ff88cc" stopOpacity="0.6" />
					<stop offset="70%" stopColor="#ff66aa" stopOpacity="0.3" />
					<stop offset="100%" stopColor="#ff66aa" stopOpacity="0" />
				</radialGradient>
				<radialGradient id={orbGlowId}>
					<stop offset="0%" stopColor="#ffeecc" stopOpacity="1" />
					<stop offset="40%" stopColor="#ffaa66" stopOpacity="0.9" />
					<stop offset="100%" stopColor="#ff6688" stopOpacity="0.5" />
				</radialGradient>
			</defs>
			<circle cx={0} cy={0} r={outerRadius + 10} fill={`url(#${bgGlowId})`} />
			<path
				d={notchPath.join(" ")}
				fill="rgba(255, 150, 200, 0.4)"
				stroke="#ffccee"
				strokeWidth="1.5"
			/>
			<circle
				cx={0}
				cy={0}
				r={outerRadius - 6}
				fill="none"
				stroke="rgba(255, 200, 230, 0.5)"
				strokeWidth="1"
			/>
			<path
				d={`M ${-orbOffset} 0 Q 0 ${-orbOffset * 0.5} ${orbOffset} 0`}
				fill="none"
				stroke="rgba(255, 180, 220, 0.6)"
				strokeWidth="1.5"
			/>
			<path
				d={`M ${-orbOffset} 0 Q 0 ${orbOffset * 0.5} ${orbOffset} 0`}
				fill="none"
				stroke="rgba(255, 180, 220, 0.6)"
				strokeWidth="1.5"
			/>
			<path
				d={`M 0 ${-orbOffset} Q ${-orbOffset * 0.5} 0 0 ${orbOffset}`}
				fill="none"
				stroke="rgba(255, 180, 220, 0.6)"
				strokeWidth="1.5"
			/>
			<path
				d={`M 0 ${-orbOffset} Q ${orbOffset * 0.5} 0 0 ${orbOffset}`}
				fill="none"
				stroke="rgba(255, 180, 220, 0.6)"
				strokeWidth="1.5"
			/>
			{orbPositions.map((pos) => (
				<g key={`${pos.x}-${pos.y}`}>
					<circle
						cx={pos.x}
						cy={pos.y}
						r={orbRadius + 3}
						fill={`url(#${orbGlowId})`}
					/>
					<circle
						cx={pos.x}
						cy={pos.y}
						r={orbRadius}
						fill="rgba(255, 220, 180, 0.8)"
						stroke="#ffcc88"
						strokeWidth="1"
					/>
					<circle cx={pos.x} cy={pos.y} r={orbRadius * 0.4} fill="#ff9988" />
				</g>
			))}
		</g>
	);
}
