import { useId } from "react";
import { ObjectIds } from "@/lib/stgy";
import { ENEMY_SIZES, SIZES } from "../constants";
import { renderOriginalIconIfEnabled } from "../utils";

export function EnemyIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const id = useId();

	const originalIcon = renderOriginalIconIfEnabled(objectId, transform);
	if (originalIcon) return originalIcon;
	const size = ENEMY_SIZES[objectId] ?? SIZES.ENEMY_SMALL;
	// Original SVG is 100x100, calculate scale factor
	const scale = size / 100;

	// Color scheme based on enemy type
	const getColorScheme = () => {
		switch (objectId) {
			case ObjectIds.EnemySmall:
				// Purple shield (with glow effect)
				return {
					gradientId: `enemySmallGrad-${id}`,
					glowId: `enemySmallGlow-${id}`,
					gradientColors: ["#b366ff", "#6600cc", "#330066"],
					strokeColor: "#ff66ff",
					faceColor: "#ff66ff",
					hasGlow: true,
				};
			case ObjectIds.EnemyMedium:
				// Blue shield
				return {
					gradientId: `enemyMediumGrad-${id}`,
					glowId: null,
					gradientColors: ["#0033cc", "#000066", "#000000"],
					strokeColor: "#80dfff",
					faceColor: "#80dfff",
					hasGlow: false,
				};
			default:
				// Red-brown shield
				return {
					gradientId: `enemyLargeGrad-${id}`,
					glowId: null,
					gradientColors: ["#4a0000", "#200000", "#000000"],
					strokeColor: "#ff4d4d",
					faceColor: "#ff9999",
					hasGlow: false,
				};
		}
	};

	const colors = getColorScheme();

	// Shield path (scaling from original SVG paths)
	const shieldPath =
		objectId === ObjectIds.EnemySmall
			? // Small enemy: pointed corners at top
				`M ${22 * scale} ${30 * scale}
				Q ${15 * scale} ${10 * scale} ${8 * scale} ${2 * scale}
				Q ${50 * scale} ${22 * scale} ${92 * scale} ${2 * scale}
				Q ${85 * scale} ${10 * scale} ${78 * scale} ${30 * scale}
				C ${88 * scale} ${50 * scale} ${82 * scale} ${80 * scale} ${50 * scale} ${98 * scale}
				C ${18 * scale} ${80 * scale} ${12 * scale} ${50 * scale} ${22 * scale} ${30 * scale} Z`
			: // Medium/large enemy: slightly rounded shape
				`M ${20 * scale} ${25 * scale}
				L ${15 * scale} ${15 * scale}
				Q ${50 * scale} ${25 * scale} ${85 * scale} ${15 * scale}
				L ${80 * scale} ${25 * scale}
				C ${90 * scale} ${45 * scale} ${85 * scale} ${75 * scale} ${50 * scale} ${95 * scale}
				C ${15 * scale} ${75 * scale} ${10 * scale} ${45 * scale} ${20 * scale} ${25 * scale} Z`;

	// Add outer border for large enemy only
	const outerPath =
		objectId === ObjectIds.EnemyLarge
			? `M ${18 * scale} ${20 * scale}
			   Q ${50 * scale} ${28 * scale} ${82 * scale} ${20 * scale}
			   C ${92 * scale} ${45 * scale} ${88 * scale} ${75 * scale} ${50 * scale} ${95 * scale}
			   C ${12 * scale} ${75 * scale} ${8 * scale} ${45 * scale} ${18 * scale} ${20 * scale} Z`
			: null;

	return (
		<g transform={`${transform} translate(${-size / 2}, ${-size / 2})`}>
			<defs>
				<radialGradient
					id={colors.gradientId}
					cx="50%"
					cy={objectId === ObjectIds.EnemySmall ? "45%" : "40%"}
					r={objectId === ObjectIds.EnemySmall ? "65%" : "70%"}
				>
					<stop
						offset="0%"
						stopColor={colors.gradientColors[0]}
						stopOpacity="1"
					/>
					<stop
						offset={objectId === ObjectIds.EnemySmall ? "60%" : "70%"}
						stopColor={colors.gradientColors[1]}
						stopOpacity="1"
					/>
					<stop
						offset="100%"
						stopColor={colors.gradientColors[2]}
						stopOpacity="1"
					/>
				</radialGradient>
				{colors.hasGlow && colors.glowId && (
					<filter id={colors.glowId}>
						<feGaussianBlur stdDeviation={2.5 * scale} result="coloredBlur" />
						<feMerge>
							<feMergeNode in="coloredBlur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				)}
			</defs>

			{outerPath && <path d={outerPath} fill="#ffccaa" stroke="none" />}

			<path
				d={shieldPath}
				fill={`url(#${colors.gradientId})`}
				stroke={colors.strokeColor}
				strokeWidth={
					objectId === ObjectIds.EnemySmall ? 2.5 * scale : 2 * scale
				}
				strokeLinejoin="round"
				filter={
					colors.hasGlow && colors.glowId ? `url(#${colors.glowId})` : undefined
				}
			/>

			<g
				fill={colors.faceColor}
				opacity={objectId === ObjectIds.EnemySmall ? 1 : 0.9}
				filter={
					colors.hasGlow && colors.glowId ? `url(#${colors.glowId})` : undefined
				}
			>
				<path
					d={`M ${32 * scale} ${35 * scale}
						L ${45 * scale} ${38 * scale}
						L ${35 * scale} ${48 * scale} Z`}
				/>
				<path
					d={`M ${68 * scale} ${35 * scale}
						L ${55 * scale} ${38 * scale}
						L ${65 * scale} ${48 * scale} Z`}
				/>
				<path
					d={`M ${32 * scale} ${56 * scale}
						Q ${50 * scale} ${62 * scale} ${68 * scale} ${56 * scale}
						L ${65 * scale} ${76 * scale}
						L ${57 * scale} ${64 * scale}
						L ${50 * scale} ${78 * scale}
						L ${43 * scale} ${64 * scale}
						L ${35 * scale} ${76 * scale} Z`}
				/>
			</g>
		</g>
	);
}
