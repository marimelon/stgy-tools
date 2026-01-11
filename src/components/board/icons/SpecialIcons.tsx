import { useId } from "react";
import type { IconProps } from "./types";

export function LockOnRedIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `lockOnRedGlow-${id}`;
	const markerGradId = `lockOnRedMarkerGrad-${id}`;

	const markerPath = `
		M 0 -28
		C 4 -24, 8 -18, 10 -12
		C 12 -8, 14 -2, 12 4
		C 10 8, 6 10, 4 14
		L 6 14
		C 8 14, 10 16, 10 18
		L 10 22
		C 10 24, 8 26, 6 26
		L 0 26
		L -6 26
		C -8 26, -10 24, -10 22
		L -10 18
		C -10 16, -8 14, -6 14
		L -4 14
		C -6 10, -10 8, -12 4
		C -14 -2, -12 -8, -10 -12
		C -8 -18, -4 -24, 0 -28
		Z
	`;

	const eyeY = -4;
	const eyeSpacing = 5;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#ff66aa" stopOpacity="0.6" />
					<stop offset="60%" stopColor="#ff66aa" stopOpacity="0.3" />
					<stop offset="100%" stopColor="#ff66aa" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={markerGradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#aa4422" />
					<stop offset="50%" stopColor="#cc6644" />
					<stop offset="100%" stopColor="#ffaa66" />
				</linearGradient>
			</defs>
			<ellipse cx={0} cy={28} rx={24} ry={10} fill={`url(#${glowId})`} />
			<path
				d={markerPath}
				fill={`url(#${markerGradId})`}
				stroke="#ff8844"
				strokeWidth="1.5"
			/>
			<path
				d={`M 0 -22 C 3 -18, 5 -14, 6 -10 C 7 -6, 6 -2, 4 2 L 0 4 L -4 2 C -6 -2, -7 -6, -6 -10 C -5 -14, -3 -18, 0 -22 Z`}
				fill="rgba(255, 255, 255, 0.15)"
			/>
			<circle cx={-eyeSpacing} cy={eyeY} r={3} fill="#aa4422" />
			<circle cx={eyeSpacing} cy={eyeY} r={3} fill="#aa4422" />
			<circle cx={-eyeSpacing} cy={eyeY} r={1.5} fill="#ff8844" />
			<circle cx={eyeSpacing} cy={eyeY} r={1.5} fill="#ff8844" />
		</g>
	);
}

export function LockOnBlueIcon({ transform }: IconProps) {
	const id = useId();
	const outerGlowId = `lockOnBlueOuterGlow-${id}`;
	const spikeGradId = `lockOnBlueSpikeGrad-${id}`;
	const orbGradId = `lockOnBlueOrbGrad-${id}`;

	const spikeCount = 8;
	const outerRadius = 32;
	const innerRadius = 14;
	const orbRadius = 10;

	const spikes = [];
	for (let i = 0; i < spikeCount; i++) {
		const angle = (i * 360) / spikeCount - 90;
		const nextAngle = ((i + 1) * 360) / spikeCount - 90;
		const midAngle = angle + 360 / spikeCount / 2;

		const rad = (angle * Math.PI) / 180;
		const nextRad = (nextAngle * Math.PI) / 180;
		const midRad = (midAngle * Math.PI) / 180;

		const outerX = Math.cos(midRad) * outerRadius;
		const outerY = Math.sin(midRad) * outerRadius;
		const innerX1 = Math.cos(rad) * innerRadius;
		const innerY1 = Math.sin(rad) * innerRadius;
		const innerX2 = Math.cos(nextRad) * innerRadius;
		const innerY2 = Math.sin(nextRad) * innerRadius;

		spikes.push(
			<path
				key={i}
				d={`M ${innerX1} ${innerY1} L ${outerX} ${outerY} L ${innerX2} ${innerY2} Z`}
				fill={`url(#${spikeGradId})`}
				stroke="#00ccff"
				strokeWidth="1"
			/>,
		);
	}

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={outerGlowId}>
					<stop offset="0%" stopColor="#00ffff" stopOpacity="0.4" />
					<stop offset="70%" stopColor="#0088ff" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#0044aa" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={spikeGradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#003366" />
					<stop offset="50%" stopColor="#0066aa" />
					<stop offset="100%" stopColor="#00aaff" />
				</linearGradient>
				<radialGradient id={orbGradId}>
					<stop offset="0%" stopColor="#ffffff" />
					<stop offset="30%" stopColor="#aaffff" />
					<stop offset="70%" stopColor="#44cccc" />
					<stop offset="100%" stopColor="#006666" />
				</radialGradient>
			</defs>
			<circle cx={0} cy={0} r={outerRadius + 8} fill={`url(#${outerGlowId})`} />
			{spikes}
			<circle
				cx={0}
				cy={0}
				r={innerRadius}
				fill="none"
				stroke="#00ccff"
				strokeWidth="2"
			/>
			<circle cx={0} cy={0} r={orbRadius} fill={`url(#${orbGradId})`} />
			<ellipse cx={-2} cy={-3} rx={4} ry={3} fill="rgba(255, 255, 255, 0.5)" />
			<circle
				cx={0}
				cy={0}
				r={orbRadius}
				fill="none"
				stroke="#00aaaa"
				strokeWidth="1"
			/>
		</g>
	);
}

export function LockOnPurpleIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `lockOnPurpleGlow-${id}`;
	const markerGradId = `lockOnPurpleMarkerGrad-${id}`;

	const markerPath = `
		M 0 -30
		C 3 -26, 6 -20, 8 -14
		C 10 -8, 10 -2, 8 4
		L 10 6
		C 12 8, 12 12, 10 14
		L 6 16
		L 6 24
		C 6 26, 4 28, 0 28
		C -4 28, -6 26, -6 24
		L -6 16
		L -10 14
		C -12 12, -12 8, -10 6
		L -8 4
		C -10 -2, -10 -8, -8 -14
		C -6 -20, -3 -26, 0 -30
		Z
	`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#aa66ff" stopOpacity="0.6" />
					<stop offset="60%" stopColor="#8844cc" stopOpacity="0.3" />
					<stop offset="100%" stopColor="#442266" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={markerGradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#220044" />
					<stop offset="50%" stopColor="#5522aa" />
					<stop offset="100%" stopColor="#8844cc" />
				</linearGradient>
			</defs>
			<ellipse cx={0} cy={30} rx={24} ry={10} fill={`url(#${glowId})`} />
			<path
				d={markerPath}
				fill={`url(#${markerGradId})`}
				stroke="#aa66ff"
				strokeWidth="1.5"
			/>
			<path
				d={`M 0 -24 C 2 -20, 4 -16, 5 -10 C 6 -4, 5 0, 3 4 L 0 6 L -3 4 C -5 0, -6 -4, -5 -10 C -4 -16, -2 -20, 0 -24 Z`}
				fill="rgba(255, 255, 255, 0.15)"
			/>
			<ellipse cx={0} cy={-6} rx={3} ry={4} fill="#220044" />
			<ellipse cx={0} cy={-6} rx={1.5} ry={2} fill="#aa66ff" />
		</g>
	);
}

export function LockOnGreenIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `lockOnGreenGlow-${id}`;
	const gemGradId = `lockOnGreenGemGrad-${id}`;

	const gemPath = `
		M 0 -24
		C 16 -20, 24 -8, 22 4
		C 20 14, 12 22, 0 24
		C -12 22, -20 14, -22 4
		C -24 -8, -16 -20, 0 -24
		Z
	`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#66ff88" stopOpacity="0.6" />
					<stop offset="60%" stopColor="#44cc66" stopOpacity="0.3" />
					<stop offset="100%" stopColor="#226644" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={gemGradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#003311" />
					<stop offset="30%" stopColor="#116633" />
					<stop offset="70%" stopColor="#22aa55" />
					<stop offset="100%" stopColor="#44cc77" />
				</linearGradient>
			</defs>
			<ellipse cx={0} cy={28} rx={24} ry={10} fill={`url(#${glowId})`} />
			<path
				d={gemPath}
				fill={`url(#${gemGradId})`}
				stroke="#66ff88"
				strokeWidth="1.5"
			/>
			<path
				d={`M -4 -18 C 8 -16, 14 -8, 12 0 C 10 6, 4 8, -2 6 C -8 4, -12 -4, -10 -10 C -8 -14, -4 -18, -4 -18 Z`}
				fill="rgba(255, 255, 255, 0.25)"
			/>
			<ellipse cx={-6} cy={-10} rx={4} ry={3} fill="rgba(255, 255, 255, 0.4)" />
		</g>
	);
}

export function EmphasisCircleIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `emphasisCircleGlow-${id}`;
	const gradId = `emphasisCircleGrad-${id}`;

	const spiralPath = `M 20 0 A 20 20 0 1 0 0 20 L 0 12 A 12 12 0 1 1 12 0 Z`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#ff6688" stopOpacity="0.5" />
					<stop offset="70%" stopColor="#ff4466" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#cc2244" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#ff8899" />
					<stop offset="50%" stopColor="#cc4455" />
					<stop offset="100%" stopColor="#992233" />
				</linearGradient>
			</defs>
			<circle cx={0} cy={0} r={28} fill={`url(#${glowId})`} />
			<path
				d={spiralPath}
				fill={`url(#${gradId})`}
				stroke="#ffaabb"
				strokeWidth="2"
			/>
			<path
				d={`M 16 -4 A 16 16 0 0 0 -4 16 L -4 10 A 10 10 0 0 1 10 -4 Z`}
				fill="rgba(255, 255, 255, 0.2)"
			/>
		</g>
	);
}

export function EmphasisCrossIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `emphasisCrossGlow-${id}`;
	const gradId = `emphasisCrossGrad-${id}`;

	const armWidth = 10;
	const armLength = 24;

	const crossPath = `
		M ${-armWidth / 2} ${-armLength}
		L ${armWidth / 2} ${-armLength}
		L ${armWidth / 2} ${-armWidth / 2}
		L ${armLength} ${-armWidth / 2}
		L ${armLength} ${armWidth / 2}
		L ${armWidth / 2} ${armWidth / 2}
		L ${armWidth / 2} ${armLength}
		L ${-armWidth / 2} ${armLength}
		L ${-armWidth / 2} ${armWidth / 2}
		L ${-armLength} ${armWidth / 2}
		L ${-armLength} ${-armWidth / 2}
		L ${-armWidth / 2} ${-armWidth / 2}
		Z
	`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#ff6688" stopOpacity="0.5" />
					<stop offset="70%" stopColor="#ff4466" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#cc2244" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#ff8899" />
					<stop offset="50%" stopColor="#cc4455" />
					<stop offset="100%" stopColor="#992233" />
				</linearGradient>
			</defs>
			<circle cx={0} cy={0} r={30} fill={`url(#${glowId})`} />
			<g transform="rotate(45)">
				<path
					d={crossPath}
					fill={`url(#${gradId})`}
					stroke="#ffaabb"
					strokeWidth="2"
				/>
			</g>
		</g>
	);
}

export function EmphasisSquareIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `emphasisSquareGlow-${id}`;
	const gradId = `emphasisSquareGrad-${id}`;

	const size = 22;
	const innerSize = 14;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#ff6688" stopOpacity="0.5" />
					<stop offset="70%" stopColor="#ff4466" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#cc2244" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#ff8899" />
					<stop offset="50%" stopColor="#cc4455" />
					<stop offset="100%" stopColor="#992233" />
				</linearGradient>
			</defs>
			<circle cx={0} cy={0} r={32} fill={`url(#${glowId})`} />
			<g transform="rotate(45)">
				<rect
					x={-size}
					y={-size}
					width={size * 2}
					height={size * 2}
					fill={`url(#${gradId})`}
					stroke="#ffaabb"
					strokeWidth="2"
				/>
				<rect
					x={-innerSize}
					y={-innerSize}
					width={innerSize * 2}
					height={innerSize * 2}
					fill="none"
					stroke="rgba(255, 255, 255, 0.3)"
					strokeWidth="2"
				/>
			</g>
		</g>
	);
}

export function EmphasisTriangleIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `emphasisTriangleGlow-${id}`;
	const gradId = `emphasisTriangleGrad-${id}`;

	const outerSize = 26;
	const innerSize = 16;

	const outerPath = `M 0 ${-outerSize} L ${outerSize * 0.866} ${outerSize * 0.5} L ${-outerSize * 0.866} ${outerSize * 0.5} Z`;
	const innerPath = `M 0 ${-innerSize} L ${innerSize * 0.866} ${innerSize * 0.5} L ${-innerSize * 0.866} ${innerSize * 0.5} Z`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#ff6688" stopOpacity="0.5" />
					<stop offset="70%" stopColor="#ff4466" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#cc2244" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#ff8899" />
					<stop offset="50%" stopColor="#cc4455" />
					<stop offset="100%" stopColor="#992233" />
				</linearGradient>
			</defs>
			<circle cx={0} cy={0} r={32} fill={`url(#${glowId})`} />
			<path
				d={outerPath}
				fill={`url(#${gradId})`}
				stroke="#ffaabb"
				strokeWidth="2"
			/>
			<path
				d={innerPath}
				fill="none"
				stroke="rgba(255, 255, 255, 0.3)"
				strokeWidth="2"
			/>
		</g>
	);
}

export function ClockwiseIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `clockwiseGlow-${id}`;
	const arrowGradId = `clockwiseArrowGrad-${id}`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#ffaa44" stopOpacity="0.5" />
					<stop offset="70%" stopColor="#ff8822" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#cc6600" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={arrowGradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#ffcc66" />
					<stop offset="50%" stopColor="#ff9933" />
					<stop offset="100%" stopColor="#cc6600" />
				</linearGradient>
			</defs>
			<ellipse cx={0} cy={0} rx={36} ry={20} fill={`url(#${glowId})`} />
			<path
				d="M -28 0 L -18 -12 L -18 -4 L 18 -4 L 18 -12 L 28 0 L 18 12 L 18 4 L -18 4 L -18 12 Z"
				fill={`url(#${arrowGradId})`}
				stroke="#ffcc88"
				strokeWidth="1.5"
			/>
		</g>
	);
}

export function CounterClockwiseIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `counterClockwiseGlow-${id}`;
	const arrowGradId = `counterClockwiseArrowGrad-${id}`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#44aaff" stopOpacity="0.5" />
					<stop offset="70%" stopColor="#2288ff" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#0066cc" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={arrowGradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#66ccff" />
					<stop offset="50%" stopColor="#3399ff" />
					<stop offset="100%" stopColor="#0066cc" />
				</linearGradient>
			</defs>
			<ellipse cx={0} cy={0} rx={36} ry={20} fill={`url(#${glowId})`} />
			<path
				d="M 28 0 L 18 -12 L 18 -4 L -18 -4 L -18 -12 L -28 0 L -18 12 L -18 4 L 18 4 L 18 12 Z"
				fill={`url(#${arrowGradId})`}
				stroke="#88ccff"
				strokeWidth="1.5"
			/>
		</g>
	);
}

export function BuffIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `buffGlow-${id}`;
	const gradId = `buffGrad-${id}`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#44ff88" stopOpacity="0.5" />
					<stop offset="70%" stopColor="#22cc66" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#008844" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#88ffaa" />
					<stop offset="50%" stopColor="#44cc66" />
					<stop offset="100%" stopColor="#228844" />
				</linearGradient>
			</defs>
			<circle cx={0} cy={0} r={16} fill={`url(#${glowId})`} />
			<path
				d="M 0 -12 L 4 -4 L 12 -4 L 6 2 L 8 10 L 0 6 L -8 10 L -6 2 L -12 -4 L -4 -4 Z"
				fill={`url(#${gradId})`}
				stroke="#88ffaa"
				strokeWidth="1"
			/>
		</g>
	);
}

export function DebuffIcon({ transform }: IconProps) {
	const id = useId();
	const glowId = `debuffGlow-${id}`;
	const gradId = `debuffGrad-${id}`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#ff4488" stopOpacity="0.5" />
					<stop offset="70%" stopColor="#cc2266" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#880044" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#ff88aa" />
					<stop offset="50%" stopColor="#cc4466" />
					<stop offset="100%" stopColor="#882244" />
				</linearGradient>
			</defs>
			<circle cx={0} cy={0} r={16} fill={`url(#${glowId})`} />
			<path
				d="M 0 12 L 4 4 L 12 4 L 6 -2 L 8 -10 L 0 -6 L -8 -10 L -6 -2 L -12 4 L -4 4 Z"
				fill={`url(#${gradId})`}
				stroke="#ff88aa"
				strokeWidth="1"
			/>
		</g>
	);
}
