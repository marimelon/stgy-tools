import { useId } from "react";
import type { IconProps } from "../types";

export function KnockbackRadialIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `kbRadialGlow-${id}`;

	const chevronShape = "M 0 -20 L 22 0 L 22 12 L 0 -8 L -22 12 L -22 0 Z";
	const baseScale = 256 / 500;

	return (
		<g transform={transform}>
			<rect x={-128} y={-128} width={256} height={256} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur
						in="SourceGraphic"
						stdDeviation={12 * baseScale}
						result="blur"
					/>
				</filter>
			</defs>

			<g transform={`scale(${baseScale})`}>
				<g filter={`url(#${glowId})`}>
					{[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
						<g key={`bg-${angle}`} transform={`rotate(${angle})`}>
							<g transform="translate(0, -60) scale(0.6)">
								<path
									d={chevronShape}
									stroke="#FF7F00"
									strokeWidth="25"
									fill="#FF7F00"
									strokeLinejoin="round"
								/>
							</g>
							<g transform="translate(0, -110) scale(0.8)">
								<path
									d={chevronShape}
									stroke="#FF7F00"
									strokeWidth="25"
									fill="#FF7F00"
									strokeLinejoin="round"
								/>
							</g>
							<g transform="translate(0, -170) scale(1.0)">
								<path
									d={chevronShape}
									stroke="#FF7F00"
									strokeWidth="25"
									fill="#FF7F00"
									strokeLinejoin="round"
								/>
							</g>
						</g>
					))}
					<circle cx={0} cy={0} r={60} fill="#FF7F00" />
				</g>

				{[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
					<g key={`fg-${angle}`} transform={`rotate(${angle})`}>
						<g transform="translate(0, -60) scale(0.6)">
							<path
								d={chevronShape}
								fill="#FDD875"
								transform="translate(0, 10)"
							/>
							<path d={chevronShape} fill="#FFFFFF" />
						</g>
						<g transform="translate(0, -110) scale(0.8)">
							<path
								d={chevronShape}
								fill="#FDD875"
								transform="translate(0, 10)"
							/>
							<path d={chevronShape} fill="#FFFFFF" />
						</g>
						<g transform="translate(0, -170) scale(1.0)">
							<path
								d={chevronShape}
								fill="#FDD875"
								transform="translate(0, 10)"
							/>
							<path d={chevronShape} fill="#FFFFFF" />
						</g>
					</g>
				))}

				<circle
					cx={0}
					cy={0}
					r={40}
					fill="#FFFFFF"
					filter={`url(#${glowId})`}
					opacity="0.8"
				/>
				<circle cx={0} cy={0} r={35} fill="#FFFFFF" />
			</g>
		</g>
	);
}
