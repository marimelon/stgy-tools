/**
 * 攻撃範囲（AoE）関連のアイコンコンポーネント
 */

import { useId } from "react";
import type { IconProps } from "./types";

/** 視線攻撃アイコン */
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

/** 受け止め攻撃（ブロック）アイコン */
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
			<circle cx={0} cy={0} r={centerRadius + 8} fill={`url(#${centerGlowId})`} />
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

/** 頭割りダメージ攻撃アイコン */
export function StackIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `stackGlow-${id}`;

	const chevronPath = "M-50 -25 L0 25 L50 -25 L50 -5 L0 45 L-50 -5 Z";
	const centerPiecePath = "M-20 -15 L0 5 L20 -15 L20 -5 L0 15 L-20 -5 Z";
	const baseScale = 48 / 500;

	return (
		<g transform={transform}>
			<rect x={-24} y={-24} width={48} height={48} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation={12 * baseScale} result="blur" />
					<feFlood floodColor="#ff4800" result="color" />
					<feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
					<feMerge>
						<feMergeNode in="coloredBlur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<g transform={`scale(${baseScale})`}>
				<g fill="#ff4800" opacity="0.8" filter={`url(#${glowId})`}>
					<use href={`#stackChevron-${id}`} transform="translate(0, -110)" />
					<use href={`#stackChevron-${id}`} transform="translate(0, -70)" />
					<use href={`#stackChevron-${id}`} transform="rotate(180) translate(0, -110)" />
					<use href={`#stackChevron-${id}`} transform="rotate(180) translate(0, -70)" />
					<use href={`#stackChevron-${id}`} transform="rotate(90) translate(0, -110)" />
					<use href={`#stackChevron-${id}`} transform="rotate(90) translate(0, -70)" />
					<use href={`#stackChevron-${id}`} transform="rotate(-90) translate(0, -110)" />
					<use href={`#stackChevron-${id}`} transform="rotate(-90) translate(0, -70)" />
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
					<path d={centerPiecePath} fill="#fedc57" transform="translate(0, -10)" />
					<path d={centerPiecePath} fill="#fedc57" transform="translate(0, 10)" />
				</g>
			</g>
		</g>
	);
}

/** 頭割りダメージ攻撃：直線型アイコン */
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
					<feGaussianBlur in="SourceAlpha" stdDeviation={8 * baseScale} result="blur" />
					<feFlood floodColor="#FF3D00" result="color" />
					<feComposite in="color" in2="blur" operator="in" result="glow" />
					<feMerge>
						<feMergeNode in="glow" />
						<feMergeNode in="glow" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<g transform={`scale(${baseScale}) translate(-250, -250)`} filter={`url(#${glowId})`}>
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

/** 頭割りダメージ攻撃：連続型アイコン */
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
					<feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
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
					<path d={centerPiecePath} fill="#fedc57" transform="translate(0, -10)" />
					<path d={centerPiecePath} fill="#fedc57" transform="translate(0, 10)" />
				</g>
			</g>
		</g>
	);
}

/** ノックバック攻撃：放射型アイコン */
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
					<feGaussianBlur in="SourceGraphic" stdDeviation={12 * baseScale} result="blur" />
				</filter>
			</defs>

			<g transform={`scale(${baseScale})`}>
				<g filter={`url(#${glowId})`}>
					{[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
						<g key={`bg-${angle}`} transform={`rotate(${angle})`}>
							<g transform="translate(0, -60) scale(0.6)">
								<path d={chevronShape} stroke="#FF7F00" strokeWidth="25" fill="#FF7F00" strokeLinejoin="round" />
							</g>
							<g transform="translate(0, -110) scale(0.8)">
								<path d={chevronShape} stroke="#FF7F00" strokeWidth="25" fill="#FF7F00" strokeLinejoin="round" />
							</g>
							<g transform="translate(0, -170) scale(1.0)">
								<path d={chevronShape} stroke="#FF7F00" strokeWidth="25" fill="#FF7F00" strokeLinejoin="round" />
							</g>
						</g>
					))}
					<circle cx={0} cy={0} r={60} fill="#FF7F00" />
				</g>

				{[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
					<g key={`fg-${angle}`} transform={`rotate(${angle})`}>
						<g transform="translate(0, -60) scale(0.6)">
							<path d={chevronShape} fill="#FDD875" transform="translate(0, 10)" />
							<path d={chevronShape} fill="#FFFFFF" />
						</g>
						<g transform="translate(0, -110) scale(0.8)">
							<path d={chevronShape} fill="#FDD875" transform="translate(0, 10)" />
							<path d={chevronShape} fill="#FFFFFF" />
						</g>
						<g transform="translate(0, -170) scale(1.0)">
							<path d={chevronShape} fill="#FDD875" transform="translate(0, 10)" />
							<path d={chevronShape} fill="#FFFFFF" />
						</g>
					</g>
				))}

				<circle cx={0} cy={0} r={40} fill="#FFFFFF" filter={`url(#${glowId})`} opacity="0.8" />
				<circle cx={0} cy={0} r={35} fill="#FFFFFF" />
			</g>
		</g>
	);
}

/** ノックバック攻撃：直線型アイコン */
export function KnockbackLineIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `kbLineGlow-${id}`;

	const chevronPath = "M 20 60 L 50 35 L 80 60 L 80 45 L 50 20 L 20 45 Z";
	const baseScale = 256 / 300;

	const renderChevronRow = (yOffset: number) => (
		<>
			<g filter={`url(#${glowId})`}>
				<path d={chevronPath} fill="#FF8C00" stroke="#FF8C00" strokeWidth="4" opacity="0.8" transform={`translate(0, ${yOffset})`} />
				<path d={chevronPath} fill="#FFA726" transform={`translate(0, ${yOffset})`} />
				<path d={chevronPath} fill="#FFF8E1" transform={`translate(0, ${yOffset})`} />
			</g>
			<g filter={`url(#${glowId})`}>
				<path d={chevronPath} fill="#FF8C00" stroke="#FF8C00" strokeWidth="4" opacity="0.8" transform={`translate(100, ${yOffset})`} />
				<path d={chevronPath} fill="#FFA726" transform={`translate(100, ${yOffset})`} />
				<path d={chevronPath} fill="#FFF8E1" transform={`translate(100, ${yOffset})`} />
			</g>
			<g filter={`url(#${glowId})`}>
				<path d={chevronPath} fill="#FF8C00" stroke="#FF8C00" strokeWidth="4" opacity="0.8" transform={`translate(200, ${yOffset})`} />
				<path d={chevronPath} fill="#FFA726" transform={`translate(200, ${yOffset})`} />
				<path d={chevronPath} fill="#FFF8E1" transform={`translate(200, ${yOffset})`} />
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

/** 1人用エリアアイコン */
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
			<path key={i} d="M0 -31 L-1.5 -34 L1.5 -34 Z" fill="#ffffff" transform={`rotate(${angle})`} />,
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
			<circle cx={0} cy={0} r={outerRadius} fill="none" stroke="#ffffff" strokeWidth="1" />
			<circle cx={0} cy={0} r={outerRadius} fill="none" stroke="#ffccff" strokeWidth="2" opacity="0.5" />
			<g>{spikes}</g>
			<circle cx={0} cy={0} r={centerRadius + 2} fill="none" stroke="#ffffff" strokeWidth="1.5" />
			<circle cx={0} cy={0} r={centerRadius} fill={`url(#${centerGradientId})`} />
		</g>
	);
}

/** 2人用エリアアイコン */
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
			<path key={i} d="M0 -31 L-1.5 -34 L1.5 -34 Z" fill="#ffffff" transform={`rotate(${angle})`} />,
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
				<linearGradient id={bridgeGradientId} x1="0%" y1="50%" x2="100%" y2="50%">
					<stop offset="0%" stopColor="#ff66cc" stopOpacity="1" />
					<stop offset="50%" stopColor="#ffeeb0" stopOpacity="1" />
					<stop offset="100%" stopColor="#ff66cc" stopOpacity="1" />
				</linearGradient>
			</defs>
			<circle cx={0} cy={0} r={outerRadius + 8} fill={`url(#${bgAuraId})`} />
			<circle cx={0} cy={0} r={outerRadius} fill="none" stroke="#ffffff" strokeWidth="1" />
			<g>{spikes}</g>
			<g fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round">
				<path d="M-30 -13 L-25 -13 Q-20 -13 -17 -16 Q-14 -19 -10 -19 L10 -19 Q14 -19 17 -16 Q20 -13 25 -13 L30 -13" />
				<path d="M-30 -10 L-24 -10 Q-20 -10 -17 -12 Q-14 -14 -10 -14 L10 -14 Q14 -14 17 -12 Q20 -10 24 -10 L30 -10" opacity="0.7" />
				<path d="M-30 13 L-25 13 Q-20 13 -17 16 Q-14 19 -10 19 L10 19 Q14 19 17 16 Q20 13 25 13 L30 13" />
				<path d="M-30 10 L-24 10 Q-20 10 -17 12 Q-14 14 -10 14 L10 14 Q14 14 17 12 Q20 10 24 10 L30 10" opacity="0.7" />
			</g>
			<rect x={-10} y={-3} width={20} height={6} rx={1} ry={1} fill={`url(#${bridgeGradientId})`} stroke="#ffffff" strokeWidth="0.8" />
			<circle cx={-eyeOffset} cy={0} r={eyeRadius + 1.5} fill="none" stroke="#ffffff" strokeWidth="1.5" />
			<circle cx={-eyeOffset} cy={0} r={eyeRadius} fill={`url(#${eyeGradientId})`} />
			<circle cx={eyeOffset} cy={0} r={eyeRadius + 1.5} fill="none" stroke="#ffffff" strokeWidth="1.5" />
			<circle cx={eyeOffset} cy={0} r={eyeRadius} fill={`url(#${eyeGradientId})`} />
		</g>
	);
}

/** 3人用エリアアイコン */
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
			<path key={i} d="M0 -31 L-1.5 -34 L1.5 -34 Z" fill="#ffffff" transform={`rotate(${angle})`} />,
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
			<circle cx={0} cy={0} r={outerRadius} fill="none" stroke="#ffffff" strokeWidth="1" />
			<g>{spikes}</g>
			<g fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round">
				<path d="M-34 -10 Q-24 -20 -14 -10 Q0 -20 14 -10 Q24 -20 34 -10" />
				<path d="M-34 -7 Q-24 -17 -14 -7 Q0 -17 14 -7 Q24 -17 34 -7" opacity="0.6" strokeWidth="0.6" />
				<path d="M-34 10 Q-24 20 -14 10 Q0 20 14 10 Q24 20 34 10" />
				<path d="M-34 7 Q-24 17 -14 7 Q0 17 14 7 Q24 17 34 7" opacity="0.6" strokeWidth="0.6" />
			</g>
			<circle cx={-eyeSpacing} cy={0} r={eyeRadius + 1.5} fill="none" stroke="#ffffff" strokeWidth="1.5" />
			<circle cx={-eyeSpacing} cy={0} r={eyeRadius} fill={`url(#${eyeGradientId})`} />
			<circle cx={0} cy={0} r={eyeRadius + 1.5} fill="none" stroke="#ffffff" strokeWidth="1.5" />
			<circle cx={0} cy={0} r={eyeRadius} fill={`url(#${eyeGradientId})`} />
			<circle cx={eyeSpacing} cy={0} r={eyeRadius + 1.5} fill="none" stroke="#ffffff" strokeWidth="1.5" />
			<circle cx={eyeSpacing} cy={0} r={eyeRadius} fill={`url(#${eyeGradientId})`} />
		</g>
	);
}

/** 4人用エリアアイコン */
export function Area4PIcon({ transform }: IconProps) {
	const id = useId();
	const bgGlowId = `area4pGlow-${id}`;
	const orbGlowId = `area4pOrbGlow-${id}`;

	const outerRadius = 32;
	const orbRadius = 8;
	const orbOffset = 12;
	const notchCount = 16;

	const notchPath = [];
	for (let i = 0; i < notchCount; i++) {
		const angle1 = (i * 360) / notchCount;
		const angle2 = ((i + 0.5) * 360) / notchCount;
		const rad1 = (angle1 * Math.PI) / 180;
		const rad2 = (angle2 * Math.PI) / 180;
		const r1 = outerRadius;
		const r2 = outerRadius - 4;
		const x1 = Math.cos(rad1) * r1;
		const y1 = Math.sin(rad1) * r1;
		const x2 = Math.cos(rad2) * r2;
		const y2 = Math.sin(rad2) * r2;
		if (i === 0) {
			notchPath.push(`M ${x1} ${y1}`);
		} else {
			notchPath.push(`L ${x1} ${y1}`);
		}
		notchPath.push(`L ${x2} ${y2}`);
	}
	notchPath.push("Z");

	const orbPositions = [
		{ x: -orbOffset, y: -orbOffset },
		{ x: orbOffset, y: -orbOffset },
		{ x: -orbOffset, y: orbOffset },
		{ x: orbOffset, y: orbOffset },
	];

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={bgGlowId}>
					<stop offset="0%" stopColor="#ff88cc" stopOpacity="0.6" />
					<stop offset="70%" stopColor="#ff66aa" stopOpacity="0.3" />
					<stop offset="100%" stopColor="#ff66aa" stopOpacity="0" />
				</radialGradient>
				<radialGradient id={orbGlowId}>
					<stop offset="0%" stopColor="#ffeecc" stopOpacity="1" />
					<stop offset="40%" stopColor="#ffaa66" stopOpacity="0.9" />
					<stop offset="100%" stopColor="#ff6688" stopOpacity="0.5" />
				</radialGradient>
			</defs>
			<circle cx={0} cy={0} r={outerRadius + 10} fill={`url(#${bgGlowId})`} />
			<path d={notchPath.join(" ")} fill="rgba(255, 150, 200, 0.4)" stroke="#ffccee" strokeWidth="1.5" />
			<circle cx={0} cy={0} r={outerRadius - 6} fill="none" stroke="rgba(255, 200, 230, 0.5)" strokeWidth="1" />
			<path d={`M ${-orbOffset} 0 Q 0 ${-orbOffset * 0.5} ${orbOffset} 0`} fill="none" stroke="rgba(255, 180, 220, 0.6)" strokeWidth="1.5" />
			<path d={`M ${-orbOffset} 0 Q 0 ${orbOffset * 0.5} ${orbOffset} 0`} fill="none" stroke="rgba(255, 180, 220, 0.6)" strokeWidth="1.5" />
			<path d={`M 0 ${-orbOffset} Q ${-orbOffset * 0.5} 0 0 ${orbOffset}`} fill="none" stroke="rgba(255, 180, 220, 0.6)" strokeWidth="1.5" />
			<path d={`M 0 ${-orbOffset} Q ${orbOffset * 0.5} 0 0 ${orbOffset}`} fill="none" stroke="rgba(255, 180, 220, 0.6)" strokeWidth="1.5" />
			{orbPositions.map((pos) => (
				<g key={`${pos.x}-${pos.y}`}>
					<circle cx={pos.x} cy={pos.y} r={orbRadius + 3} fill={`url(#${orbGlowId})`} />
					<circle cx={pos.x} cy={pos.y} r={orbRadius} fill="rgba(255, 220, 180, 0.8)" stroke="#ffcc88" strokeWidth="1" />
					<circle cx={pos.x} cy={pos.y} r={orbRadius * 0.4} fill="#ff9988" />
				</g>
			))}
		</g>
	);
}

/** 円形範囲攻撃：移動型アイコン */
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
				<radialGradient id={outerGlowId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
					<stop offset="60%" stopColor="#ff6b6b" stopOpacity="0.7" />
					<stop offset="92%" stopColor="#ff8a8a" stopOpacity="0.5" />
					<stop offset="100%" stopColor="#ffcccc" stopOpacity="0.3" />
				</radialGradient>
				<radialGradient id={innerButtonId} cx="50%" cy="40%" r="50%" fx="50%" fy="40%">
					<stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
					<stop offset="40%" stopColor="#ffe0b2" stopOpacity="1" />
					<stop offset="100%" stopColor="#ffcc80" stopOpacity="1" />
				</radialGradient>
				<filter id={glowBlurId} x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur in="SourceGraphic" stdDeviation="2" />
				</filter>
			</defs>

			<g transform={`scale(${baseScale}) translate(-200, -200)`}>
				<circle cx={200} cy={200} r={190} fill={`url(#${outerGlowId})`} stroke="#ffb3b3" strokeWidth="3" />
				<circle cx={200} cy={200} r={100} fill={`url(#${innerButtonId})`} stroke="#ff8a65" strokeWidth="2" />

				<g transform="translate(0, 140)">
					<g stroke="#ff3333" strokeWidth="26" filter={`url(#${glowBlurId})`} opacity="0.8" fill="none" strokeLinecap="butt" strokeLinejoin="miter">
						<path d={chevronPath} transform="translate(0, 0)" />
						<path d={chevronPath} transform="translate(0, 45)" />
						<path d={chevronPath} transform="translate(0, 90)" />
					</g>
					<g fill="none" strokeWidth="14" strokeLinecap="butt" strokeLinejoin="miter">
						<path d={chevronPath} stroke="#ffa000" transform="translate(0, 0)" />
						<path d={chevronPath} stroke="#fdd835" transform="translate(0, 45)" />
						<path d={chevronPath} stroke="#ffffff" transform="translate(0, 90)" />
					</g>
				</g>
			</g>
		</g>
	);
}

