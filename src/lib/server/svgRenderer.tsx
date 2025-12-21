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
	OBJECT_BBOX_SIZES,
} from "@/lib/board";
import type { BoardData, BoardObject, Color } from "@/lib/stgy/types";
import { ObjectIds } from "@/lib/stgy/types";
import { loadImageAsDataUri } from "./imageLoader";

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
 */
const AOE_OBJECT_IDS = new Set<number>([
	ObjectIds.CircleAoE,
	ObjectIds.ConeAoE,
	ObjectIds.LineAoE,
	ObjectIds.Line,
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
	const fill = colorToRgba(color);
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

			return (
				<g transform={transform}>
					<path
						d={d}
						fill={fill}
						stroke={strokeColor}
						strokeWidth="2"
						opacity={opacity}
					/>
				</g>
			);
		}
		case ObjectIds.LineAoE: {
			// LineAoE: param1 = 縦幅（高さ）、param2 = 横幅
			const height = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
			const width = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
			return (
				<g transform={transform}>
					<rect
						x={-width / 2}
						y={-height / 2}
						width={width}
						height={height}
						fill={fill}
						stroke={strokeColor}
						strokeWidth="2"
						opacity={opacity}
					/>
				</g>
			);
		}
		case ObjectIds.Line:
			// Line: 横長の線（バウンディングボックス: 256x6）
			return (
				<g transform={transform}>
					<rect
						x={-128}
						y={-3}
						width={256}
						height={6}
						fill={fill}
						stroke={strokeColor}
						strokeWidth="1"
						opacity={opacity}
					/>
				</g>
			);
		case ObjectIds.DonutAoE:
			// ドーナツ型AoE（中央に穴あき）
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
					<circle
						cx={0}
						cy={0}
						r={32}
						fill="#1a1a1a"
						stroke={strokeColor}
						strokeWidth="1"
						opacity={opacity}
					/>
				</g>
			);
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

	// ConeAoE, LineAoE, Lineは常にSVGでレンダリング（画像はサイドバーアイコンのみ）
	// 色変更可能なのは LineAoE, Line, Text のみ
	// その他のAoEオブジェクトはパラメータ変更時のみSVGでレンダリング（色変更は無視）
	const alwaysSvgObjects =
		objectId === ObjectIds.ConeAoE ||
		objectId === ObjectIds.LineAoE ||
		objectId === ObjectIds.Line;
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

/**
 * BoardDataをSVG文字列にレンダリング
 */
export function renderBoardToSVG(boardData: BoardData): string {
	const { backgroundId, objects } = boardData;

	// 表示するオブジェクトのみフィルタ（逆順で描画）
	const visibleObjects = objects.filter((obj) => obj.flags.visible).reverse();

	const svgElement = (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={CANVAS_WIDTH}
			height={CANVAS_HEIGHT}
			viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
			style={{ backgroundColor: "#1a1a1a" }}
		>
			{/* 背景色 */}
			<rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#1a1a1a" />

			{/* 背景パターン（共通コンポーネント使用） */}
			<BackgroundRenderer
				backgroundId={backgroundId}
				width={CANVAS_WIDTH}
				height={CANVAS_HEIGHT}
			/>

			{/* オブジェクト */}
			{visibleObjects.map((obj, index) => (
				<ObjectRenderer key={index} object={obj} />
			))}
		</svg>
	);

	return renderToStaticMarkup(svgElement);
}
