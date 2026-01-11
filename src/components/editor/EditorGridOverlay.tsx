/**
 * Editor-specific grid overlay component
 *
 * Displays concentric circle or square grid as editing guides
 */

import {
	DEFAULT_OVERLAY_SETTINGS,
	type EditorOverlayType,
	OVERLAY_COLORS,
	type OverlaySettings,
} from "@/lib/editor";

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

function getColors(settings: OverlaySettings) {
	const colorDef = OVERLAY_COLORS.find((c) => c.id === settings.colorId);
	const rgb = colorDef?.color ?? "100, 200, 255";
	const opacity = settings.opacity / 100;

	return {
		major: `rgba(${rgb}, ${opacity})`,
		minor: `rgba(${rgb}, ${opacity * 0.5})`,
		center: "rgba(255, 200, 100, 0.6)",
		border: `rgba(${rgb}, ${Math.min(opacity * 1.25, 1)})`,
	};
}

export interface EditorGridOverlayProps {
	type: EditorOverlayType;
	width?: number;
	height?: number;
	settings?: OverlaySettings;
}

interface ConcentricGridOverlayProps {
	width: number;
	height: number;
	settings: OverlaySettings;
}

/**
 * Concentric circle grid overlay
 */
function ConcentricGridOverlay({
	width,
	height,
	settings,
}: ConcentricGridOverlayProps) {
	const centerX = width / 2;
	const centerY = height / 2;
	const colors = getColors(settings);

	const maxRadius = Math.min(width, height) / 2 - 10;

	const circleCount = settings.circleCount;
	const radiusStep = maxRadius / circleCount;
	const radii = Array.from(
		{ length: circleCount },
		(_, i) => radiusStep * (i + 1),
	);

	// 8 directional guidelines at 45-degree intervals
	const angles = [0, 45, 90, 135, 180, 225, 270, 315];

	return (
		<g pointerEvents="none">
			{radii.map((radius, index) => (
				<circle
					key={`circle-${radius}`}
					cx={centerX}
					cy={centerY}
					r={radius}
					fill="none"
					stroke={colors.major}
					strokeWidth={index === radii.length - 1 ? 2 : 1}
					strokeDasharray={index === radii.length - 1 ? "none" : "4 4"}
				/>
			))}

			{settings.showGuideLines &&
				angles.map((angle) => {
					const rad = (angle * Math.PI) / 180;
					const endX = centerX + Math.cos(rad) * maxRadius;
					const endY = centerY + Math.sin(rad) * maxRadius;
					const isMajor = angle % 90 === 0;

					return (
						<line
							key={`line-${angle}`}
							x1={centerX}
							y1={centerY}
							x2={endX}
							y2={endY}
							stroke={isMajor ? colors.major : colors.minor}
							strokeWidth={isMajor ? 1.5 : 1}
							strokeDasharray={isMajor ? "none" : "2 4"}
						/>
					);
				})}

			{settings.showCenterMarker && (
				<>
					<circle
						cx={centerX}
						cy={centerY}
						r={4}
						fill={colors.center}
						stroke={colors.center}
						strokeWidth={1}
					/>
					<circle
						cx={centerX}
						cy={centerY}
						r={8}
						fill="none"
						stroke={colors.center}
						strokeWidth={1}
					/>
				</>
			)}
		</g>
	);
}

interface SquareGridOverlayProps {
	width: number;
	height: number;
	settings: OverlaySettings;
}

/**
 * Square grid overlay
 */
function SquareGridOverlay({
	width,
	height,
	settings,
}: SquareGridOverlayProps) {
	const centerX = width / 2;
	const centerY = height / 2;
	const colors = getColors(settings);
	const gridSize = settings.squareGridSize;

	const lines: React.ReactNode[] = [];

	for (let x = gridSize; x < width; x += gridSize) {
		const isCenterLine = Math.abs(x - centerX) < 1;
		lines.push(
			<line
				key={`v-${x}`}
				x1={x}
				y1={0}
				x2={x}
				y2={height}
				stroke={isCenterLine ? colors.major : colors.minor}
				strokeWidth={isCenterLine ? 1.5 : 1}
			/>,
		);
	}

	for (let y = gridSize; y < height; y += gridSize) {
		const isCenterLine = Math.abs(y - centerY) < 1;
		lines.push(
			<line
				key={`h-${y}`}
				x1={0}
				y1={y}
				x2={width}
				y2={y}
				stroke={isCenterLine ? colors.major : colors.minor}
				strokeWidth={isCenterLine ? 1.5 : 1}
			/>,
		);
	}

	return (
		<g pointerEvents="none">
			{lines}

			{settings.showBorder && (
				<rect
					x={2}
					y={2}
					width={width - 4}
					height={height - 4}
					fill="none"
					stroke={colors.border}
					strokeWidth={2}
				/>
			)}

			{settings.showCenterMarker && (
				<circle
					cx={centerX}
					cy={centerY}
					r={4}
					fill={colors.center}
					stroke={colors.center}
					strokeWidth={1}
				/>
			)}
		</g>
	);
}

export function EditorGridOverlay({
	type,
	width = CANVAS_WIDTH,
	height = CANVAS_HEIGHT,
	settings = DEFAULT_OVERLAY_SETTINGS,
}: EditorGridOverlayProps) {
	if (type === "none") {
		return null;
	}

	if (type === "concentric") {
		return (
			<ConcentricGridOverlay
				width={width}
				height={height}
				settings={settings}
			/>
		);
	}

	if (type === "square") {
		return (
			<SquareGridOverlay width={width} height={height} settings={settings} />
		);
	}

	return null;
}
