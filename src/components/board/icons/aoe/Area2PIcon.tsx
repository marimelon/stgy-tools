import { useId } from "react";
import type { IconProps } from "../types";

export function Area2PIcon({ transform }: IconProps) {
	const id = useId();
	const bgAuraId = `area2pBgAura-${id}`;
	const eyeGradientId = `area2pEyeGrad-${id}`;
	const bridgeGradientId = `area2pBridgeGrad-${id}`;

	const outerRadius = 32;
	const eyeRadius = 10;
	const eyeOffset = 18;
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
				<linearGradient
					id={bridgeGradientId}
					x1="0%"
					y1="50%"
					x2="100%"
					y2="50%"
				>
					<stop offset="0%" stopColor="#ff66cc" stopOpacity="1" />
					<stop offset="50%" stopColor="#ffeeb0" stopOpacity="1" />
					<stop offset="100%" stopColor="#ff66cc" stopOpacity="1" />
				</linearGradient>
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
				<path d="M-30 -13 L-25 -13 Q-20 -13 -17 -16 Q-14 -19 -10 -19 L10 -19 Q14 -19 17 -16 Q20 -13 25 -13 L30 -13" />
				<path
					d="M-30 -10 L-24 -10 Q-20 -10 -17 -12 Q-14 -14 -10 -14 L10 -14 Q14 -14 17 -12 Q20 -10 24 -10 L30 -10"
					opacity="0.7"
				/>
				<path d="M-30 13 L-25 13 Q-20 13 -17 16 Q-14 19 -10 19 L10 19 Q14 19 17 16 Q20 13 25 13 L30 13" />
				<path
					d="M-30 10 L-24 10 Q-20 10 -17 12 Q-14 14 -10 14 L10 14 Q14 14 17 12 Q20 10 24 10 L30 10"
					opacity="0.7"
				/>
			</g>
			<rect
				x={-10}
				y={-3}
				width={20}
				height={6}
				rx={1}
				ry={1}
				fill={`url(#${bridgeGradientId})`}
				stroke="#ffffff"
				strokeWidth="0.8"
			/>
			<circle
				cx={-eyeOffset}
				cy={0}
				r={eyeRadius + 1.5}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle
				cx={-eyeOffset}
				cy={0}
				r={eyeRadius}
				fill={`url(#${eyeGradientId})`}
			/>
			<circle
				cx={eyeOffset}
				cy={0}
				r={eyeRadius + 1.5}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle
				cx={eyeOffset}
				cy={0}
				r={eyeRadius}
				fill={`url(#${eyeGradientId})`}
			/>
		</g>
	);
}
