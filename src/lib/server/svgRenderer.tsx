/**
 * サーバーサイドでBoardDataをSVG文字列にレンダリングする
 * オリジナル画像をBase64でインライン化
 */

import { renderToStaticMarkup } from "react-dom/server";
import {
	BackgroundRenderer,
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	DEFAULT_BBOX_SIZE,
	getConeBoundingBox,
	getDonutConeBoundingBox,
	OBJECT_BBOX_SIZES,
} from "@/lib/board";
import type { BoardData, BoardObject, Color } from "@/lib/stgy/types";
import { ObjectIds } from "@/lib/stgy/types";
import {
	loadBackgroundImage,
	loadImageAsDataUri,
	preloadImagesAsync,
} from "./imageLoader";

/**
 * SVGレンダリングオプション
 */
export interface RenderOptions {
	/** ボード名（タイトル）を表示するか */
	showTitle?: boolean;
}

/** タイトルバーの高さ */
const TITLE_BAR_HEIGHT = 32;

/**
 * デフォルトの色（この色の場合はオリジナル画像を使用）
 */
const DEFAULT_OBJECT_COLOR: Color = { r: 255, g: 100, b: 0, opacity: 0 };

/**
 * デフォルトのパラメータ値
 */
const DEFAULT_PARAMS = {
	LINE_HEIGHT: 128, // 直線範囲攻撃の縦幅デフォルト
	LINE_WIDTH: 128, // 直線範囲攻撃の横幅デフォルト
};

/**
 * 色がデフォルトから変更されているかチェック
 */
function isColorChanged(color: Color): boolean {
	return (
		color.r !== DEFAULT_OBJECT_COLOR.r ||
		color.g !== DEFAULT_OBJECT_COLOR.g ||
		color.b !== DEFAULT_OBJECT_COLOR.b ||
		color.opacity !== DEFAULT_OBJECT_COLOR.opacity
	);
}

/**
 * 直線範囲攻撃のパラメータがデフォルトから変更されているかチェック
 * 縦幅・横幅パラメータを持つのはLineAoEのみ（Lineは異なるパラメータ構成）
 */
function isLineAoEParamsChanged(
	objectId: number,
	param1?: number,
	param2?: number,
): boolean {
	// LineAoEのみが縦幅・横幅パラメータを持つ
	if (objectId !== ObjectIds.LineAoE) {
		return false;
	}
	const height = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
	const width = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
	return (
		height !== DEFAULT_PARAMS.LINE_HEIGHT || width !== DEFAULT_PARAMS.LINE_WIDTH
	);
}

/**
 * 色をRGBA文字列に変換
 */
function colorToRgba(color: Color): string {
	const alpha = 1 - color.opacity / 100;
	return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

/**
 * AoEオブジェクトのIDセット
 * Note: Line (ObjectId: 12) は絶対座標線として別処理するため含めない
 */
const AOE_OBJECT_IDS = new Set<number>([
	ObjectIds.CircleAoE,
	ObjectIds.ConeAoE,
	ObjectIds.LineAoE,
	ObjectIds.DonutAoE,
]);

/**
 * 色変更が有効なオブジェクトID
 * 直線範囲攻撃、ライン、テキストのみ色変更に対応
 */
const COLOR_CHANGEABLE_OBJECT_IDS = new Set<number>([
	ObjectIds.LineAoE,
	ObjectIds.Line,
	ObjectIds.Text,
]);

/**
 * デフォルトのAoE塗りつぶし色
 */
const DEFAULT_AOE_FILL = "rgba(255, 150, 0, 0.4)";

/**
 * パラメータまたは色が変更されたAoEオブジェクトをSVGでレンダリング
 */
function renderColoredAoE(
	objectId: number,
	transform: string,
	color: Color,
	opacity: number,
	param1?: number,
	param2?: number,
): React.ReactNode | null {
	// 色変更対応オブジェクト（LineAoE, Line）は指定色を使用、それ以外はデフォルトAoE色
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
			// ConeAoE: param1 = 角度（デフォルト90度）
			// 起点は12時方向（上）、そこから時計回りに範囲角度分広がる
			// 10.png（円形グラデーション画像）を扇形にクリップして表示
			const angle = param1 ?? 90;
			const radius = 256;

			// SVGの座標系: 0度=右、90度=下、-90度=上
			const startRad = -Math.PI / 2; // 12時方向（上）
			const endRad = startRad + (angle * Math.PI) / 180; // 時計回りに範囲角度分

			const x1 = Math.cos(startRad) * radius;
			const y1 = Math.sin(startRad) * radius;
			const x2 = Math.cos(endRad) * radius;
			const y2 = Math.sin(endRad) * radius;
			const largeArc = angle > 180 ? 1 : 0;

			// バウンディングボックスの中心がオブジェクト座標に来るようにオフセット計算
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

			// 時計回り（sweep=1）で描画
			const d = `M ${cx} ${cy} L ${cx + x1} ${cy + y1} A ${radius} ${radius} 0 ${largeArc} 1 ${cx + x2} ${cy + y2} Z`;

			// 円形グラデーション画像（10.png）をBase64で取得
			const imageDataUri = loadImageAsDataUri(ObjectIds.ConeAoE);
			const clipId = `cone-clip-${Math.random().toString(36).slice(2, 9)}`;

			return (
				<g transform={transform} opacity={opacity}>
					<defs>
						<clipPath id={clipId}>
							<path d={d} />
						</clipPath>
					</defs>
					{/* 円形グラデーション画像を扇形にクリップ */}
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
			// LineAoE: param1 = 縦幅（長さ）、param2 = 横幅（太さ）
			// 中央基準（中心が原点）
			// クライアント側と同様: length → rectのwidth, thickness → rectのheight
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
			// ドーナツ型AoE（中央に穴あき、角度対応）
			const coneAngle = param1 ?? 360; // 範囲角度（10-360度）
			const outerRadius = 256; // クライアント側と同じサイズ
			const donutRange = param2 ?? 50; // 0-240: 0=穴なし, 240=最大
			// Line param3=8 と同じ太さを最小として残す（クライアント側と同じ計算）
			const MIN_THICKNESS_RATIO = 1 / 10;
			const minThickness = outerRadius * MIN_THICKNESS_RATIO;
			const maxInnerRadius = outerRadius - minThickness;
			const innerRadius = maxInnerRadius * (donutRange / 240);
			const maskId = `donut-mask-${Math.random().toString(36).slice(2, 9)}`;

			// オリジナル画像をBase64で取得
			const imageDataUri = loadImageAsDataUri(ObjectIds.DonutAoE);

			// 360度以上の場合は完全な円ドーナツ
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

			// 360度未満の場合は扇形ドーナツを画像+maskで描画
			// バウンディングボックスの中心がオブジェクト座標に来るようにオフセット計算
			const bbox =
				innerRadius <= 0
					? getConeBoundingBox(coneAngle, outerRadius)
					: getDonutConeBoundingBox(coneAngle, outerRadius, innerRadius);
			const offsetX = -(bbox.minX + bbox.width / 2);
			const offsetY = -(bbox.minY + bbox.height / 2);

			const startRad = -Math.PI / 2;
			const endRad = startRad + (coneAngle * Math.PI) / 180;

			// 外弧の開始点と終了点（オフセット適用）
			const outerX1 = offsetX + Math.cos(startRad) * outerRadius;
			const outerY1 = offsetY + Math.sin(startRad) * outerRadius;
			const outerX2 = offsetX + Math.cos(endRad) * outerRadius;
			const outerY2 = offsetY + Math.sin(endRad) * outerRadius;

			// 内弧の開始点と終了点（オフセット適用）
			const innerX1 = offsetX + Math.cos(startRad) * innerRadius;
			const innerY1 = offsetY + Math.sin(startRad) * innerRadius;
			const innerX2 = offsetX + Math.cos(endRad) * innerRadius;
			const innerY2 = offsetY + Math.sin(endRad) * innerRadius;

			const largeArc = coneAngle > 180 ? 1 : 0;

			// 内径が0の場合は扇形（内穴なし）
			const maskPath =
				innerRadius <= 0
					? [
							`M ${offsetX} ${offsetY}`,
							`L ${outerX1} ${outerY1}`,
							`A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerX2} ${outerY2}`,
							"Z",
						].join(" ")
					: [
							`M ${outerX1} ${outerY1}`,
							`A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerX2} ${outerY2}`,
							`L ${innerX2} ${innerY2}`,
							`A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1}`,
							"Z",
						].join(" ");

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

/**
 * 単一オブジェクトをレンダリング
 */
function ObjectRenderer({ object }: { object: BoardObject }) {
	const { objectId, position, rotation, size, color, flags, param1, param2 } =
		object;

	// サイズスケール計算
	const scale = size / 100;

	// バウンディングボックスサイズ取得（共通モジュールから）
	const bboxSize = OBJECT_BBOX_SIZES[objectId] ?? DEFAULT_BBOX_SIZE;

	// フリップ変換
	const flipX = flags.flipHorizontal ? -1 : 1;
	const flipY = flags.flipVertical ? -1 : 1;

	// 透過度をSVGのopacityに変換 (color.opacity: 0=不透明, 100=透明)
	const opacity = 1 - color.opacity / 100;

	const transform = `translate(${position.x}, ${position.y}) rotate(${rotation}) scale(${scale * flipX}, ${scale * flipY})`;

	// テキストオブジェクトは特別処理
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
				>
					{object.text}
				</text>
			</g>
		);
	}

	// グループオブジェクトはスキップ
	if (objectId === ObjectIds.Group) {
		return null;
	}

	// Line (ObjectId: 12): 始点(position)から終点(param1/10, param2/10)への絶対座標線
	// param1, param2 は座標を10倍した整数値（小数第一位まで対応）
	// param3 は線の太さ（デフォルト6）
	if (objectId === ObjectIds.Line) {
		const endX = (param1 ?? position.x * 10 + 2560) / 10;
		const endY = (param2 ?? position.y * 10) / 10;
		const lineThickness = object.param3 ?? 6;
		const lineFill = colorToRgba(color);
		return (
			<line
				x1={position.x}
				y1={position.y}
				x2={endX}
				y2={endY}
				stroke={lineFill}
				strokeWidth={lineThickness}
				strokeLinecap="butt"
				opacity={opacity}
			/>
		);
	}

	// ConeAoE, LineAoE, DonutAoEは常にSVGでレンダリング（画像はサイドバーアイコンのみ）
	// 色変更可能なのは LineAoE, Text のみ（Lineは上で特別処理）
	// その他のAoEオブジェクトはパラメータ変更時のみSVGでレンダリング（色変更は無視）
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

	// 画像をBase64で読み込み
	const imageDataUri = loadImageAsDataUri(objectId);

	// 画像がない場合はプレースホルダー
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

/** 枠線の太さ */
const BORDER_WIDTH = 2;

/**
 * タイトルバーコンポーネント（左上にタイトル表示）
 */
function TitleBar({ title, width }: { title: string; width: number }) {
	return (
		<g>
			{/* 背景バー */}
			<rect
				x={BORDER_WIDTH}
				y={BORDER_WIDTH}
				width={width - BORDER_WIDTH * 2}
				height={TITLE_BAR_HEIGHT}
				fill="#D2D2D2"
			/>
			{/* 下線 */}
			<line
				x1={BORDER_WIDTH}
				y1={TITLE_BAR_HEIGHT + BORDER_WIDTH}
				x2={width - BORDER_WIDTH}
				y2={TITLE_BAR_HEIGHT + BORDER_WIDTH}
				stroke="rgba(128, 128, 128, 0.3)"
				strokeWidth={1}
			/>
			{/* タイトルテキスト（左上に配置） */}
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

/**
 * 画像全体を囲む白い枠
 */
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

/**
 * BoardDataをSVG文字列にレンダリング
 */
export async function renderBoardToSVG(
	boardData: BoardData,
	options: RenderOptions = {},
): Promise<string> {
	const { backgroundId, objects, name } = boardData;
	const { showTitle = false } = options;

	// 画像をプリロード（Cloudflare Workers の ASSETS バインディングを使用）
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

	// オブジェクト画像と背景画像を並列で読み込み
	const [, backgroundDataUri] = await Promise.all([
		preloadImagesAsync(uniqueObjectIds),
		loadBackgroundImage(backgroundId),
	]);

	// タイトル表示時は高さを拡張
	const totalHeight = showTitle
		? CANVAS_HEIGHT + TITLE_BAR_HEIGHT
		: CANVAS_HEIGHT;

	// 表示するオブジェクトのみフィルタ（逆順で描画）
	const visibleObjects = objects.filter((obj) => obj.flags.visible).reverse();

	// コンテンツ領域のYオフセット（タイトル表示時はタイトルバーの下から）
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
			{/* 全体背景色 */}
			<rect width={CANVAS_WIDTH} height={totalHeight} fill="#1a1a1a" />

			{/* タイトルバー（オプション） */}
			{showTitle && <TitleBar title={name} width={CANVAS_WIDTH} />}

			{/* コンテンツ領域 */}
			<g transform={`translate(0, ${contentOffsetY})`}>
				{/* 背景画像（共通コンポーネント使用） */}
				<BackgroundRenderer
					backgroundId={backgroundId}
					width={CANVAS_WIDTH}
					height={CANVAS_HEIGHT}
					imageDataUri={backgroundDataUri ?? undefined}
				/>

				{/* オブジェクト */}
				{visibleObjects.map((obj) => (
					<ObjectRenderer
						key={`${obj.objectId}-${obj.position.x}-${obj.position.y}`}
						object={obj}
					/>
				))}
			</g>

			{/* 画像全体を囲む白い枠（最前面に描画） */}
			{showTitle && <BorderFrame width={CANVAS_WIDTH} height={totalHeight} />}
		</svg>
	);

	return renderToStaticMarkup(svgElement);
}
