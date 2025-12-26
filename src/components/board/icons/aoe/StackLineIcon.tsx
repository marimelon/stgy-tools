/**
 * 頭割りダメージ攻撃：直線型アイコン
 */

import { useId } from "react";
import type { IconProps } from "../types";

export function StackLineIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `stackLineGlow-${id}`;

	const chevronPath = "M0 0 L40 40 L0 80 L25 80 L65 40 L25 0 Z";
	const baseScale = 60 / 500;

	return (
		<g transform={transform}>
			<rect x={-30} y={-30} width={60} height={60} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur
						in="SourceAlpha"
						stdDeviation={8 * baseScale}
						result="blur"
					/>
					<feFlood floodColor="#FF3D00" result="color" />
					<feComposite in="color" in2="blur" operator="in" result="glow" />
					<feMerge>
						<feMergeNode in="glow" />
						<feMergeNode in="glow" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<g
				transform={`scale(${baseScale}) translate(-250, -250)`}
				filter={`url(#${glowId})`}
			>
				<g transform="translate(60, 50)">
					<g>
						<path d={chevronPath} fill="#FFD54F" x="0" y="0" />
						<path d={chevronPath} fill="#FFFFFF" transform="translate(35, 0)" />
					</g>
					<g transform="translate(0, 130)">
						<path d={chevronPath} fill="#FFD54F" />
						<path d={chevronPath} fill="#FFFFFF" transform="translate(35, 0)" />
					</g>
					<g transform="translate(0, 260)">
						<path d={chevronPath} fill="#FFD54F" />
						<path d={chevronPath} fill="#FFFFFF" transform="translate(35, 0)" />
					</g>
				</g>

				<g transform="translate(440, 50) scale(-1, 1)">
					<g>
						<path d={chevronPath} fill="#FFD54F" />
						<path d={chevronPath} fill="#FFFFFF" transform="translate(35, 0)" />
					</g>
					<g transform="translate(0, 130)">
						<path d={chevronPath} fill="#FFD54F" />
						<path d={chevronPath} fill="#FFFFFF" transform="translate(35, 0)" />
					</g>
					<g transform="translate(0, 260)">
						<path d={chevronPath} fill="#FFD54F" />
						<path d={chevronPath} fill="#FFFFFF" transform="translate(35, 0)" />
					</g>
				</g>

				<g transform="translate(250, 230)">
					<g transform="rotate(90) scale(0.6) translate(-50, -40)">
						<path d={chevronPath} fill="#FFD54F" />
						<path d={chevronPath} fill="#FFFFFF" transform="translate(35, 0)" />
					</g>
				</g>
			</g>
		</g>
	);
}
