import { useId } from "react";
import type { IconProps } from "../types";

export function BlockIcon({ transform }: IconProps) {
	const id = useId();
	const outerGradientId = `blockOuter-${id}`;
	const innerGradientId = `blockInner-${id}`;
	const centerGlowId = `blockCenterGlow-${id}`;

	const outerRadius = 28;
	const innerRadius = 22;
	const centerRadius = 8;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={outerGradientId}>
					<stop offset="0%" stopColor="#f5e6d3" stopOpacity="1" />
					<stop offset="70%" stopColor="#c8a080" stopOpacity="1" />
					<stop offset="100%" stopColor="#8b5a2b" stopOpacity="1" />
				</radialGradient>
				<radialGradient id={innerGradientId}>
					<stop offset="0%" stopColor="#fff8f0" stopOpacity="1" />
					<stop offset="60%" stopColor="#fff" stopOpacity="1" />
					<stop offset="100%" stopColor="#e8d8c8" stopOpacity="1" />
				</radialGradient>
				<radialGradient id={centerGlowId}>
					<stop offset="0%" stopColor="#fff" stopOpacity="1" />
					<stop offset="30%" stopColor="#ffee88" stopOpacity="1" />
					<stop offset="60%" stopColor="#ffaa44" stopOpacity="0.8" />
					<stop offset="100%" stopColor="#ff8800" stopOpacity="0" />
				</radialGradient>
			</defs>
			<circle
				cx={0}
				cy={0}
				r={outerRadius}
				fill={`url(#${outerGradientId})`}
				stroke="#6b3a1a"
				strokeWidth="2"
			/>
			<circle cx={0} cy={0} r={innerRadius} fill={`url(#${innerGradientId})`} />
			<circle
				cx={0}
				cy={0}
				r={centerRadius + 8}
				fill={`url(#${centerGlowId})`}
			/>
			<circle
				cx={0}
				cy={0}
				r={centerRadius}
				fill="#fffef8"
				stroke="#ff9944"
				strokeWidth="1.5"
			/>
		</g>
	);
}
