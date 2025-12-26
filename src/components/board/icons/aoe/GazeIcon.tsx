/**
 * 視線攻撃アイコン
 */

import { useId } from "react";
import type { IconProps } from "../types";

export function GazeIcon({ transform }: IconProps) {
	const id = useId();
	const gazeGlowId = `gazeGlow-${id}`;
	const pupilGlowId = `pupilGlow-${id}`;

	const eyeWidth = 40;
	const eyeHeight = 18;
	const pupilRadius = 6;
	const rayCount = 12;
	const rayLength = 20;
	const rayInnerRadius = 22;

	// 放射状の光線を生成
	const rays = [];
	for (let i = 0; i < rayCount; i++) {
		const angle = (i * 360) / rayCount - 90;
		const rad = (angle * Math.PI) / 180;
		const x1 = Math.cos(rad) * rayInnerRadius;
		const y1 = Math.sin(rad) * rayInnerRadius;
		const x2 = Math.cos(rad) * (rayInnerRadius + rayLength);
		const y2 = Math.sin(rad) * (rayInnerRadius + rayLength);
		rays.push(
			<line
				key={i}
				x1={x1}
				y1={y1}
				x2={x2}
				y2={y2}
				stroke="#ff66aa"
				strokeWidth="2"
				strokeLinecap="round"
			/>,
		);
	}

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={gazeGlowId}>
					<stop offset="0%" stopColor="#ff66aa" stopOpacity="0.4" />
					<stop offset="100%" stopColor="#ff66aa" stopOpacity="0" />
				</radialGradient>
				<radialGradient id={pupilGlowId}>
					<stop offset="0%" stopColor="#fff" stopOpacity="1" />
					<stop offset="50%" stopColor="#ff6600" stopOpacity="0.8" />
					<stop offset="100%" stopColor="#880000" stopOpacity="0" />
				</radialGradient>
			</defs>
			<circle cx={0} cy={0} r={45} fill={`url(#${gazeGlowId})`} />
			{rays}
			<ellipse
				cx={0}
				cy={0}
				rx={eyeWidth / 2}
				ry={eyeHeight / 2}
				fill="#440000"
				stroke="#ff4477"
				strokeWidth="2"
			/>
			<circle cx={0} cy={0} r={pupilRadius + 4} fill={`url(#${pupilGlowId})`} />
			<circle cx={0} cy={0} r={pupilRadius} fill="#fff" />
		</g>
	);
}
