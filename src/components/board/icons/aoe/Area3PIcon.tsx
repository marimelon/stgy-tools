/**
 * 3人用エリアアイコン
 */

import { useId } from "react";
import type { IconProps } from "../types";

export function Area3PIcon({ transform }: IconProps) {
	const id = useId();
	const bgAuraId = `area3pBgAura-${id}`;
	const eyeGradientId = `area3pEyeGrad-${id}`;

	const outerRadius = 32;
	const eyeRadius = 10;
	const eyeSpacing = 22;
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
				<radialGradient id={bgAuraId} cx="50%" cy="50%" r="60%">
					<stop offset="40%" stopColor="#ff99dd" stopOpacity="0.3" />
					<stop offset="100%" stopColor="#ff99dd" stopOpacity="0" />
				</radialGradient>
				<radialGradient id={eyeGradientId} cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor="#ffeeb0" stopOpacity="1" />
					<stop offset="50%" stopColor="#ffaa80" stopOpacity="1" />
					<stop offset="100%" stopColor="#ff66cc" stopOpacity="1" />
				</radialGradient>
			</defs>
			<circle cx={0} cy={0} r={outerRadius + 8} fill={`url(#${bgAuraId})`} />
			<circle
				cx={0}
				cy={0}
				r={outerRadius}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1"
			/>
			<g>{spikes}</g>
			<g fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round">
				<path d="M-34 -10 Q-24 -20 -14 -10 Q0 -20 14 -10 Q24 -20 34 -10" />
				<path
					d="M-34 -7 Q-24 -17 -14 -7 Q0 -17 14 -7 Q24 -17 34 -7"
					opacity="0.6"
					strokeWidth="0.6"
				/>
				<path d="M-34 10 Q-24 20 -14 10 Q0 20 14 10 Q24 20 34 10" />
				<path
					d="M-34 7 Q-24 17 -14 7 Q0 17 14 7 Q24 17 34 7"
					opacity="0.6"
					strokeWidth="0.6"
				/>
			</g>
			<circle
				cx={-eyeSpacing}
				cy={0}
				r={eyeRadius + 1.5}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle
				cx={-eyeSpacing}
				cy={0}
				r={eyeRadius}
				fill={`url(#${eyeGradientId})`}
			/>
			<circle
				cx={0}
				cy={0}
				r={eyeRadius + 1.5}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle cx={0} cy={0} r={eyeRadius} fill={`url(#${eyeGradientId})`} />
			<circle
				cx={eyeSpacing}
				cy={0}
				r={eyeRadius + 1.5}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle
				cx={eyeSpacing}
				cy={0}
				r={eyeRadius}
				fill={`url(#${eyeGradientId})`}
			/>
		</g>
	);
}
