import { useId } from "react";
import type { IconProps } from "../types";

export function KnockbackLineIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `kbLineGlow-${id}`;

	const chevronPath = "M 20 60 L 50 35 L 80 60 L 80 45 L 50 20 L 20 45 Z";
	const baseScale = 256 / 300;

	const renderChevronRow = (yOffset: number) => (
		<>
			<g filter={`url(#${glowId})`}>
				<path
					d={chevronPath}
					fill="#FF8C00"
					stroke="#FF8C00"
					strokeWidth="4"
					opacity="0.8"
					transform={`translate(0, ${yOffset})`}
				/>
				<path
					d={chevronPath}
					fill="#FFA726"
					transform={`translate(0, ${yOffset})`}
				/>
				<path
					d={chevronPath}
					fill="#FFF8E1"
					transform={`translate(0, ${yOffset})`}
				/>
			</g>
			<g filter={`url(#${glowId})`}>
				<path
					d={chevronPath}
					fill="#FF8C00"
					stroke="#FF8C00"
					strokeWidth="4"
					opacity="0.8"
					transform={`translate(100, ${yOffset})`}
				/>
				<path
					d={chevronPath}
					fill="#FFA726"
					transform={`translate(100, ${yOffset})`}
				/>
				<path
					d={chevronPath}
					fill="#FFF8E1"
					transform={`translate(100, ${yOffset})`}
				/>
			</g>
			<g filter={`url(#${glowId})`}>
				<path
					d={chevronPath}
					fill="#FF8C00"
					stroke="#FF8C00"
					strokeWidth="4"
					opacity="0.8"
					transform={`translate(200, ${yOffset})`}
				/>
				<path
					d={chevronPath}
					fill="#FFA726"
					transform={`translate(200, ${yOffset})`}
				/>
				<path
					d={chevronPath}
					fill="#FFF8E1"
					transform={`translate(200, ${yOffset})`}
				/>
			</g>
		</>
	);

	return (
		<g transform={transform}>
			<rect x={-128} y={-128} width={256} height={256} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation={6 * baseScale} result="coloredBlur" />
					<feMerge>
						<feMergeNode in="coloredBlur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<g transform={`scale(${baseScale}) translate(-150, -200)`}>
				<g transform="translate(0, 20)">
					{renderChevronRow(0)}
					{renderChevronRow(90)}
					{renderChevronRow(180)}
					{renderChevronRow(270)}
				</g>
			</g>
		</g>
	);
}
