/**
 * Server-side rendering of BoardData to SVG string
 * Original images are inlined as Base64
 */

import { renderToStaticMarkup } from "react-dom/server";
import {
	BackgroundRenderer,
	buildFullTransform,
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	calculateDonutInnerRadius,
	calculateLineEndpoint,
	colorToRgba,
	DEFAULT_BBOX_SIZE,
	DEFAULT_PARAMS,
	generateDonutPath,
	isColorChanged,
	isLineAoEParamsChanged,
	OBJECT_BBOX_SIZES,
} from "@/lib/board";
import type { BoardData, BoardObject, Color } from "@/lib/stgy/types";
import { ObjectIds } from "@/lib/stgy/types";
import {
	loadBackgroundImage,
	loadImageAsDataUri,
	preloadImagesAsync,
} from "./imageLoader";

export interface RenderOptions {
	/** Whether to display the board name as a title bar */
	showTitle?: boolean;
}

const TITLE_BAR_HEIGHT = 32;

/**
 * Line (ObjectId: 12) is excluded as it uses absolute coordinates
 */
const AOE_OBJECT_IDS = new Set<number>([
	ObjectIds.CircleAoE,
	ObjectIds.ConeAoE,
	ObjectIds.LineAoE,
	ObjectIds.DonutAoE,
]);

/**
 * Only LineAoE, Line, and Text support color changes
 */
const COLOR_CHANGEABLE_OBJECT_IDS = new Set<number>([
	ObjectIds.LineAoE,
	ObjectIds.Line,
	ObjectIds.Text,
]);

const DEFAULT_AOE_FILL = "rgba(255, 150, 0, 0.4)";

function renderColoredAoE(
	objectId: number,
	transform: string,
	color: Color,
	opacity: number,
	param1?: number,
	param2?: number,
): React.ReactNode | null {
	// Color-changeable objects use specified color, others use default AoE color
	const fill = COLOR_CHANGEABLE_OBJECT_IDS.has(objectId)
		? colorToRgba(color)
		: DEFAULT_AOE_FILL;
	const strokeColor = "#ff8800";

	switch (objectId) {
		case ObjectIds.CircleAoE:
			return (
				<g transform={transform}>
					<circle
						cx={0}
						cy={0}
						r={64}
						fill={fill}
						stroke={strokeColor}
						strokeWidth="2"
						opacity={opacity}
					/>
				</g>
			);
		case ObjectIds.ConeAoE: {
			// param1 = angle (default 90 degrees)
			// Origin is 12 o'clock, expanding clockwise by the angle
			// Clips circular gradient image (10.png) into a sector
			const angle = param1 ?? 90;
			const radius = 256;

			// SVG coordinate system: 0deg=right, 90deg=down, -90deg=up
			const startRad = -Math.PI / 2; // 12 o'clock (top)
			const endRad = startRad + (angle * Math.PI) / 180;

			const x1 = Math.cos(startRad) * radius;
			const y1 = Math.sin(startRad) * radius;
			const x2 = Math.cos(endRad) * radius;
			const y2 = Math.sin(endRad) * radius;
			const largeArc = angle > 180 ? 1 : 0;

			// Calculate offset so bounding box center aligns with object coordinates
			const startAngle = -90;
			const endAngle = -90 + angle;
			const points = [
				{ x: 0, y: 0 },
				{ x: x1, y: y1 },
				{ x: x2, y: y2 },
			];
			for (const deg of [-90, 0, 90, 180, 270]) {
				if (deg > startAngle && deg < endAngle) {
					points.push({
						x: Math.cos((deg * Math.PI) / 180) * radius,
						y: Math.sin((deg * Math.PI) / 180) * radius,
					});
				}
			}
			const xs = points.map((p) => p.x);
			const ys = points.map((p) => p.y);
			const minX = Math.min(...xs);
			const maxX = Math.max(...xs);
			const minY = Math.min(...ys);
			const maxY = Math.max(...ys);
			const cx = -((minX + maxX) / 2);
			const cy = -((minY + maxY) / 2);

			// Clockwise arc (sweep=1)
			const d = `M ${cx} ${cy} L ${cx + x1} ${cy + y1} A ${radius} ${radius} 0 ${largeArc} 1 ${cx + x2} ${cy + y2} Z`;

			// Circular gradient image (10.png) as Base64
			const imageDataUri = loadImageAsDataUri(ObjectIds.ConeAoE);
			const clipId = `cone-clip-${Math.random().toString(36).slice(2, 9)}`;

			return (
				<g transform={transform} opacity={opacity}>
					<defs>
						<clipPath id={clipId}>
							<path d={d} />
						</clipPath>
					</defs>
					{/* Clip circular gradient image into sector */}
					{imageDataUri && (
						<image
							href={imageDataUri}
							x={cx - radius}
							y={cy - radius}
							width={radius * 2}
							height={radius * 2}
							clipPath={`url(#${clipId})`}
						/>
					)}
				</g>
			);
		}
		case ObjectIds.LineAoE: {
			// param1 = length, param2 = thickness
			// Centered at origin
			const length = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
			const thickness = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
			return (
				<g transform={transform}>
					<rect
						x={-length / 2}
						y={-thickness / 2}
						width={length}
						height={thickness}
						fill={fill}
						opacity={opacity}
					/>
				</g>
			);
		}
		case ObjectIds.DonutAoE: {
			const coneAngle = param1 ?? DEFAULT_PARAMS.FULL_CIRCLE_ANGLE;
			const outerRadius = 256;
			const donutRange = param2 ?? DEFAULT_PARAMS.DONUT_RANGE;
			// Use shared function to calculate inner radius (minimum thickness matches Line param3=8)
			const innerRadius = calculateDonutInnerRadius(outerRadius, donutRange);
			const maskId = `donut-mask-${Math.random().toString(36).slice(2, 9)}`;

			// Load original image as Base64
			const imageDataUri = loadImageAsDataUri(ObjectIds.DonutAoE);

			// Full circle donut for 360+ degrees
			if (coneAngle >= 360) {
				return (
					<g transform={transform} opacity={opacity}>
						<defs>
							<mask id={maskId}>
								<rect
									x={-outerRadius}
									y={-outerRadius}
									width={outerRadius * 2}
									height={outerRadius * 2}
									fill="white"
								/>
								<circle cx={0} cy={0} r={innerRadius} fill="black" />
							</mask>
						</defs>
						{imageDataUri && (
							<image
								href={imageDataUri}
								x={-outerRadius}
								y={-outerRadius}
								width={outerRadius * 2}
								height={outerRadius * 2}
								mask={`url(#${maskId})`}
							/>
						)}
					</g>
				);
			}

			// Sector donut for less than 360 degrees, rendered with image + mask
			const {
				path: maskPath,
				offsetX,
				offsetY,
			} = generateDonutPath(coneAngle, outerRadius, innerRadius);

			return (
				<g transform={transform} opacity={opacity}>
					<defs>
						<mask id={maskId}>
							<path d={maskPath} fill="white" />
						</mask>
					</defs>
					{imageDataUri && (
						<image
							href={imageDataUri}
							x={offsetX - outerRadius}
							y={offsetY - outerRadius}
							width={outerRadius * 2}
							height={outerRadius * 2}
							mask={`url(#${maskId})`}
						/>
					)}
				</g>
			);
		}
		default:
			return null;
	}
}

function ObjectRenderer({ object }: { object: BoardObject }) {
	const { objectId, position, rotation, size, color, flags, param1, param2 } =
		object;

	const scale = size / 100;
	const bboxSize = OBJECT_BBOX_SIZES[objectId] ?? DEFAULT_BBOX_SIZE;

	// Convert opacity: color.opacity 0=opaque, 100=transparent
	const opacity = 1 - color.opacity / 100;

	const transform = buildFullTransform(
		position.x,
		position.y,
		rotation,
		scale,
		flags.flipHorizontal,
		flags.flipVertical,
	);

	// Text object requires special handling
	if (objectId === ObjectIds.Text && object.text) {
		return (
			<g transform={transform}>
				<text
					x={0}
					y={0}
					fill={`rgb(${color.r}, ${color.g}, ${color.b})`}
					fontSize="14"
					fontFamily="sans-serif"
					textAnchor="middle"
					dominantBaseline="middle"
					opacity={opacity}
					stroke="#000000"
					strokeWidth="1"
					paintOrder="stroke"
				>
					{object.text}
				</text>
			</g>
		);
	}

	// Skip group objects
	if (objectId === ObjectIds.Group) {
		return null;
	}

	// Line (ObjectId: 12): absolute coordinate line from start(position) to end(param1/10, param2/10)
	// param1, param2 are coordinates multiplied by 10 (supports one decimal place)
	// param3 is line thickness (default 6)
	if (objectId === ObjectIds.Line) {
		const endpoint = calculateLineEndpoint(position, param1, param2);
		const lineThickness = object.param3 ?? DEFAULT_PARAMS.LINE_THICKNESS;
		const lineFill = colorToRgba(color);
		return (
			<line
				x1={position.x}
				y1={position.y}
				x2={endpoint.x}
				y2={endpoint.y}
				stroke={lineFill}
				strokeWidth={lineThickness}
				strokeLinecap="butt"
				opacity={opacity}
			/>
		);
	}

	// ConeAoE, LineAoE, DonutAoE are always rendered as SVG (images only for sidebar icons)
	// Only LineAoE, Text support color changes (Line is handled above)
	// Other AoE objects are rendered as SVG only when parameters are changed
	const alwaysSvgObjects =
		objectId === ObjectIds.ConeAoE ||
		objectId === ObjectIds.LineAoE ||
		objectId === ObjectIds.DonutAoE;
	const shouldRenderAsSvg =
		alwaysSvgObjects ||
		(AOE_OBJECT_IDS.has(objectId) &&
			((COLOR_CHANGEABLE_OBJECT_IDS.has(objectId) && isColorChanged(color)) ||
				isLineAoEParamsChanged(objectId, param1, param2)));
	if (shouldRenderAsSvg) {
		const coloredAoE = renderColoredAoE(
			objectId,
			transform,
			color,
			opacity,
			param1,
			param2,
		);
		if (coloredAoE) return coloredAoE;
	}

	const imageDataUri = loadImageAsDataUri(objectId);

	// Placeholder if image not found
	if (!imageDataUri) {
		return (
			<g transform={transform}>
				<rect
					x={-bboxSize.width / 2}
					y={-bboxSize.height / 2}
					width={bboxSize.width}
					height={bboxSize.height}
					fill="#666"
					stroke="#999"
					strokeWidth="1"
					opacity={opacity}
				/>
				<text
					x={0}
					y={0}
					fill="#fff"
					fontSize="10"
					textAnchor="middle"
					dominantBaseline="middle"
				>
					{objectId}
				</text>
			</g>
		);
	}

	return (
		<g transform={transform}>
			<image
				href={imageDataUri}
				x={-bboxSize.width / 2}
				y={-bboxSize.height / 2}
				width={bboxSize.width}
				height={bboxSize.height}
				preserveAspectRatio="xMidYMid meet"
				opacity={opacity}
			/>
		</g>
	);
}

const BORDER_WIDTH = 2;

function TitleBar({ title, width }: { title: string; width: number }) {
	return (
		<g>
			<rect
				x={BORDER_WIDTH}
				y={BORDER_WIDTH}
				width={width - BORDER_WIDTH * 2}
				height={TITLE_BAR_HEIGHT}
				fill="#D2D2D2"
			/>
			<line
				x1={BORDER_WIDTH}
				y1={TITLE_BAR_HEIGHT + BORDER_WIDTH}
				x2={width - BORDER_WIDTH}
				y2={TITLE_BAR_HEIGHT + BORDER_WIDTH}
				stroke="rgba(128, 128, 128, 0.3)"
				strokeWidth={1}
			/>
			<text
				x={BORDER_WIDTH + 12}
				y={BORDER_WIDTH + TITLE_BAR_HEIGHT / 2}
				fill="#646464"
				fontSize="14"
				fontFamily="sans-serif"
				fontWeight="500"
				textAnchor="start"
				dominantBaseline="central"
			>
				{title}
			</text>
		</g>
	);
}

function BorderFrame({ width, height }: { width: number; height: number }) {
	return (
		<rect
			x={BORDER_WIDTH / 2}
			y={BORDER_WIDTH / 2}
			width={width - BORDER_WIDTH}
			height={height - BORDER_WIDTH}
			fill="none"
			stroke="rgba(255, 255, 255, 0.8)"
			strokeWidth={BORDER_WIDTH}
		/>
	);
}

export async function renderBoardToSVG(
	boardData: BoardData,
	options: RenderOptions = {},
): Promise<string> {
	const { backgroundId, objects, name } = boardData;
	const { showTitle = false } = options;

	// Preload images (using Cloudflare Workers ASSETS binding)
	const objectIds = objects
		.filter(
			(obj) =>
				obj.flags.visible &&
				obj.objectId !== ObjectIds.Text &&
				obj.objectId !== ObjectIds.Group &&
				obj.objectId !== ObjectIds.Line,
		)
		.map((obj) => obj.objectId);
	const uniqueObjectIds = [...new Set(objectIds)];

	// Load object and background images in parallel
	const [, backgroundDataUri] = await Promise.all([
		preloadImagesAsync(uniqueObjectIds),
		loadBackgroundImage(backgroundId),
	]);

	// Extend height when showing title
	const totalHeight = showTitle
		? CANVAS_HEIGHT + TITLE_BAR_HEIGHT
		: CANVAS_HEIGHT;

	// Filter visible objects only (reverse order for drawing)
	const visibleObjects = objects.filter((obj) => obj.flags.visible).reverse();

	// Y offset for content area (below title bar when shown)
	const contentOffsetY = showTitle ? TITLE_BAR_HEIGHT : 0;

	const svgElement = (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={CANVAS_WIDTH}
			height={totalHeight}
			viewBox={`0 0 ${CANVAS_WIDTH} ${totalHeight}`}
			style={{ backgroundColor: "#1a1a1a" }}
			role="img"
			aria-label={`Strategy board: ${name}`}
		>
			<rect width={CANVAS_WIDTH} height={totalHeight} fill="#1a1a1a" />

			{showTitle && <TitleBar title={name} width={CANVAS_WIDTH} />}

			<g transform={`translate(0, ${contentOffsetY})`}>
				<BackgroundRenderer
					backgroundId={backgroundId}
					width={CANVAS_WIDTH}
					height={CANVAS_HEIGHT}
					imageDataUri={backgroundDataUri ?? undefined}
				/>

				{visibleObjects.map((obj) => (
					<ObjectRenderer
						key={`${obj.objectId}-${obj.position.x}-${obj.position.y}`}
						object={obj}
					/>
				))}
			</g>

			{showTitle && <BorderFrame width={CANVAS_WIDTH} height={totalHeight} />}
		</svg>
	);

	return renderToStaticMarkup(svgElement);
}
