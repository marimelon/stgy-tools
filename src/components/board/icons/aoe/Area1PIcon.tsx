/**
 * 1人用エリアアイコン
 */

import { useId } from "react";
import type { IconProps } from "../types";

export function Area1PIcon({ transform }: IconProps) {
	const id = useId();
	const bgAuraId = `area1pBgAura-${id}`;
	const centerGradientId = `area1pCenterGrad-${id}`;

	const outerRadius = 32;
	const centerRadius = 10;
	const spikeCount = 16;

	const spikes = [];
	for (let i = 0; i < spikeCount; i++) {
		const angle = (i * 360) / spikeCount;
		spikes.push(
			<path
				key={i}
				d="M0 -31 L-1.5 -34 L1.5 -34 Z"
				fill="#ffffff"
				transform={`rotate(${angle})`}
			/>,
		);
	}

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={bgAuraId} cx="50%" cy="50%" r="50%">
					<stop offset="50%" stopColor="#ff99dd" stopOpacity="0.4" />
					<stop offset="100%" stopColor="#ff99dd" stopOpacity="0" />
				</radialGradient>
				<radialGradient id={centerGradientId} cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor="#ffeeb0" stopOpacity="1" />
					<stop offset="40%" stopColor="#ffaa80" stopOpacity="1" />
					<stop offset="100%" stopColor="#ff66cc" stopOpacity="1" />
				</radialGradient>
			</defs>
			<circle cx={0} cy={0} r={outerRadius + 6} fill={`url(#${bgAuraId})`} />
			<circle
				cx={0}
				cy={0}
				r={outerRadius}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1"
			/>
			<circle
				cx={0}
				cy={0}
				r={outerRadius}
				fill="none"
				stroke="#ffccff"
				strokeWidth="2"
				opacity="0.5"
			/>
			<g>{spikes}</g>
			<circle
				cx={0}
				cy={0}
				r={centerRadius + 2}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle
				cx={0}
				cy={0}
				r={centerRadius}
				fill={`url(#${centerGradientId})`}
			/>
		</g>
	);
}
