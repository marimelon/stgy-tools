/**
 * 頭割りダメージ攻撃：連続型アイコン
 */

import { useId } from "react";
import type { IconProps } from "../types";

export function StackChainIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `stackChainGlow-${id}`;

	const chevronPath = "M-50 -25 L0 25 L50 -25 L50 -5 L0 45 L-50 -5 Z";
	const centerPiecePath = "M-20 -15 L0 5 L20 -15 L20 -5 L0 15 L-20 -5 Z";
	const baseScale = 134 / 500;

	return (
		<g transform={transform}>
			<rect x={-67} y={-67} width={134} height={134} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation={12 * baseScale} result="blur" />
					<feFlood floodColor="#ff4800" result="color" />
					<feComposite
						in="color"
						in2="blur"
						operator="in"
						result="coloredBlur"
					/>
					<feMerge>
						<feMergeNode in="coloredBlur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<g transform={`scale(${baseScale})`}>
				<circle r={185} fill="none" stroke="#e6e6e6" strokeWidth="35" />
				<circle r={115} fill="none" stroke="#e6e6e6" strokeWidth="35" />

				<g fill="#ff4800" opacity="0.8" filter={`url(#${glowId})`}>
					<circle r={132} fill="none" stroke="#ff4800" strokeWidth="8" />
					<path d={chevronPath} transform="translate(0, -110)" />
					<path d={chevronPath} transform="translate(0, -70)" />
					<path d={chevronPath} transform="rotate(180) translate(0, -110)" />
					<path d={chevronPath} transform="rotate(180) translate(0, -70)" />
					<path d={chevronPath} transform="rotate(90) translate(0, -110)" />
					<path d={chevronPath} transform="rotate(90) translate(0, -70)" />
					<path d={chevronPath} transform="rotate(-90) translate(0, -110)" />
					<path d={chevronPath} transform="rotate(-90) translate(0, -70)" />
					<path d={centerPiecePath} transform="translate(0, -10) scale(1.2)" />
					<path d={centerPiecePath} transform="translate(0, 10) scale(1.2)" />
				</g>

				<g>
					<path d={chevronPath} fill="#fedc57" transform="translate(0, -110)" />
					<path d={chevronPath} fill="#ffffff" transform="translate(0, -70)" />
				</g>
				<g transform="rotate(180)">
					<path d={chevronPath} fill="#fedc57" transform="translate(0, -110)" />
					<path d={chevronPath} fill="#ffffff" transform="translate(0, -70)" />
				</g>
				<g transform="rotate(90)">
					<path d={chevronPath} fill="#fedc57" transform="translate(0, -110)" />
					<path d={chevronPath} fill="#ffffff" transform="translate(0, -70)" />
				</g>
				<g transform="rotate(-90)">
					<path d={chevronPath} fill="#fedc57" transform="translate(0, -110)" />
					<path d={chevronPath} fill="#ffffff" transform="translate(0, -70)" />
				</g>
				<g>
					<path
						d={centerPiecePath}
						fill="#fedc57"
						transform="translate(0, -10)"
					/>
					<path
						d={centerPiecePath}
						fill="#fedc57"
						transform="translate(0, 10)"
					/>
				</g>
			</g>
		</g>
	);
}
