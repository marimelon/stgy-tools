import { useId } from "react";
import type { IconProps } from "../types";

export function CircleAoEMovingIcon({ transform }: IconProps) {
	const id = useId();
	const outerGlowId = `circleMovingOuterGlow-${id}`;
	const innerButtonId = `circleMovingInnerButton-${id}`;
	const glowBlurId = `circleMovingGlowBlur-${id}`;

	const chevronPath = "M 140 0 L 200 45 L 260 0";
	const baseScale = 134 / 400;

	return (
		<g transform={transform}>
			<rect x={-67} y={-67} width={134} height={134} fill="transparent" />
			<defs>
				<radialGradient
					id={outerGlowId}
					cx="50%"
					cy="50%"
					r="50%"
					fx="50%"
					fy="50%"
				>
					<stop offset="60%" stopColor="#ff6b6b" stopOpacity="0.7" />
					<stop offset="92%" stopColor="#ff8a8a" stopOpacity="0.5" />
					<stop offset="100%" stopColor="#ffcccc" stopOpacity="0.3" />
				</radialGradient>
				<radialGradient
					id={innerButtonId}
					cx="50%"
					cy="40%"
					r="50%"
					fx="50%"
					fy="40%"
				>
					<stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
					<stop offset="40%" stopColor="#ffe0b2" stopOpacity="1" />
					<stop offset="100%" stopColor="#ffcc80" stopOpacity="1" />
				</radialGradient>
				<filter id={glowBlurId} x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur in="SourceGraphic" stdDeviation="2" />
				</filter>
			</defs>

			<g transform={`scale(${baseScale}) translate(-200, -200)`}>
				<circle
					cx={200}
					cy={200}
					r={190}
					fill={`url(#${outerGlowId})`}
					stroke="#ffb3b3"
					strokeWidth="3"
				/>
				<circle
					cx={200}
					cy={200}
					r={100}
					fill={`url(#${innerButtonId})`}
					stroke="#ff8a65"
					strokeWidth="2"
				/>

				<g transform="translate(0, 140)">
					<g
						stroke="#ff3333"
						strokeWidth="26"
						filter={`url(#${glowBlurId})`}
						opacity="0.8"
						fill="none"
						strokeLinecap="butt"
						strokeLinejoin="miter"
					>
						<path d={chevronPath} transform="translate(0, 0)" />
						<path d={chevronPath} transform="translate(0, 45)" />
						<path d={chevronPath} transform="translate(0, 90)" />
					</g>
					<g
						fill="none"
						strokeWidth="14"
						strokeLinecap="butt"
						strokeLinejoin="miter"
					>
						<path
							d={chevronPath}
							stroke="#ffa000"
							transform="translate(0, 0)"
						/>
						<path
							d={chevronPath}
							stroke="#fdd835"
							transform="translate(0, 45)"
						/>
						<path
							d={chevronPath}
							stroke="#ffffff"
							transform="translate(0, 90)"
						/>
					</g>
				</g>
			</g>
		</g>
	);
}
