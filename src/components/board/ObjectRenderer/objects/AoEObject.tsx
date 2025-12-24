import { useId } from "react";
import { OBJECT_BBOX_SIZES } from "@/lib/board";
import type { Color } from "@/lib/stgy";
import { ObjectIds } from "@/lib/stgy";
import {
	Area1PIcon,
	Area2PIcon,
	Area3PIcon,
	Area4PIcon,
	BlockIcon,
	BuffIcon,
	CircleAoEMovingIcon,
	ClockwiseIcon,
	CounterClockwiseIcon,
	DebuffIcon,
	EmphasisCircleIcon,
	EmphasisCrossIcon,
	EmphasisSquareIcon,
	EmphasisTriangleIcon,
	GazeIcon,
	KnockbackLineIcon,
	KnockbackRadialIcon,
	LockOnBlueIcon,
	LockOnGreenIcon,
	LockOnPurpleIcon,
	LockOnRedIcon,
	ShapeArrowIcon,
	ShapeCircleIcon,
	ShapeCrossIcon,
	ShapeRotationIcon,
	ShapeSquareIcon,
	ShapeTriangleIcon,
	StackChainIcon,
	StackIcon,
	StackLineIcon,
} from "../../icons";
import { getConeBoundingBox, getDonutConeBoundingBox } from "../bounding-box";
import { COLORS, DEFAULT_PARAMS, getIconPath, SIZES } from "../constants";
import {
	colorToRgba,
	renderOriginalIconIfEnabled,
	useOriginalIcons,
} from "../utils";

/**
 * 扇形
 * 起点は常に12時方向（上）、そこから時計回りに範囲角度分だけ広がる
 * 回転0度、角度90度の場合 → 12時〜3時（0時〜3時）
 * 頂点がオブジェクト座標に配置される
 * 10.png（円形グラデーション画像）を扇形にクリップして表示
 */
function ConeShape({
	transform,
	angle,
	radius,
	offsetX,
	offsetY,
}: {
	transform: string;
	angle: number;
	radius: number;
	offsetX: number;
	offsetY: number;
}) {
	const clipId = useId();

	// SVGの座標系: 0度=右、90度=下、-90度=上
	// 起点: 12時方向（-90度、上）
	// 終点: 起点から時計回りに範囲角度分
	const startRad = -Math.PI / 2; // 12時方向（上）
	const endRad = startRad + (angle * Math.PI) / 180; // 時計回りに範囲角度分

	// オフセットを適用した頂点位置
	const cx = offsetX;
	const cy = offsetY;

	// SVGの座標系に合わせて計算（Y軸は下が正）
	const x1 = cx + Math.cos(startRad) * radius;
	const y1 = cy + Math.sin(startRad) * radius;
	const x2 = cx + Math.cos(endRad) * radius;
	const y2 = cy + Math.sin(endRad) * radius;

	const largeArc = angle > 180 ? 1 : 0;

	// 時計回り（sweep=1）で描画
	const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

	return (
		<g transform={transform}>
			<defs>
				<clipPath id={clipId}>
					<path d={d} />
				</clipPath>
			</defs>
			{/* 円形グラデーション画像を扇形にクリップ */}
			<image
				href={getIconPath(10)}
				x={cx - radius}
				y={cy - radius}
				width={radius * 2}
				height={radius * 2}
				clipPath={`url(#${clipId})`}
			/>
		</g>
	);
}

export function AoEObject({
	objectId,
	transform,
	color,
	param1,
	param2,
	param3: _param3,
}: {
	objectId: number;
	transform: string;
	color: Color;
	param1?: number;
	param2?: number;
	param3?: number;
}) {
	const id = useId();
	const isOriginalIconMode = useOriginalIcons();

	// DonutAoE以外はオリジナル画像を使用（DonutAoEはmask処理のため後で処理）
	if (objectId !== ObjectIds.DonutAoE) {
		const originalIcon = renderOriginalIconIfEnabled(
			objectId,
			transform,
			color,
			param1,
			param2,
		);
		if (originalIcon) return originalIcon;
	}

	const fill = colorToRgba(color);
	const baseSize = SIZES.AOE_BASE;

	switch (objectId) {
		case ObjectIds.CircleAoE:
			return (
				<circle
					cx={0}
					cy={0}
					r={baseSize / 2}
					fill={fill}
					stroke={COLORS.STROKE_AOE}
					strokeWidth="2"
					transform={transform}
				/>
			);

		case ObjectIds.CircleAoEMoving:
			return <CircleAoEMovingIcon transform={transform} />;

		case ObjectIds.ConeAoE: {
			const angle = param1 ?? 90;
			// バウンディングボックスの中心がオブジェクト座標に来るようにオフセット計算
			const cone = getConeBoundingBox(angle, SIZES.CONE_RADIUS);
			const offsetX = -(cone.minX + cone.width / 2);
			const offsetY = -(cone.minY + cone.height / 2);
			return (
				<ConeShape
					transform={transform}
					angle={angle}
					radius={SIZES.CONE_RADIUS}
					offsetX={offsetX}
					offsetY={offsetY}
				/>
			);
		}

		case ObjectIds.LineAoE: {
			// LineAoE: param1 = 縦幅（長さ）、param2 = 横幅（太さ）
			// 中央基準（中心が原点）
			const length = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
			const thickness = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
			return (
				<rect
					x={-length / 2}
					y={-thickness / 2}
					width={length}
					height={thickness}
					fill={fill}
					transform={transform}
				/>
			);
		}

		case ObjectIds.Gaze:
			return <GazeIcon transform={transform} />;

		case ObjectIds.Area1P:
			return <Area1PIcon transform={transform} />;

		case ObjectIds.Area2P:
			return <Area2PIcon transform={transform} />;

		case ObjectIds.Area3P:
			return <Area3PIcon transform={transform} />;

		case ObjectIds.Area4P:
			return <Area4PIcon transform={transform} />;

		case ObjectIds.DonutAoE: {
			const coneAngle = param1 ?? 360; // 範囲角度（10-360度）
			const donutRange = param2 ?? 50; // 0-240: 0=穴なし, 240=最大
			const maskId = `donut-mask-${id}`;

			// Line param3=8 と同じ太さを最小として残す
			// donutRange=240のとき、残る太さが Line strokeWidth=8 と同じになるように
			const LINE_THICKNESS = 8;

			// オリジナル画像モードの場合は画像にmaskを適用
			const iconSize = OBJECT_BBOX_SIZES[objectId];
			if (isOriginalIconMode && iconSize) {
				// 画像サイズ基準で内径を計算
				const imageOuterRadius = iconSize.width / 2;
				// 残る太さを外径の比率で計算
				// Line strokeWidth=8, DonutAoE size=50 のとき同じ太さになるように
				// 画像内の円が外枠より小さいことを考慮して比率で計算
				const MIN_THICKNESS_RATIO = 1 / 10; // 調整値
				const imageMinThickness = imageOuterRadius * MIN_THICKNESS_RATIO;
				const imageMaxInnerRadius = imageOuterRadius - imageMinThickness;
				const imageInnerRadius = imageMaxInnerRadius * (donutRange / 240);

				// 360度以上の場合は完全な円ドーナツ
				if (coneAngle >= 360) {
					// クリック検知用のドーナツパス（外側時計回り、内側反時計回り）
					const donutPath = [
						`M ${imageOuterRadius} 0`,
						`A ${imageOuterRadius} ${imageOuterRadius} 0 1 1 ${-imageOuterRadius} 0`,
						`A ${imageOuterRadius} ${imageOuterRadius} 0 1 1 ${imageOuterRadius} 0`,
						`M ${imageInnerRadius} 0`,
						`A ${imageInnerRadius} ${imageInnerRadius} 0 1 0 ${-imageInnerRadius} 0`,
						`A ${imageInnerRadius} ${imageInnerRadius} 0 1 0 ${imageInnerRadius} 0`,
						"Z",
					].join(" ");

					return (
						<g transform={transform}>
							<defs>
								<mask id={maskId}>
									<rect
										x={-iconSize.width / 2}
										y={-iconSize.height / 2}
										width={iconSize.width}
										height={iconSize.height}
										fill="white"
									/>
									<circle cx={0} cy={0} r={imageInnerRadius} fill="black" />
								</mask>
							</defs>
							<image
								href={getIconPath(objectId)}
								x={-iconSize.width / 2}
								y={-iconSize.height / 2}
								width={iconSize.width}
								height={iconSize.height}
								preserveAspectRatio="xMidYMid meet"
								mask={`url(#${maskId})`}
								pointerEvents="none"
							/>
							{/* クリック検知用の透明なドーナツパス */}
							<path d={donutPath} fill="transparent" fillRule="evenodd" />
						</g>
					);
				}

				// 360度未満の場合は扇形ドーナツをmaskで適用
				// バウンディングボックスの中心がオブジェクト座標に来るようにオフセット計算
				const bbox =
					imageInnerRadius <= 0
						? getConeBoundingBox(coneAngle, imageOuterRadius)
						: getDonutConeBoundingBox(
								coneAngle,
								imageOuterRadius,
								imageInnerRadius,
							);
				const offsetX = -(bbox.minX + bbox.width / 2);
				const offsetY = -(bbox.minY + bbox.height / 2);

				const startRad = -Math.PI / 2;
				const endRad = startRad + (coneAngle * Math.PI) / 180;

				const outerX1 = offsetX + Math.cos(startRad) * imageOuterRadius;
				const outerY1 = offsetY + Math.sin(startRad) * imageOuterRadius;
				const outerX2 = offsetX + Math.cos(endRad) * imageOuterRadius;
				const outerY2 = offsetY + Math.sin(endRad) * imageOuterRadius;

				const innerX1 = offsetX + Math.cos(startRad) * imageInnerRadius;
				const innerY1 = offsetY + Math.sin(startRad) * imageInnerRadius;
				const innerX2 = offsetX + Math.cos(endRad) * imageInnerRadius;
				const innerY2 = offsetY + Math.sin(endRad) * imageInnerRadius;

				const largeArc = coneAngle > 180 ? 1 : 0;

				const maskPath =
					imageInnerRadius <= 0
						? [
								`M ${offsetX} ${offsetY}`,
								`L ${outerX1} ${outerY1}`,
								`A ${imageOuterRadius} ${imageOuterRadius} 0 ${largeArc} 1 ${outerX2} ${outerY2}`,
								"Z",
							].join(" ")
						: [
								`M ${outerX1} ${outerY1}`,
								`A ${imageOuterRadius} ${imageOuterRadius} 0 ${largeArc} 1 ${outerX2} ${outerY2}`,
								`L ${innerX2} ${innerY2}`,
								`A ${imageInnerRadius} ${imageInnerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1}`,
								"Z",
							].join(" ");

				return (
					<g transform={transform}>
						<defs>
							<mask id={maskId}>
								<path d={maskPath} fill="white" />
							</mask>
						</defs>
						<image
							href={getIconPath(objectId)}
							x={offsetX - imageOuterRadius}
							y={offsetY - imageOuterRadius}
							width={imageOuterRadius * 2}
							height={imageOuterRadius * 2}
							preserveAspectRatio="xMidYMid meet"
							mask={`url(#${maskId})`}
							pointerEvents="none"
						/>
						{/* クリック検知用の透明なパス（maskは視覚的なクリップのみでヒットテストに影響しないため） */}
						<path d={maskPath} fill="transparent" />
					</g>
				);
			}

			// SVGモードの場合
			const outerRadius = baseSize / 2;
			// size=100のとき、残る太さが8pxになるように
			const maxInnerRadius = outerRadius - LINE_THICKNESS;
			const innerRadius = maxInnerRadius * (donutRange / 240);

			// 360度以上の場合は既存のmask方式（完全な円ドーナツ）
			if (coneAngle >= 360) {
				return (
					<g transform={transform}>
						<defs>
							<mask id={maskId}>
								<circle cx={0} cy={0} r={outerRadius} fill="white" />
								<circle cx={0} cy={0} r={innerRadius} fill="black" />
							</mask>
						</defs>
						<circle
							cx={0}
							cy={0}
							r={outerRadius}
							fill={fill}
							stroke={COLORS.STROKE_AOE}
							strokeWidth="2"
							mask={`url(#${maskId})`}
						/>
					</g>
				);
			}

			// 360度未満の場合は扇形ドーナツをパスで描画
			// バウンディングボックスの中心がオブジェクト座標に来るようにオフセット計算
			const bbox =
				innerRadius <= 0
					? getConeBoundingBox(coneAngle, outerRadius)
					: getDonutConeBoundingBox(coneAngle, outerRadius, innerRadius);
			const offsetX = -(bbox.minX + bbox.width / 2);
			const offsetY = -(bbox.minY + bbox.height / 2);

			// 起点: 12時方向（-90度）から時計回りに角度分
			const startRad = -Math.PI / 2; // 12時方向（上）
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
			const d =
				innerRadius <= 0
					? [
							`M ${offsetX} ${offsetY}`, // 中心（オフセット適用）
							`L ${outerX1} ${outerY1}`, // 外弧開始点へ直線
							`A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerX2} ${outerY2}`, // 外弧（時計回り）
							"Z",
						].join(" ")
					: [
							`M ${outerX1} ${outerY1}`, // 外弧開始点
							`A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerX2} ${outerY2}`, // 外弧（時計回り）
							`L ${innerX2} ${innerY2}`, // 内弧終了点へ直線
							`A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1}`, // 内弧（反時計回り）
							"Z",
						].join(" ");

			return (
				<g transform={transform}>
					<path d={d} fill={fill} stroke={COLORS.STROKE_AOE} strokeWidth="2" />
				</g>
			);
		}

		case ObjectIds.Stack:
			return <StackIcon transform={transform} />;

		case ObjectIds.StackLine:
			return <StackLineIcon transform={transform} />;

		case ObjectIds.StackChain:
			return <StackChainIcon transform={transform} />;

		case ObjectIds.KnockbackRadial:
			return <KnockbackRadialIcon transform={transform} />;

		case ObjectIds.KnockbackLine:
			return <KnockbackLineIcon transform={transform} />;

		case ObjectIds.Block:
			return <BlockIcon transform={transform} />;

		case ObjectIds.LockOnRed:
			return <LockOnRedIcon transform={transform} />;

		case ObjectIds.LockOnBlue:
			return <LockOnBlueIcon transform={transform} />;

		case ObjectIds.LockOnPurple:
			return <LockOnPurpleIcon transform={transform} />;

		case ObjectIds.LockOnGreen:
			return <LockOnGreenIcon transform={transform} />;

		case ObjectIds.EmphasisCircle:
			return <EmphasisCircleIcon transform={transform} />;

		case ObjectIds.EmphasisCross:
			return <EmphasisCrossIcon transform={transform} />;

		case ObjectIds.EmphasisSquare:
			return <EmphasisSquareIcon transform={transform} />;

		case ObjectIds.EmphasisTriangle:
			return <EmphasisTriangleIcon transform={transform} />;

		case ObjectIds.Clockwise:
			return <ClockwiseIcon transform={transform} />;

		case ObjectIds.CounterClockwise:
			return <CounterClockwiseIcon transform={transform} />;

		case ObjectIds.Buff:
			return <BuffIcon transform={transform} />;

		case ObjectIds.Debuff:
			return <DebuffIcon transform={transform} />;

		case ObjectIds.ShapeCircle:
			return <ShapeCircleIcon transform={transform} />;

		case ObjectIds.ShapeCross:
			return <ShapeCrossIcon transform={transform} />;

		case ObjectIds.ShapeSquare:
			return <ShapeSquareIcon transform={transform} />;

		case ObjectIds.ShapeTriangle:
			return <ShapeTriangleIcon transform={transform} />;

		case ObjectIds.ShapeArrow:
			return <ShapeArrowIcon transform={transform} />;

		case ObjectIds.ShapeRotation:
			return <ShapeRotationIcon transform={transform} />;

		case ObjectIds.Proximity:
		case ObjectIds.ProximityTarget:
			return (
				<g transform={transform}>
					<circle
						cx={0}
						cy={0}
						r={baseSize / 3}
						fill={COLORS.FILL_PROXIMITY}
						fillOpacity="0.5"
						stroke={COLORS.STROKE_AOE}
						strokeWidth="2"
					/>
					<circle cx={0} cy={0} r={baseSize / 6} fill={COLORS.STROKE_AOE} />
				</g>
			);

		default:
			return (
				<circle
					cx={0}
					cy={0}
					r={baseSize / 2}
					fill={fill}
					stroke={COLORS.STROKE_AOE}
					strokeWidth="2"
					transform={transform}
				/>
			);
	}
}
