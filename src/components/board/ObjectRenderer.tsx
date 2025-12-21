import { useId } from "react";
import type { BoardObject, Color } from "@/lib/stgy";
import { ObjectIds } from "@/lib/stgy";

// ========================================
// 定数定義
// ========================================

/** オブジェクトサイズ定数 */
const SIZES = {
	ROLE_ICON: 24,
	WAYMARK: 32,
	ENEMY_SMALL: 32,
	ENEMY_MEDIUM: 48,
	ENEMY_LARGE: 64,
	FIELD: 64,
	FIELD_LARGE: 256, // SquareGray/CircleGray (4x)
	AOE_BASE: 48,
	CONE_RADIUS: 256,
	LINE_WIDTH: 16,
	PLACEHOLDER: 16,
} as const;

/** 色定数 */
const COLORS = {
	// ストローク
	STROKE_DEFAULT: "#666",
	STROKE_AOE: "#ff8800",
	STROKE_STACK: "#ffff00",
	STROKE_WHITE: "#fff",
	STROKE_ENEMY: "#ff0000",
	// フィル
	FILL_AOE: "rgba(255, 150, 0, 0.4)", // FF14 AoE color
	FILL_ENEMY: "#8b0000",
	FILL_PROXIMITY: "#ffcc00",
	FILL_PLACEHOLDER: "#666",
	FILL_FIELD_GRAY: "rgba(80, 80, 80, 0.6)", // 正方形グレー
	// フィールド縁
	STROKE_FIELD_GRAY: "#888",
	// ロール
	ROLE_TANK: "#3366cc",
	ROLE_HEALER: "#33cc33",
	ROLE_DPS: "#cc3333",
	ROLE_DEFAULT: "#666",
	// ウェイマーク
	WAYMARK_RED: "#cc3333",
	WAYMARK_YELLOW: "#cccc33",
	WAYMARK_BLUE: "#3366cc",
	WAYMARK_PURPLE: "#cc33cc",
	// デバッグ
	DEBUG_GREEN: "#00ff00",
	DEBUG_RED: "#ff0000",
	// 選択
	SELECTION: "#00bfff",
} as const;

/** テキスト関連定数 */
const TEXT = {
	CHAR_WIDTH: 10,
	MIN_BBOX_WIDTH: 40,
	DEFAULT_HEIGHT: 20,
} as const;

// ========================================
// ルックアップテーブル
// ========================================

/** ロールラベルマップ */
const ROLE_LABELS: Record<number, string> = {
	// タンク
	47: "T",
	48: "MT",
	49: "ST",
	// ヒーラー
	50: "H",
	51: "H1",
	52: "H2",
	// DPS
	53: "D",
	54: "D1",
	55: "D2",
	56: "D3",
	57: "D4",
	// その他ロール
	118: "M",
	119: "R",
	120: "PR",
	121: "MR",
	122: "PH",
	123: "BH",
};

/** ロールカラーマップ */
const ROLE_COLORS: Record<number, string> = {
	// タンク (青)
	47: COLORS.ROLE_TANK,
	48: COLORS.ROLE_TANK,
	49: COLORS.ROLE_TANK,
	// ヒーラー (緑)
	50: COLORS.ROLE_HEALER,
	51: COLORS.ROLE_HEALER,
	52: COLORS.ROLE_HEALER,
	122: COLORS.ROLE_HEALER,
	123: COLORS.ROLE_HEALER,
	// DPS (赤)
	53: COLORS.ROLE_DPS,
	54: COLORS.ROLE_DPS,
	55: COLORS.ROLE_DPS,
	56: COLORS.ROLE_DPS,
	57: COLORS.ROLE_DPS,
	118: COLORS.ROLE_DPS,
	119: COLORS.ROLE_DPS,
	120: COLORS.ROLE_DPS,
	121: COLORS.ROLE_DPS,
};

/** ウェイマーク情報マップ */
const WAYMARK_INFO: Record<number, { label: string; color: string }> = {
	79: { label: "A", color: COLORS.WAYMARK_RED },
	80: { label: "B", color: COLORS.WAYMARK_YELLOW },
	81: { label: "C", color: COLORS.WAYMARK_BLUE },
	82: { label: "D", color: COLORS.WAYMARK_PURPLE },
	83: { label: "1", color: COLORS.WAYMARK_RED },
	84: { label: "2", color: COLORS.WAYMARK_YELLOW },
	85: { label: "3", color: COLORS.WAYMARK_BLUE },
	86: { label: "4", color: COLORS.WAYMARK_PURPLE },
};

/** エネミーサイズマップ */
const ENEMY_SIZES: Record<number, number> = {
	60: SIZES.ENEMY_SMALL,
	62: SIZES.ENEMY_MEDIUM,
	64: SIZES.ENEMY_LARGE,
};

// ========================================
// オブジェクトID分類
// ========================================

/** 大きいフィールドID (CircleGray, SquareGray) */
const LARGE_FIELD_IDS: readonly number[] = [
	ObjectIds.CircleGray,
	ObjectIds.SquareGray,
];

/** 円形フィールドID */
const CIRCLE_FIELD_IDS: readonly number[] = [
	ObjectIds.CircleWhiteSolid,
	ObjectIds.CircleWhiteTile,
	ObjectIds.CircleGraySolid,
	ObjectIds.CircleCheck,
	ObjectIds.CircleGray,
];

/** 四角形フィールドID */
const SQUARE_FIELD_IDS: readonly number[] = [
	ObjectIds.SquareWhiteSolid,
	ObjectIds.SquareWhiteTile,
	ObjectIds.SquareGraySolid,
	ObjectIds.SquareCheck,
	ObjectIds.SquareGray,
];

/** フィールドオブジェクトID */
const FIELD_OBJECT_IDS: readonly number[] = [
	...CIRCLE_FIELD_IDS,
	...SQUARE_FIELD_IDS,
];

/** AoEオブジェクトID */
const AOE_OBJECT_IDS: readonly number[] = [
	ObjectIds.CircleAoE,
	ObjectIds.ConeAoE,
	ObjectIds.LineAoE,
	ObjectIds.Line,
	ObjectIds.Gaze,
	ObjectIds.Stack,
	ObjectIds.StackLine,
	ObjectIds.Proximity,
	ObjectIds.DonutAoE,
	ObjectIds.StackChain,
	ObjectIds.ProximityTarget,
	ObjectIds.Tankbuster,
	ObjectIds.KnockbackRadial,
	ObjectIds.KnockbackLine,
	ObjectIds.Block,
	ObjectIds.TargetMarker,
	ObjectIds.CircleAoEMoving,
	ObjectIds.Area1P,
	ObjectIds.Area2P,
	ObjectIds.Area3P,
	ObjectIds.Area4P,
	ObjectIds.LockOnRed,
	ObjectIds.LockOnBlue,
	ObjectIds.LockOnPurple,
	ObjectIds.LockOnGreen,
	ObjectIds.EmphasisCircle,
	ObjectIds.EmphasisCross,
	ObjectIds.EmphasisSquare,
	ObjectIds.EmphasisTriangle,
	ObjectIds.Clockwise,
	ObjectIds.CounterClockwise,
	ObjectIds.Buff,
	ObjectIds.Debuff,
	ObjectIds.ShapeCircle,
	ObjectIds.ShapeCross,
	ObjectIds.ShapeTriangle,
	ObjectIds.ShapeArrow,
	ObjectIds.ShapeRotation,
];

/** エネミーオブジェクトID */
const ENEMY_OBJECT_IDS: readonly number[] = [
	ObjectIds.EnemySmall,
	ObjectIds.EnemyMedium,
	ObjectIds.EnemyLarge,
];

/** ジョブアイコンID */
const JOB_ICON_IDS: readonly number[] = [
	// 基本クラス
	ObjectIds.Gladiator,
	ObjectIds.Pugilist,
	ObjectIds.Marauder,
	ObjectIds.Lancer,
	ObjectIds.Archer,
	ObjectIds.Conjurer,
	ObjectIds.Thaumaturge,
	ObjectIds.Arcanist,
	ObjectIds.Rogue,
	// ジョブ
	ObjectIds.Paladin,
	ObjectIds.Monk,
	ObjectIds.Warrior,
	ObjectIds.Dragoon,
	ObjectIds.Bard,
	ObjectIds.WhiteMage,
	ObjectIds.BlackMage,
	ObjectIds.Summoner,
	ObjectIds.Scholar,
	ObjectIds.Ninja,
	ObjectIds.Machinist,
	ObjectIds.DarkKnight,
	ObjectIds.Astrologian,
	ObjectIds.Samurai,
	ObjectIds.RedMage,
	ObjectIds.BlueMage,
	ObjectIds.Gunbreaker,
	ObjectIds.Dancer,
	ObjectIds.Reaper,
	ObjectIds.Sage,
	ObjectIds.Viper,
	ObjectIds.Pictomancer,
];

/** ジョブ略称マップ */
const JOB_ABBREVIATIONS: Record<number, string> = {
	// 基本クラス
	[ObjectIds.Gladiator]: "剣",
	[ObjectIds.Pugilist]: "格",
	[ObjectIds.Marauder]: "斧",
	[ObjectIds.Lancer]: "槍",
	[ObjectIds.Archer]: "弓",
	[ObjectIds.Conjurer]: "幻",
	[ObjectIds.Thaumaturge]: "呪",
	[ObjectIds.Arcanist]: "巴",
	[ObjectIds.Rogue]: "双",
	// タンク
	[ObjectIds.Paladin]: "ナ",
	[ObjectIds.Warrior]: "戦",
	[ObjectIds.DarkKnight]: "暗",
	[ObjectIds.Gunbreaker]: "ガ",
	// ヒーラー
	[ObjectIds.WhiteMage]: "白",
	[ObjectIds.Scholar]: "学",
	[ObjectIds.Astrologian]: "占",
	[ObjectIds.Sage]: "賢",
	// メレーDPS
	[ObjectIds.Monk]: "モ",
	[ObjectIds.Dragoon]: "竜",
	[ObjectIds.Ninja]: "忍",
	[ObjectIds.Samurai]: "侍",
	[ObjectIds.Reaper]: "リ",
	[ObjectIds.Viper]: "ヴ",
	// レンジDPS
	[ObjectIds.Bard]: "詩",
	[ObjectIds.Machinist]: "機",
	[ObjectIds.Dancer]: "踊",
	// キャスターDPS
	[ObjectIds.BlackMage]: "黒",
	[ObjectIds.Summoner]: "召",
	[ObjectIds.RedMage]: "赤",
	[ObjectIds.Pictomancer]: "ピ",
	[ObjectIds.BlueMage]: "青",
};

/** ジョブロール判定 */
const JOB_ROLES: Record<number, "tank" | "healer" | "melee" | "ranged" | "caster"> = {
	// 基本クラス
	[ObjectIds.Gladiator]: "tank",
	[ObjectIds.Marauder]: "tank",
	[ObjectIds.Pugilist]: "melee",
	[ObjectIds.Lancer]: "melee",
	[ObjectIds.Rogue]: "melee",
	[ObjectIds.Archer]: "ranged",
	[ObjectIds.Conjurer]: "healer",
	[ObjectIds.Thaumaturge]: "caster",
	[ObjectIds.Arcanist]: "caster",
	// タンク
	[ObjectIds.Paladin]: "tank",
	[ObjectIds.Warrior]: "tank",
	[ObjectIds.DarkKnight]: "tank",
	[ObjectIds.Gunbreaker]: "tank",
	// ヒーラー
	[ObjectIds.WhiteMage]: "healer",
	[ObjectIds.Scholar]: "healer",
	[ObjectIds.Astrologian]: "healer",
	[ObjectIds.Sage]: "healer",
	// メレーDPS
	[ObjectIds.Monk]: "melee",
	[ObjectIds.Dragoon]: "melee",
	[ObjectIds.Ninja]: "melee",
	[ObjectIds.Samurai]: "melee",
	[ObjectIds.Reaper]: "melee",
	[ObjectIds.Viper]: "melee",
	// レンジDPS
	[ObjectIds.Bard]: "ranged",
	[ObjectIds.Machinist]: "ranged",
	[ObjectIds.Dancer]: "ranged",
	// キャスターDPS
	[ObjectIds.BlackMage]: "caster",
	[ObjectIds.Summoner]: "caster",
	[ObjectIds.RedMage]: "caster",
	[ObjectIds.Pictomancer]: "caster",
	[ObjectIds.BlueMage]: "caster",
};

/** ジョブロールカラー */
const JOB_ROLE_COLORS: Record<string, string> = {
	tank: COLORS.ROLE_TANK,
	healer: COLORS.ROLE_HEALER,
	melee: COLORS.ROLE_DPS,
	ranged: "#cc6633", // レンジDPSはオレンジ
	caster: "#cc33cc", // キャスターDPSは紫
};

// ========================================
// コンポーネント
// ========================================

interface ObjectRendererProps {
	object: BoardObject;
	index: number;
	showBoundingBox?: boolean;
	selected?: boolean;
	onSelect?: (index: number) => void;
}

export function ObjectRenderer({
	object,
	index,
	showBoundingBox = false,
	selected = false,
	onSelect,
}: ObjectRendererProps) {
	const {
		objectId,
		position,
		rotation,
		size,
		color,
		flags,
		text,
		param1,
		param2,
	} = object;
	const scale = size / 100;

	// 変換を適用
	const transform = buildTransform(
		position.x,
		position.y,
		rotation,
		scale,
		flags.flipHorizontal,
		flags.flipVertical,
	);

	// バウンディングボックスのサイズを取得
	const bbox = getObjectBoundingBox(objectId, param1, param2, text);

	// クリックハンドラ
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onSelect?.(index);
	};

	// オブジェクトタイプに応じてレンダリング
	let content: React.ReactNode;

	if (isFieldObject(objectId)) {
		content = (
			<FieldObject objectId={objectId} transform={transform} color={color} />
		);
	} else if (isAoEObject(objectId)) {
		content = (
			<AoEObject
				objectId={objectId}
				transform={transform}
				color={color}
				param1={param1}
				param2={param2}
			/>
		);
	} else if (isJobIcon(objectId)) {
		content = <JobIcon objectId={objectId} transform={transform} />;
	} else if (isRoleIcon(objectId)) {
		content = <RoleIcon objectId={objectId} transform={transform} />;
	} else if (isWaymark(objectId)) {
		content = <WaymarkIcon objectId={objectId} transform={transform} />;
	} else if (isEnemy(objectId)) {
		content = <EnemyIcon objectId={objectId} transform={transform} />;
	} else if (objectId === ObjectIds.Text && text) {
		content = <TextObject transform={transform} text={text} color={color} />;
	} else {
		content = <PlaceholderObject objectId={objectId} transform={transform} />;
	}

	// 選択インジケーター
	const selectionIndicator = selected && (
		<SelectionIndicator
			x={position.x}
			y={position.y}
			width={bbox.width * scale}
			height={bbox.height * scale}
			offsetX={(bbox.offsetX ?? 0) * scale}
			offsetY={(bbox.offsetY ?? 0) * scale}
			rotation={rotation}
		/>
	);

	if (!showBoundingBox) {
		return (
			// biome-ignore lint/a11y/useSemanticElements: SVG elements cannot be replaced with button
			<g
				role="button"
				tabIndex={0}
				onClick={handleClick}
				onKeyDown={(e) => e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)}
				style={{ cursor: "pointer" }}
			>
				{content}
				{selectionIndicator}
			</g>
		);
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: SVG elements cannot be replaced with button
		<g
			role="button"
			tabIndex={0}
			onClick={handleClick}
			onKeyDown={(e) => e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)}
			style={{ cursor: "pointer" }}
		>
			{content}
			{selectionIndicator}
			<BoundingBox
				x={position.x}
				y={position.y}
				width={bbox.width * scale}
				height={bbox.height * scale}
				offsetX={(bbox.offsetX ?? 0) * scale}
				offsetY={(bbox.offsetY ?? 0) * scale}
				rotation={rotation}
				objectId={objectId}
			/>
			<DebugInfo object={object} />
		</g>
	);
}

// 選択インジケーターコンポーネント
function SelectionIndicator({
	x,
	y,
	width,
	height,
	offsetX,
	offsetY,
	rotation,
}: {
	x: number;
	y: number;
	width: number;
	height: number;
	offsetX: number;
	offsetY: number;
	rotation: number;
}) {
	const boxCenterX = offsetX;
	const boxCenterY = offsetY;
	const handleSize = 6;

	// 四隅のハンドル位置
	const corners = [
		{ x: boxCenterX - width / 2, y: boxCenterY - height / 2 },
		{ x: boxCenterX + width / 2, y: boxCenterY - height / 2 },
		{ x: boxCenterX - width / 2, y: boxCenterY + height / 2 },
		{ x: boxCenterX + width / 2, y: boxCenterY + height / 2 },
	];

	return (
		<g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
			{/* 選択枠 */}
			<rect
				x={boxCenterX - width / 2}
				y={boxCenterY - height / 2}
				width={width}
				height={height}
				fill="none"
				stroke={COLORS.SELECTION}
				strokeWidth="2"
			/>
			{/* 四隅のハンドル */}
			{corners.map((corner) => (
				<rect
					key={`${corner.x}-${corner.y}`}
					x={corner.x - handleSize / 2}
					y={corner.y - handleSize / 2}
					width={handleSize}
					height={handleSize}
					fill={COLORS.SELECTION}
					stroke="#fff"
					strokeWidth="1"
				/>
			))}
		</g>
	);
}

// デバッグ情報表示コンポーネント
function DebugInfo({ object }: { object: BoardObject }) {
	const { objectId, position, rotation, size, param1, param2, text, flags } = object;

	const lines = [
		`ID: ${objectId}`,
		`Pos: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`,
		`Rot: ${rotation}° Size: ${size}%`,
	];

	if (param1 !== undefined) lines.push(`P1: ${param1}`);
	if (param2 !== undefined) lines.push(`P2: ${param2}`);
	if (text) lines.push(`Text: "${text}"`);

	const flagList: string[] = [];
	if (flags.flipHorizontal) flagList.push("FlipH");
	if (flags.flipVertical) flagList.push("FlipV");
	if (!flags.visible) flagList.push("Hidden");
	if (flagList.length > 0) lines.push(`Flags: ${flagList.join(", ")}`);

	const lineHeight = 11;
	const padding = 4;
	const boxWidth = 120;
	const boxHeight = lines.length * lineHeight + padding * 2;

	// ボックス位置（オブジェクトの右上に表示）
	const boxX = position.x + 20;
	const boxY = position.y - boxHeight - 10;

	return (
		<g>
			{/* 背景ボックス */}
			<rect
				x={boxX}
				y={boxY}
				width={boxWidth}
				height={boxHeight}
				fill="rgba(0, 0, 0, 0.8)"
				stroke={COLORS.DEBUG_GREEN}
				strokeWidth="1"
				rx="3"
			/>
			{/* テキスト */}
			{lines.map((line, i) => (
				<text
					key={line}
					x={boxX + padding}
					y={boxY + padding + (i + 1) * lineHeight - 2}
					fill={COLORS.DEBUG_GREEN}
					fontSize="9"
					fontFamily="monospace"
				>
					{line}
				</text>
			))}
			{/* オブジェクトへの線 */}
			<line
				x1={boxX}
				y1={boxY + boxHeight}
				x2={position.x}
				y2={position.y}
				stroke={COLORS.DEBUG_GREEN}
				strokeWidth="1"
				strokeDasharray="2,2"
			/>
		</g>
	);
}

// バウンディングボックスコンポーネント
function BoundingBox({
	x,
	y,
	width,
	height,
	offsetX,
	offsetY,
	rotation,
	objectId,
}: {
	x: number;
	y: number;
	width: number;
	height: number;
	offsetX: number;
	offsetY: number;
	rotation: number;
	objectId: number;
}) {
	// オフセットがある場合、バウンディングボックスの中心をオフセット位置に移動
	const boxCenterX = offsetX;
	const boxCenterY = offsetY;

	return (
		<g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
			<rect
				x={boxCenterX - width / 2}
				y={boxCenterY - height / 2}
				width={width}
				height={height}
				fill="none"
				stroke={COLORS.DEBUG_GREEN}
				strokeWidth="1"
				strokeDasharray="4,2"
			/>
			{/* オブジェクトの原点 */}
			<circle cx={0} cy={0} r={2} fill={COLORS.DEBUG_RED} />
			{/* バウンディングボックスの中心 */}
			{(offsetX !== 0 || offsetY !== 0) && (
				<circle cx={boxCenterX} cy={boxCenterY} r={2} fill={COLORS.DEBUG_GREEN} />
			)}
			{/* オブジェクトID表示 */}
			<text
				x={boxCenterX - width / 2 + 2}
				y={boxCenterY - height / 2 - 4}
				fill={COLORS.DEBUG_GREEN}
				fontSize="10"
				fontFamily="monospace"
			>
				{objectId}
			</text>
		</g>
	);
}

// 扇形の外接矩形を計算（中心を原点とした相対座標）
function getConeBoundingBox(
	angle: number,
	radius: number,
): { minX: number; minY: number; width: number; height: number } {
	const startAngle = 0;
	const endAngle = angle;

	// 頂点を収集: 中心(0,0)、開始点、終了点
	const points: { x: number; y: number }[] = [
		{ x: 0, y: 0 },
		{
			x: Math.cos((startAngle * Math.PI) / 180) * radius,
			y: -Math.sin((startAngle * Math.PI) / 180) * radius,
		},
		{
			x: Math.cos((endAngle * Math.PI) / 180) * radius,
			y: -Math.sin((endAngle * Math.PI) / 180) * radius,
		},
	];

	// 0, 90, 180, 270度が扇形の範囲内にあれば追加
	const cardinalAngles = [0, 90, 180, 270];
	for (const deg of cardinalAngles) {
		if (deg > startAngle && deg < endAngle) {
			points.push({
				x: Math.cos((deg * Math.PI) / 180) * radius,
				y: -Math.sin((deg * Math.PI) / 180) * radius,
			});
		}
	}

	const xs = points.map((p) => p.x);
	const ys = points.map((p) => p.y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	return { minX, minY, width: maxX - minX, height: maxY - minY };
}

// オブジェクトのバウンディングボックスサイズとオフセットを取得
function getObjectBoundingBox(
	objectId: number,
	param1?: number,
	_param2?: number,
	text?: string,
): { width: number; height: number; offsetX?: number; offsetY?: number } {
	// フィールド
	if (isFieldObject(objectId)) {
		const size = LARGE_FIELD_IDS.includes(objectId) ? SIZES.FIELD_LARGE : SIZES.FIELD;
		return { width: size, height: size };
	}

	// AoE
	if (isAoEObject(objectId)) {
		// 扇形
		if (objectId === ObjectIds.ConeAoE) {
			const angle = param1 ?? 90;
			const cone = getConeBoundingBox(angle, SIZES.CONE_RADIUS);
			return {
				width: cone.width,
				height: cone.height,
				offsetX: 0,
				offsetY: 0,
			};
		}

		if (objectId === ObjectIds.LineAoE || objectId === ObjectIds.Line) {
			return { width: SIZES.LINE_WIDTH, height: SIZES.AOE_BASE * 2 };
		}
		return { width: SIZES.AOE_BASE, height: SIZES.AOE_BASE };
	}

	// テキスト
	if (objectId === ObjectIds.Text) {
		const textLength = text?.length ?? 4;
		const width = Math.max(textLength * TEXT.CHAR_WIDTH, TEXT.MIN_BBOX_WIDTH);
		return { width, height: TEXT.DEFAULT_HEIGHT };
	}

	// ロール/ジョブアイコン
	if (isRoleIcon(objectId)) {
		return { width: SIZES.ROLE_ICON, height: SIZES.ROLE_ICON };
	}

	// ウェイマーク
	if (isWaymark(objectId)) {
		return { width: SIZES.WAYMARK, height: SIZES.WAYMARK };
	}

	// エネミー
	const enemySize = ENEMY_SIZES[objectId];
	if (enemySize) {
		return { width: enemySize, height: enemySize };
	}

	// 特殊アイコン（サイズが大きいもの）
	const specialIconSizes: Record<number, { width: number; height: number }> = {
		[ObjectIds.Gaze]: { width: 90, height: 90 },
		[ObjectIds.Block]: { width: 60, height: 60 },
		[ObjectIds.LockOnRed]: { width: 70, height: 70 },
		[ObjectIds.LockOnBlue]: { width: 68, height: 68 },
		[ObjectIds.LockOnPurple]: { width: 70, height: 70 },
		[ObjectIds.LockOnGreen]: { width: 60, height: 70 },
		[ObjectIds.EmphasisCircle]: { width: 56, height: 56 },
		[ObjectIds.EmphasisCross]: { width: 68, height: 68 },
		[ObjectIds.EmphasisSquare]: { width: 64, height: 64 },
		[ObjectIds.EmphasisTriangle]: { width: 64, height: 64 },
		[ObjectIds.Clockwise]: { width: 72, height: 40 },
		[ObjectIds.CounterClockwise]: { width: 72, height: 40 },
	};
	const specialSize = specialIconSizes[objectId];
	if (specialSize) {
		return specialSize;
	}

	// デフォルト
	return { width: SIZES.WAYMARK, height: SIZES.WAYMARK };
}

function buildTransform(
	x: number,
	y: number,
	rotation: number,
	scale: number,
	flipH: boolean,
	flipV: boolean,
): string {
	const parts = [`translate(${x}, ${y})`];
	if (rotation !== 0) {
		parts.push(`rotate(${rotation})`);
	}
	const scaleX = flipH ? -scale : scale;
	const scaleY = flipV ? -scale : scale;
	if (scaleX !== 1 || scaleY !== 1) {
		parts.push(`scale(${scaleX}, ${scaleY})`);
	}
	return parts.join(" ");
}

function colorToRgba(color: Color): string {
	const alpha = 1 - color.opacity / 100;
	return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function isFieldObject(id: number): boolean {
	return FIELD_OBJECT_IDS.includes(id);
}

function isAoEObject(id: number): boolean {
	return AOE_OBJECT_IDS.includes(id);
}

function isRoleIcon(id: number): boolean {
	// ジョブアイコン (18-46, 101-102) とロールアイコン (47-57, 118-123)
	return (
		(id >= 18 && id <= 57) ||
		(id >= 101 && id <= 102) ||
		(id >= 118 && id <= 123)
	);
}

function isWaymark(id: number): boolean {
	return id >= ObjectIds.WaymarkA && id <= ObjectIds.Waymark4;
}

function isEnemy(id: number): boolean {
	return ENEMY_OBJECT_IDS.includes(id);
}

function isJobIcon(id: number): boolean {
	return JOB_ICON_IDS.includes(id);
}

// フィールドオブジェクト
function FieldObject({
	objectId,
	transform,
	color,
}: {
	objectId: number;
	transform: string;
	color: Color;
}) {
	const fill = colorToRgba(color);
	const size = LARGE_FIELD_IDS.includes(objectId) ? SIZES.FIELD_LARGE : SIZES.FIELD;

	// 円形フィールド
	if (CIRCLE_FIELD_IDS.includes(objectId)) {
		return (
			<circle
				cx={0}
				cy={0}
				r={size / 2}
				fill={fill}
				stroke={COLORS.STROKE_DEFAULT}
				strokeWidth="1"
				transform={transform}
			/>
		);
	}

	// 正方形グレー（縁ありグレー）
	if (objectId === ObjectIds.SquareGray) {
		return (
			<rect
				x={-size / 2}
				y={-size / 2}
				width={size}
				height={size}
				fill={COLORS.FILL_FIELD_GRAY}
				stroke={COLORS.STROKE_FIELD_GRAY}
				strokeWidth="2"
				transform={transform}
			/>
		);
	}

	// 四角形フィールド
	return (
		<rect
			x={-size / 2}
			y={-size / 2}
			width={size}
			height={size}
			fill={fill}
			stroke={COLORS.STROKE_DEFAULT}
			strokeWidth="1"
			transform={transform}
		/>
	);
}

// AoEオブジェクト
function AoEObject({
	objectId,
	transform,
	color,
	param1,
	param2,
}: {
	objectId: number;
	transform: string;
	color: Color;
	param1?: number;
	param2?: number;
}) {
	const fill = colorToRgba(color);
	const baseSize = SIZES.AOE_BASE;

	switch (objectId) {
		case ObjectIds.CircleAoE:
		case ObjectIds.CircleAoEMoving:
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

		case ObjectIds.ConeAoE: {
			const angle = param1 ?? 90;
			// バウンディングボックスの中心が座標位置になるようにオフセット計算
			const cone = getConeBoundingBox(angle, SIZES.CONE_RADIUS);
			const offsetX = -(cone.minX + cone.width / 2);
			const offsetY = -(cone.minY + cone.height / 2);
			return (
				<ConeShape
					transform={transform}
					angle={angle}
					radius={SIZES.CONE_RADIUS}
					fill={COLORS.FILL_AOE}
					offsetX={offsetX}
					offsetY={offsetY}
				/>
			);
		}

		case ObjectIds.LineAoE:
		case ObjectIds.Line:
			return (
				<rect
					x={-SIZES.LINE_WIDTH / 2}
					y={-baseSize}
					width={SIZES.LINE_WIDTH}
					height={baseSize * 2}
					fill={fill}
					stroke={COLORS.STROKE_AOE}
					strokeWidth="2"
					transform={transform}
				/>
			);

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
			const innerRadius = param2 ?? 20;
			return (
				<g transform={transform}>
					<circle
						cx={0}
						cy={0}
						r={baseSize / 2}
						fill={fill}
						stroke={COLORS.STROKE_AOE}
						strokeWidth="2"
					/>
					<circle cx={0} cy={0} r={innerRadius / 2} fill="#1a1a1a" />
				</g>
			);
		}

		case ObjectIds.Stack:
		case ObjectIds.StackLine:
		case ObjectIds.StackChain:
			return (
				<g transform={transform}>
					<circle
						cx={0}
						cy={0}
						r={baseSize / 3}
						fill={fill}
						stroke={COLORS.STROKE_STACK}
						strokeWidth="3"
					/>
					<text
						textAnchor="middle"
						dy="5"
						fill={COLORS.STROKE_WHITE}
						fontSize="14"
						fontWeight="bold"
					>
						集
					</text>
				</g>
			);

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

// 扇形
// 回転0度、角度90度の場合 → 0度〜90度の扇（右上象限）
// バウンディングボックスの中心が座標位置になるようにオフセットを適用
function ConeShape({
	transform,
	angle,
	radius,
	fill,
	offsetX,
	offsetY,
}: {
	transform: string;
	angle: number;
	radius: number;
	fill: string;
	offsetX: number;
	offsetY: number;
}) {
	const startRad = 0;
	const endRad = angle * (Math.PI / 180);

	// オフセットを適用した頂点位置
	const cx = offsetX;
	const cy = offsetY;

	const x1 = cx + Math.cos(startRad) * radius;
	const y1 = cy - Math.sin(startRad) * radius; // SVGはY軸が下向きなので反転
	const x2 = cx + Math.cos(endRad) * radius;
	const y2 = cy - Math.sin(endRad) * radius;

	const largeArc = angle > 180 ? 1 : 0;

	// SVGのY軸反転により、sweepは0（反時計回り）
	const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2} Z`;

	return (
		<path
			d={d}
			fill={fill}
			stroke={COLORS.STROKE_AOE}
			strokeWidth="2"
			transform={transform}
		/>
	);
}

// ロール/ジョブアイコン
function RoleIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const label = ROLE_LABELS[objectId] ?? "?";
	const bgColor = ROLE_COLORS[objectId] ?? COLORS.ROLE_DEFAULT;
	const size = SIZES.ROLE_ICON;

	return (
		<g transform={transform}>
			<circle
				cx={0}
				cy={0}
				r={size / 2}
				fill={bgColor}
				stroke={COLORS.STROKE_WHITE}
				strokeWidth="1"
			/>
			<text
				textAnchor="middle"
				dy="5"
				fill={COLORS.STROKE_WHITE}
				fontSize="10"
				fontWeight="bold"
			>
				{label}
			</text>
		</g>
	);
}

// フィールドマーカー (ウェイマーク)
function WaymarkIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const size = SIZES.WAYMARK;
	const info = WAYMARK_INFO[objectId] ?? { label: "?", color: COLORS.ROLE_DEFAULT };

	return (
		<g transform={transform}>
			<circle
				cx={0}
				cy={0}
				r={size / 2}
				fill={info.color}
				stroke={COLORS.STROKE_WHITE}
				strokeWidth="2"
			/>
			<text
				textAnchor="middle"
				dy="6"
				fill={COLORS.STROKE_WHITE}
				fontSize="16"
				fontWeight="bold"
			>
				{info.label}
			</text>
		</g>
	);
}

// エネミー
function EnemyIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const id = useId();
	const size = ENEMY_SIZES[objectId] ?? SIZES.ENEMY_SMALL;
	// 元のSVGは100x100なのでスケール係数を計算
	const scale = size / 100;

	// エネミータイプに応じた色設定
	const getColorScheme = () => {
		switch (objectId) {
			case ObjectIds.EnemySmall:
				// 紫色のシールド（グロー効果あり）
				return {
					gradientId: `enemySmallGrad-${id}`,
					glowId: `enemySmallGlow-${id}`,
					gradientColors: ["#b366ff", "#6600cc", "#330066"],
					strokeColor: "#ff66ff",
					faceColor: "#ff66ff",
					hasGlow: true,
				};
			case ObjectIds.EnemyMedium:
				// 青色のシールド
				return {
					gradientId: `enemyMediumGrad-${id}`,
					glowId: null,
					gradientColors: ["#0033cc", "#000066", "#000000"],
					strokeColor: "#80dfff",
					faceColor: "#80dfff",
					hasGlow: false,
				};
			case ObjectIds.EnemyLarge:
			default:
				// 赤茶色のシールド
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

	// シールドのパス（元SVGのパスをスケーリング）
	const shieldPath =
		objectId === ObjectIds.EnemySmall
			? // エネミー小：角が上に尖った形状
				`M ${22 * scale} ${30 * scale}
				Q ${15 * scale} ${10 * scale} ${8 * scale} ${2 * scale}
				Q ${50 * scale} ${22 * scale} ${92 * scale} ${2 * scale}
				Q ${85 * scale} ${10 * scale} ${78 * scale} ${30 * scale}
				C ${88 * scale} ${50 * scale} ${82 * scale} ${80 * scale} ${50 * scale} ${98 * scale}
				C ${18 * scale} ${80 * scale} ${12 * scale} ${50 * scale} ${22 * scale} ${30 * scale} Z`
			: // エネミー中・大：少し丸みのある形状
				`M ${20 * scale} ${25 * scale}
				L ${15 * scale} ${15 * scale}
				Q ${50 * scale} ${25 * scale} ${85 * scale} ${15 * scale}
				L ${80 * scale} ${25 * scale}
				C ${90 * scale} ${45 * scale} ${85 * scale} ${75 * scale} ${50 * scale} ${95 * scale}
				C ${15 * scale} ${75 * scale} ${10 * scale} ${45 * scale} ${20 * scale} ${25 * scale} Z`;

	// エネミー大のみ外縁を追加
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
					<stop offset="0%" stopColor={colors.gradientColors[0]} stopOpacity="1" />
					<stop offset={objectId === ObjectIds.EnemySmall ? "60%" : "70%"} stopColor={colors.gradientColors[1]} stopOpacity="1" />
					<stop offset="100%" stopColor={colors.gradientColors[2]} stopOpacity="1" />
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

			{/* エネミー大の外縁 */}
			{outerPath && (
				<path d={outerPath} fill="#ffccaa" stroke="none" />
			)}

			{/* シールド本体 */}
			<path
				d={shieldPath}
				fill={`url(#${colors.gradientId})`}
				stroke={colors.strokeColor}
				strokeWidth={objectId === ObjectIds.EnemySmall ? 2.5 * scale : 2 * scale}
				strokeLinejoin="round"
				filter={colors.hasGlow && colors.glowId ? `url(#${colors.glowId})` : undefined}
			/>

			{/* 顔のパーツ */}
			<g
				fill={colors.faceColor}
				opacity={objectId === ObjectIds.EnemySmall ? 1 : 0.9}
				filter={colors.hasGlow && colors.glowId ? `url(#${colors.glowId})` : undefined}
			>
				{/* 左目 */}
				<path
					d={`M ${32 * scale} ${35 * scale}
						L ${45 * scale} ${38 * scale}
						L ${35 * scale} ${48 * scale} Z`}
				/>
				{/* 右目 */}
				<path
					d={`M ${68 * scale} ${35 * scale}
						L ${55 * scale} ${38 * scale}
						L ${65 * scale} ${48 * scale} Z`}
				/>
				{/* 口 */}
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

// ジョブアイコン
function JobIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const abbreviation = JOB_ABBREVIATIONS[objectId] ?? "?";
	const role = JOB_ROLES[objectId] ?? "melee";
	const bgColor = JOB_ROLE_COLORS[role];
	const size = 24;

	return (
		<g transform={transform}>
			{/* 背景円 */}
			<circle
				cx={0}
				cy={0}
				r={size / 2}
				fill={bgColor}
				stroke="#ffffff"
				strokeWidth="2"
			/>
			{/* ジョブ略称 */}
			<text
				x={0}
				y={0}
				textAnchor="middle"
				dominantBaseline="central"
				fill="#ffffff"
				fontSize="14"
				fontWeight="bold"
			>
				{abbreviation}
			</text>
		</g>
	);
}

// テキストオブジェクト
function TextObject({
	transform,
	text,
	color,
}: {
	transform: string;
	text: string;
	color: Color;
}) {
	return (
		<text
			transform={transform}
			textAnchor="middle"
			dy="5"
			fill={colorToRgba(color)}
			fontSize="14"
		>
			{text}
		</text>
	);
}

// 視線攻撃アイコン
function GazeIcon({ transform }: { transform: string }) {
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
			{/* 背景グロー */}
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

			{/* 放射状の光線 */}
			{rays}

			{/* 目の形状（楕円レンズ型） */}
			<ellipse
				cx={0}
				cy={0}
				rx={eyeWidth / 2}
				ry={eyeHeight / 2}
				fill="#440000"
				stroke="#ff4477"
				strokeWidth="2"
			/>

			{/* 瞳のグロー */}
			<circle cx={0} cy={0} r={pupilRadius + 4} fill={`url(#${pupilGlowId})`} />

			{/* 瞳 */}
			<circle cx={0} cy={0} r={pupilRadius} fill="#fff" />
		</g>
	);
}

// 受け止め攻撃（ブロック）アイコン
function BlockIcon({ transform }: { transform: string }) {
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
				{/* 外輪のグラデーション（茶色→明るい茶色） */}
				<radialGradient id={outerGradientId}>
					<stop offset="0%" stopColor="#f5e6d3" stopOpacity="1" />
					<stop offset="70%" stopColor="#c8a080" stopOpacity="1" />
					<stop offset="100%" stopColor="#8b5a2b" stopOpacity="1" />
				</radialGradient>
				{/* 内側のグラデーション（白→薄茶） */}
				<radialGradient id={innerGradientId}>
					<stop offset="0%" stopColor="#fff8f0" stopOpacity="1" />
					<stop offset="60%" stopColor="#fff" stopOpacity="1" />
					<stop offset="100%" stopColor="#e8d8c8" stopOpacity="1" />
				</radialGradient>
				{/* 中心のグロー */}
				<radialGradient id={centerGlowId}>
					<stop offset="0%" stopColor="#fff" stopOpacity="1" />
					<stop offset="30%" stopColor="#ffee88" stopOpacity="1" />
					<stop offset="60%" stopColor="#ffaa44" stopOpacity="0.8" />
					<stop offset="100%" stopColor="#ff8800" stopOpacity="0" />
				</radialGradient>
			</defs>

			{/* 外輪 */}
			<circle
				cx={0}
				cy={0}
				r={outerRadius}
				fill={`url(#${outerGradientId})`}
				stroke="#6b3a1a"
				strokeWidth="2"
			/>

			{/* 内側の白い領域 */}
			<circle
				cx={0}
				cy={0}
				r={innerRadius}
				fill={`url(#${innerGradientId})`}
			/>

			{/* 中心のグロー */}
			<circle
				cx={0}
				cy={0}
				r={centerRadius + 8}
				fill={`url(#${centerGlowId})`}
			/>

			{/* 中心の円 */}
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

// 4人用エリアアイコン
function Area4PIcon({ transform }: { transform: string }) {
	const id = useId();
	const bgGlowId = `area4pGlow-${id}`;
	const orbGlowId = `area4pOrbGlow-${id}`;

	const outerRadius = 32;
	const orbRadius = 8;
	const orbOffset = 12;
	const notchCount = 16;

	// ギザギザの外周パスを生成
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

	// 4つの球の位置
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

			{/* 背景グロー */}
			<circle cx={0} cy={0} r={outerRadius + 10} fill={`url(#${bgGlowId})`} />

			{/* ギザギザの外周 */}
			<path
				d={notchPath.join(" ")}
				fill="rgba(255, 150, 200, 0.4)"
				stroke="#ffccee"
				strokeWidth="1.5"
			/>

			{/* 内側の円 */}
			<circle
				cx={0}
				cy={0}
				r={outerRadius - 6}
				fill="none"
				stroke="rgba(255, 200, 230, 0.5)"
				strokeWidth="1"
			/>

			{/* 装飾的な曲線（球の間を繋ぐ） */}
			<path
				d={`M ${-orbOffset} 0 Q 0 ${-orbOffset * 0.5} ${orbOffset} 0`}
				fill="none"
				stroke="rgba(255, 180, 220, 0.6)"
				strokeWidth="1.5"
			/>
			<path
				d={`M ${-orbOffset} 0 Q 0 ${orbOffset * 0.5} ${orbOffset} 0`}
				fill="none"
				stroke="rgba(255, 180, 220, 0.6)"
				strokeWidth="1.5"
			/>
			<path
				d={`M 0 ${-orbOffset} Q ${-orbOffset * 0.5} 0 0 ${orbOffset}`}
				fill="none"
				stroke="rgba(255, 180, 220, 0.6)"
				strokeWidth="1.5"
			/>
			<path
				d={`M 0 ${-orbOffset} Q ${orbOffset * 0.5} 0 0 ${orbOffset}`}
				fill="none"
				stroke="rgba(255, 180, 220, 0.6)"
				strokeWidth="1.5"
			/>

			{/* 4つの球 */}
			{orbPositions.map((pos) => (
				<g key={`${pos.x}-${pos.y}`}>
					{/* 球のグロー */}
					<circle
						cx={pos.x}
						cy={pos.y}
						r={orbRadius + 3}
						fill={`url(#${orbGlowId})`}
					/>
					{/* 球の輪郭 */}
					<circle
						cx={pos.x}
						cy={pos.y}
						r={orbRadius}
						fill="rgba(255, 220, 180, 0.8)"
						stroke="#ffcc88"
						strokeWidth="1"
					/>
					{/* 球の中心 */}
					<circle
						cx={pos.x}
						cy={pos.y}
						r={orbRadius * 0.4}
						fill="#ff9988"
					/>
				</g>
			))}
		</g>
	);
}

// 1人用エリアアイコン
function Area1PIcon({ transform }: { transform: string }) {
	const id = useId();
	const bgAuraId = `area1pBgAura-${id}`;
	const centerGradientId = `area1pCenterGrad-${id}`;

	const outerRadius = 32;
	const centerRadius = 10;
	const spikeCount = 16;

	// スパイクを生成
	const spikes = [];
	for (let i = 0; i < spikeCount; i++) {
		const angle = (i * 360) / spikeCount;
		spikes.push(
			<path
				key={i}
				d="M0 -31 L-1.5 -34 L1.5 -34 Z"
				fill="#ffffff"
				transform={`rotate(${angle})`}
			/>,
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

			{/* 背景グロー */}
			<circle cx={0} cy={0} r={outerRadius + 6} fill={`url(#${bgAuraId})`} />

			{/* 外周円 */}
			<circle
				cx={0}
				cy={0}
				r={outerRadius}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1"
			/>
			<circle
				cx={0}
				cy={0}
				r={outerRadius}
				fill="none"
				stroke="#ffccff"
				strokeWidth="2"
				opacity="0.5"
			/>

			{/* スパイク */}
			<g>{spikes}</g>

			{/* 中央の目 */}
			<circle
				cx={0}
				cy={0}
				r={centerRadius + 2}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle cx={0} cy={0} r={centerRadius} fill={`url(#${centerGradientId})`} />
		</g>
	);
}

// 2人用エリアアイコン
function Area2PIcon({ transform }: { transform: string }) {
	const id = useId();
	const bgAuraId = `area2pBgAura-${id}`;
	const eyeGradientId = `area2pEyeGrad-${id}`;
	const bridgeGradientId = `area2pBridgeGrad-${id}`;

	const outerRadius = 32;
	const eyeRadius = 10;
	const eyeOffset = 18;
	const spikeCount = 16;

	// スパイクを生成
	const spikes = [];
	for (let i = 0; i < spikeCount; i++) {
		const angle = (i * 360) / spikeCount;
		spikes.push(
			<path
				key={i}
				d="M0 -31 L-1.5 -34 L1.5 -34 Z"
				fill="#ffffff"
				transform={`rotate(${angle})`}
			/>,
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

			{/* 背景グロー */}
			<circle cx={0} cy={0} r={outerRadius + 8} fill={`url(#${bgAuraId})`} />

			{/* 外周円 */}
			<circle
				cx={0}
				cy={0}
				r={outerRadius}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1"
			/>

			{/* スパイク */}
			<g>{spikes}</g>

			{/* 装飾的な曲線 */}
			<g fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round">
				<path d="M-30 -13 L-25 -13 Q-20 -13 -17 -16 Q-14 -19 -10 -19 L10 -19 Q14 -19 17 -16 Q20 -13 25 -13 L30 -13" />
				<path d="M-30 -10 L-24 -10 Q-20 -10 -17 -12 Q-14 -14 -10 -14 L10 -14 Q14 -14 17 -12 Q20 -10 24 -10 L30 -10" opacity="0.7" />
				<path d="M-30 13 L-25 13 Q-20 13 -17 16 Q-14 19 -10 19 L10 19 Q14 19 17 16 Q20 13 25 13 L30 13" />
				<path d="M-30 10 L-24 10 Q-20 10 -17 12 Q-14 14 -10 14 L10 14 Q14 14 17 12 Q20 10 24 10 L30 10" opacity="0.7" />
			</g>

			{/* ブリッジ */}
			<rect
				x={-10}
				y={-3}
				width={20}
				height={6}
				rx={1}
				ry={1}
				fill={`url(#${bridgeGradientId})`}
				stroke="#ffffff"
				strokeWidth="0.8"
			/>

			{/* 左の目 */}
			<circle
				cx={-eyeOffset}
				cy={0}
				r={eyeRadius + 1.5}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle cx={-eyeOffset} cy={0} r={eyeRadius} fill={`url(#${eyeGradientId})`} />

			{/* 右の目 */}
			<circle
				cx={eyeOffset}
				cy={0}
				r={eyeRadius + 1.5}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle cx={eyeOffset} cy={0} r={eyeRadius} fill={`url(#${eyeGradientId})`} />
		</g>
	);
}

// 3人用エリアアイコン
function Area3PIcon({ transform }: { transform: string }) {
	const id = useId();
	const bgAuraId = `area3pBgAura-${id}`;
	const eyeGradientId = `area3pEyeGrad-${id}`;

	const outerRadius = 32;
	const eyeRadius = 10;
	const eyeSpacing = 22;
	const spikeCount = 16;

	// スパイクを生成
	const spikes = [];
	for (let i = 0; i < spikeCount; i++) {
		const angle = (i * 360) / spikeCount;
		spikes.push(
			<path
				key={i}
				d="M0 -31 L-1.5 -34 L1.5 -34 Z"
				fill="#ffffff"
				transform={`rotate(${angle})`}
			/>,
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

			{/* 背景グロー */}
			<circle cx={0} cy={0} r={outerRadius + 8} fill={`url(#${bgAuraId})`} />

			{/* 外周円 */}
			<circle
				cx={0}
				cy={0}
				r={outerRadius}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1"
			/>

			{/* スパイク */}
			<g>{spikes}</g>

			{/* 装飾的な波線 */}
			<g fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round">
				<path d="M-34 -10 Q-24 -20 -14 -10 Q0 -20 14 -10 Q24 -20 34 -10" />
				<path d="M-34 -7 Q-24 -17 -14 -7 Q0 -17 14 -7 Q24 -17 34 -7" opacity="0.6" strokeWidth="0.6" />
				<path d="M-34 10 Q-24 20 -14 10 Q0 20 14 10 Q24 20 34 10" />
				<path d="M-34 7 Q-24 17 -14 7 Q0 17 14 7 Q24 17 34 7" opacity="0.6" strokeWidth="0.6" />
			</g>

			{/* 左の目 */}
			<circle
				cx={-eyeSpacing}
				cy={0}
				r={eyeRadius + 1.5}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle cx={-eyeSpacing} cy={0} r={eyeRadius} fill={`url(#${eyeGradientId})`} />

			{/* 中央の目 */}
			<circle
				cx={0}
				cy={0}
				r={eyeRadius + 1.5}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle cx={0} cy={0} r={eyeRadius} fill={`url(#${eyeGradientId})`} />

			{/* 右の目 */}
			<circle
				cx={eyeSpacing}
				cy={0}
				r={eyeRadius + 1.5}
				fill="none"
				stroke="#ffffff"
				strokeWidth="1.5"
			/>
			<circle cx={eyeSpacing} cy={0} r={eyeRadius} fill={`url(#${eyeGradientId})`} />
		</g>
	);
}

// ロックオン赤マーカーアイコン（フルール・ド・リス型）
function LockOnRedIcon({ transform }: { transform: string }) {
	const id = useId();
	const glowId = `lockOnRedGlow-${id}`;
	const markerGradId = `lockOnRedMarkerGrad-${id}`;

	// マーカーの形状（フルール・ド・リス風の上向き矢印）
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

			{/* 楕円形の影 */}
			<ellipse cx={0} cy={28} rx={24} ry={10} fill={`url(#${glowId})`} />

			{/* マーカー本体 */}
			<path
				d={markerPath}
				fill={`url(#${markerGradId})`}
				stroke="#ff8844"
				strokeWidth="1.5"
			/>

			{/* マーカー内側のハイライト */}
			<path
				d={`
					M 0 -22
					C 3 -18, 5 -14, 6 -10
					C 7 -6, 6 -2, 4 2
					L 0 4
					L -4 2
					C -6 -2, -7 -6, -6 -10
					C -5 -14, -3 -18, 0 -22
					Z
				`}
				fill="rgba(255, 255, 255, 0.15)"
			/>

			{/* 中央の装飾的な目 */}
			<circle cx={-eyeSpacing} cy={eyeY} r={3} fill="#aa4422" />
			<circle cx={eyeSpacing} cy={eyeY} r={3} fill="#aa4422" />
			<circle cx={-eyeSpacing} cy={eyeY} r={1.5} fill="#ff8844" />
			<circle cx={eyeSpacing} cy={eyeY} r={1.5} fill="#ff8844" />
		</g>
	);
}

// ロックオン青マーカーアイコン（スターバースト型）
function LockOnBlueIcon({ transform }: { transform: string }) {
	const id = useId();
	const outerGlowId = `lockOnBlueOuterGlow-${id}`;
	const innerGlowId = `lockOnBlueInnerGlow-${id}`;
	const spikeGradId = `lockOnBlueSpikeGrad-${id}`;
	const orbGradId = `lockOnBlueOrbGrad-${id}`;

	const spikeCount = 8;
	const outerRadius = 32;
	const innerRadius = 14;
	const orbRadius = 10;

	// スパイク（三角形の突起）のパスを生成
	const spikes = [];
	for (let i = 0; i < spikeCount; i++) {
		const angle = (i * 360) / spikeCount - 90;
		const nextAngle = ((i + 1) * 360) / spikeCount - 90;
		const midAngle = angle + 360 / spikeCount / 2;

		const rad = (angle * Math.PI) / 180;
		const nextRad = (nextAngle * Math.PI) / 180;
		const midRad = (midAngle * Math.PI) / 180;

		// 外側の頂点
		const outerX = Math.cos(midRad) * outerRadius;
		const outerY = Math.sin(midRad) * outerRadius;

		// 内側の点
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
				<radialGradient id={innerGlowId}>
					<stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
					<stop offset="30%" stopColor="#88ffff" stopOpacity="0.7" />
					<stop offset="100%" stopColor="#0088cc" stopOpacity="0.3" />
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

			{/* 外側のグロー */}
			<circle cx={0} cy={0} r={outerRadius + 8} fill={`url(#${outerGlowId})`} />

			{/* スパイク */}
			{spikes}

			{/* 内側のリング */}
			<circle
				cx={0}
				cy={0}
				r={innerRadius}
				fill="none"
				stroke="#00ccff"
				strokeWidth="2"
			/>

			{/* 中央の球体 */}
			<circle cx={0} cy={0} r={orbRadius} fill={`url(#${orbGradId})`} />

			{/* 球体のハイライト */}
			<ellipse
				cx={-2}
				cy={-3}
				rx={4}
				ry={3}
				fill="rgba(255, 255, 255, 0.5)"
			/>

			{/* 球体の輪郭 */}
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

// ロックオン紫マーカーアイコン（フルール・ド・リス/短剣型）
function LockOnPurpleIcon({ transform }: { transform: string }) {
	const id = useId();
	const glowId = `lockOnPurpleGlow-${id}`;
	const markerGradId = `lockOnPurpleMarkerGrad-${id}`;

	// 短剣/フルール・ド・リス型の形状
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

			{/* 楕円形の影 */}
			<ellipse cx={0} cy={30} rx={24} ry={10} fill={`url(#${glowId})`} />

			{/* マーカー本体 */}
			<path
				d={markerPath}
				fill={`url(#${markerGradId})`}
				stroke="#aa66ff"
				strokeWidth="1.5"
			/>

			{/* 内側のハイライト */}
			<path
				d={`
					M 0 -24
					C 2 -20, 4 -16, 5 -10
					C 6 -4, 5 0, 3 4
					L 0 6
					L -3 4
					C -5 0, -6 -4, -5 -10
					C -4 -16, -2 -20, 0 -24
					Z
				`}
				fill="rgba(255, 255, 255, 0.15)"
			/>

			{/* 中央の装飾 */}
			<ellipse cx={0} cy={-6} rx={3} ry={4} fill="#220044" />
			<ellipse cx={0} cy={-6} rx={1.5} ry={2} fill="#aa66ff" />
		</g>
	);
}

// ロックオン緑マーカーアイコン（宝石/クリスタル型）
function LockOnGreenIcon({ transform }: { transform: string }) {
	const id = useId();
	const glowId = `lockOnGreenGlow-${id}`;
	const gemGradId = `lockOnGreenGemGrad-${id}`;

	// 丸みを帯びた宝石/クリスタル型の形状
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

			{/* 楕円形の影 */}
			<ellipse cx={0} cy={28} rx={24} ry={10} fill={`url(#${glowId})`} />

			{/* 宝石本体 */}
			<path
				d={gemPath}
				fill={`url(#${gemGradId})`}
				stroke="#66ff88"
				strokeWidth="1.5"
			/>

			{/* 内側のハイライト（上部） */}
			<path
				d={`
					M -4 -18
					C 8 -16, 14 -8, 12 0
					C 10 6, 4 8, -2 6
					C -8 4, -12 -4, -10 -10
					C -8 -14, -4 -18, -4 -18
					Z
				`}
				fill="rgba(255, 255, 255, 0.25)"
			/>

			{/* 光沢ポイント */}
			<ellipse cx={-6} cy={-10} rx={4} ry={3} fill="rgba(255, 255, 255, 0.4)" />
		</g>
	);
}

// 強調マルアイコン（螺旋型C形状）
function EmphasisCircleIcon({ transform }: { transform: string }) {
	const id = useId();
	const glowId = `emphasisCircleGlow-${id}`;
	const gradId = `emphasisCircleGrad-${id}`;

	// 螺旋状のC形状パス
	const spiralPath = `
		M 20 0
		A 20 20 0 1 0 0 20
		L 0 12
		A 12 12 0 1 1 12 0
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

			{/* 外側のグロー */}
			<circle cx={0} cy={0} r={28} fill={`url(#${glowId})`} />

			{/* 螺旋形状 */}
			<path
				d={spiralPath}
				fill={`url(#${gradId})`}
				stroke="#ffaabb"
				strokeWidth="2"
			/>

			{/* ハイライト */}
			<path
				d={`
					M 16 -4
					A 16 16 0 0 0 -4 16
					L -4 10
					A 10 10 0 0 1 10 -4
					Z
				`}
				fill="rgba(255, 255, 255, 0.2)"
			/>
		</g>
	);
}

// 強調バツアイコン（X型クロス）
function EmphasisCrossIcon({ transform }: { transform: string }) {
	const id = useId();
	const glowId = `emphasisCrossGlow-${id}`;
	const gradId = `emphasisCrossGrad-${id}`;

	const armWidth = 10;
	const armLength = 24;

	// X型のパス
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
		<g transform={`${transform} rotate(45)`}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#44ddff" stopOpacity="0.5" />
					<stop offset="70%" stopColor="#2299cc" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#115577" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#0066aa" />
					<stop offset="50%" stopColor="#0088cc" />
					<stop offset="100%" stopColor="#00aaee" />
				</linearGradient>
			</defs>

			{/* 外側のグロー */}
			<circle cx={0} cy={0} r={32} fill={`url(#${glowId})`} />

			{/* クロス形状 */}
			<path
				d={crossPath}
				fill={`url(#${gradId})`}
				stroke="#66ddff"
				strokeWidth="2"
			/>

			{/* 中央のハイライト */}
			<rect
				x={-armWidth / 4}
				y={-armWidth / 4}
				width={armWidth / 2}
				height={armWidth / 2}
				fill="rgba(255, 255, 255, 0.4)"
			/>
		</g>
	);
}

// 強調シカクアイコン（螺旋状四角形）
function EmphasisSquareIcon({ transform }: { transform: string }) {
	const id = useId();
	const glowId = `emphasisSquareGlow-${id}`;
	const gradId = `emphasisSquareGrad-${id}`;

	const outerSize = 22;
	const innerSize = 12;
	const gap = 6;

	// 螺旋状四角形のパス
	const spiralPath = `
		M ${-outerSize} ${-outerSize}
		L ${outerSize} ${-outerSize}
		L ${outerSize} ${outerSize}
		L ${-outerSize + gap} ${outerSize}
		L ${-outerSize + gap} ${-outerSize + gap}
		L ${outerSize - gap} ${-outerSize + gap}
		L ${outerSize - gap} ${outerSize - gap}
		L ${-innerSize} ${outerSize - gap}
		L ${-innerSize} ${-innerSize}
		L ${innerSize} ${-innerSize}
		L ${innerSize} ${innerSize}
		L ${-outerSize} ${innerSize}
		Z
	`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#cc66ff" stopOpacity="0.5" />
					<stop offset="70%" stopColor="#9944cc" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#552288" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#6622aa" />
					<stop offset="50%" stopColor="#8844cc" />
					<stop offset="100%" stopColor="#aa66ee" />
				</linearGradient>
			</defs>

			{/* 外側のグロー */}
			<circle cx={0} cy={0} r={32} fill={`url(#${glowId})`} />

			{/* 螺旋四角形状 */}
			<path
				d={spiralPath}
				fill={`url(#${gradId})`}
				stroke="#dd99ff"
				strokeWidth="2"
			/>

			{/* 中央のポイント */}
			<circle cx={0} cy={0} r={3} fill="#ffccff" />
		</g>
	);
}

// 強調サンカクアイコン（二重三角形）
function EmphasisTriangleIcon({ transform }: { transform: string }) {
	const id = useId();
	const glowId = `emphasisTriangleGlow-${id}`;
	const gradId = `emphasisTriangleGrad-${id}`;

	const outerSize = 26;
	const innerSize = 14;

	// 外側三角形のパス（逆三角形）
	const outerPath = `
		M 0 ${outerSize}
		L ${-outerSize * 0.9} ${-outerSize * 0.6}
		L ${outerSize * 0.9} ${-outerSize * 0.6}
		Z
	`;

	// 内側三角形のパス
	const innerPath = `
		M 0 ${innerSize * 0.8}
		L ${-innerSize * 0.7} ${-innerSize * 0.4}
		L ${innerSize * 0.7} ${-innerSize * 0.4}
		Z
	`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#44ffaa" stopOpacity="0.5" />
					<stop offset="70%" stopColor="#22cc88" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#118855" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#115544" />
					<stop offset="50%" stopColor="#228866" />
					<stop offset="100%" stopColor="#44aa88" />
				</linearGradient>
			</defs>

			{/* 外側のグロー */}
			<circle cx={0} cy={0} r={32} fill={`url(#${glowId})`} />

			{/* 外側三角形 */}
			<path
				d={outerPath}
				fill={`url(#${gradId})`}
				stroke="#66ffcc"
				strokeWidth="2"
			/>

			{/* 内側三角形（くり抜き効果） */}
			<path
				d={innerPath}
				fill="rgba(0, 50, 40, 0.5)"
				stroke="#88ffdd"
				strokeWidth="1"
			/>

			{/* ハイライト */}
			<path
				d={`
					M ${-outerSize * 0.5} ${-outerSize * 0.4}
					L ${-outerSize * 0.2} ${-outerSize * 0.4}
					L ${-outerSize * 0.35} ${outerSize * 0.1}
					Z
				`}
				fill="rgba(255, 255, 255, 0.2)"
			/>
		</g>
	);
}

// 時計回りアイコン
function ClockwiseIcon({ transform }: { transform: string }) {
	const id = useId();
	const glowId = `clockwiseGlow-${id}`;
	const arcGradId = `clockwiseArcGrad-${id}`;

	// 楕円弧のパラメータ
	const rx = 28;
	const ry = 10;

	// シェブロン矢印（左向き = 時計回り方向）
	const chevronSize = 8;
	const chevronSpacing = 12;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#ffaa44" stopOpacity="0.6" />
					<stop offset="70%" stopColor="#ff8822" stopOpacity="0.3" />
					<stop offset="100%" stopColor="#cc6600" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={arcGradId} x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#ffcc66" />
					<stop offset="50%" stopColor="#ff9933" />
					<stop offset="100%" stopColor="#cc6600" />
				</linearGradient>
			</defs>

			{/* 外側のグロー */}
			<ellipse cx={0} cy={0} rx={rx + 8} ry={ry + 8} fill={`url(#${glowId})`} />

			{/* 楕円弧（上半分） */}
			<path
				d={`M ${-rx} 0 A ${rx} ${ry} 0 1 1 ${rx} 0`}
				fill="none"
				stroke={`url(#${arcGradId})`}
				strokeWidth="5"
				strokeLinecap="round"
			/>

			{/* 3つのシェブロン矢印（左向き） */}
			{[-1, 0, 1].map((offset) => (
				<path
					key={offset}
					d={`
						M ${offset * chevronSpacing + chevronSize * 0.6} ${-chevronSize}
						L ${offset * chevronSpacing - chevronSize * 0.6} 0
						L ${offset * chevronSpacing + chevronSize * 0.6} ${chevronSize}
					`}
					fill="none"
					stroke="#ffcc66"
					strokeWidth="4"
					strokeLinecap="round"
					strokeLinejoin="round"
					transform="translate(0, 10)"
				/>
			))}

			{/* 矢印のグロー */}
			{[-1, 0, 1].map((offset) => (
				<path
					key={`glow-${offset}`}
					d={`
						M ${offset * chevronSpacing + chevronSize * 0.6} ${-chevronSize}
						L ${offset * chevronSpacing - chevronSize * 0.6} 0
						L ${offset * chevronSpacing + chevronSize * 0.6} ${chevronSize}
					`}
					fill="none"
					stroke="#ff9933"
					strokeWidth="6"
					strokeLinecap="round"
					strokeLinejoin="round"
					opacity="0.4"
					transform="translate(0, 10)"
				/>
			))}
		</g>
	);
}

// 反時計回りアイコン
function CounterClockwiseIcon({ transform }: { transform: string }) {
	const id = useId();
	const glowId = `counterClockwiseGlow-${id}`;
	const arcGradId = `counterClockwiseArcGrad-${id}`;

	// 楕円弧のパラメータ
	const rx = 28;
	const ry = 10;

	// シェブロン矢印（右向き = 反時計回り方向）
	const chevronSize = 8;
	const chevronSpacing = 12;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId}>
					<stop offset="0%" stopColor="#44aaff" stopOpacity="0.6" />
					<stop offset="70%" stopColor="#2288dd" stopOpacity="0.3" />
					<stop offset="100%" stopColor="#0066aa" stopOpacity="0" />
				</radialGradient>
				<linearGradient id={arcGradId} x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#0066aa" />
					<stop offset="50%" stopColor="#3399dd" />
					<stop offset="100%" stopColor="#66ccff" />
				</linearGradient>
			</defs>

			{/* 外側のグロー */}
			<ellipse cx={0} cy={0} rx={rx + 8} ry={ry + 8} fill={`url(#${glowId})`} />

			{/* 楕円弧（上半分） */}
			<path
				d={`M ${-rx} 0 A ${rx} ${ry} 0 1 1 ${rx} 0`}
				fill="none"
				stroke={`url(#${arcGradId})`}
				strokeWidth="5"
				strokeLinecap="round"
			/>

			{/* 3つのシェブロン矢印（右向き） */}
			{[-1, 0, 1].map((offset) => (
				<path
					key={offset}
					d={`
						M ${offset * chevronSpacing - chevronSize * 0.6} ${-chevronSize}
						L ${offset * chevronSpacing + chevronSize * 0.6} 0
						L ${offset * chevronSpacing - chevronSize * 0.6} ${chevronSize}
					`}
					fill="none"
					stroke="#66ccff"
					strokeWidth="4"
					strokeLinecap="round"
					strokeLinejoin="round"
					transform="translate(0, 10)"
				/>
			))}

			{/* 矢印のグロー */}
			{[-1, 0, 1].map((offset) => (
				<path
					key={`glow-${offset}`}
					d={`
						M ${offset * chevronSpacing - chevronSize * 0.6} ${-chevronSize}
						L ${offset * chevronSpacing + chevronSize * 0.6} 0
						L ${offset * chevronSpacing - chevronSize * 0.6} ${chevronSize}
					`}
					fill="none"
					stroke="#3399dd"
					strokeWidth="6"
					strokeLinecap="round"
					strokeLinejoin="round"
					opacity="0.4"
					transform="translate(0, 10)"
				/>
			))}
		</g>
	);
}

// バフ効果アイコン
function BuffIcon({ transform }: { transform: string }) {
	const id = useId();
	const glowId = `buffGlow-${id}`;
	const bgGradId = `buffBgGrad-${id}`;

	// ペンタゴン/シールド形状
	const shieldPath = `
		M 0 -26
		L 24 -16
		L 24 10
		L 0 26
		L -24 10
		L -24 -16
		Z
	`;

	// 人のシルエット（腕を上げたポーズ）
	const personPath = `
		M 0 -14
		C 3 -14, 5 -12, 5 -9
		C 5 -6, 3 -4, 0 -4
		C -3 -4, -5 -6, -5 -9
		C -5 -12, -3 -14, 0 -14
		Z
		M 0 -3
		L 4 -3
		L 4 4
		L 10 -8
		L 13 -6
		L 6 4
		L 6 14
		L 3 14
		L 3 6
		L 0 6
		L -3 6
		L -3 14
		L -6 14
		L -6 4
		L -13 -6
		L -10 -8
		L -4 4
		L -4 -3
		Z
	`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId} cx="50%" cy="30%" r="70%">
					<stop offset="0%" stopColor="#66ddff" stopOpacity="0.8" />
					<stop offset="50%" stopColor="#2299cc" stopOpacity="0.4" />
					<stop offset="100%" stopColor="#004466" stopOpacity="0.2" />
				</radialGradient>
				<linearGradient id={bgGradId} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#334455" />
					<stop offset="100%" stopColor="#1a2233" />
				</linearGradient>
			</defs>

			{/* シールド背景 */}
			<path
				d={shieldPath}
				fill={`url(#${bgGradId})`}
				stroke="#556677"
				strokeWidth="2"
			/>

			{/* 内側のグロー */}
			<path
				d={shieldPath}
				fill={`url(#${glowId})`}
				transform="scale(0.85)"
			/>

			{/* 人のシルエット */}
			<path
				d={personPath}
				fill="#00ccff"
				opacity="0.9"
			/>

			{/* シルエットのグロー */}
			<path
				d={personPath}
				fill="none"
				stroke="#66ffff"
				strokeWidth="2"
				opacity="0.5"
			/>
		</g>
	);
}

// デバフ効果アイコン
function DebuffIcon({ transform }: { transform: string }) {
	const id = useId();
	const glowId = `debuffGlow-${id}`;
	const bgGradId = `debuffBgGrad-${id}`;

	// ペンタゴン/シールド形状
	const shieldPath = `
		M 0 -26
		L 24 -16
		L 24 10
		L 0 26
		L -24 10
		L -24 -16
		Z
	`;

	// 人のシルエット（かがんだポーズ）
	const personPath = `
		M 6 -10
		C 9 -10, 11 -8, 11 -5
		C 11 -2, 9 0, 6 0
		C 3 0, 1 -2, 1 -5
		C 1 -8, 3 -10, 6 -10
		Z
		M 4 1
		L 10 1
		L 14 8
		L 11 10
		L 8 5
		L 8 10
		L 12 18
		L 9 20
		L 5 12
		L 1 20
		L -2 18
		L 2 10
		L -4 10
		L -8 6
		L -10 4
		L -6 1
		Z
	`;

	return (
		<g transform={transform}>
			<defs>
				<radialGradient id={glowId} cx="50%" cy="30%" r="70%">
					<stop offset="0%" stopColor="#ff6666" stopOpacity="0.8" />
					<stop offset="50%" stopColor="#cc2222" stopOpacity="0.4" />
					<stop offset="100%" stopColor="#440000" stopOpacity="0.2" />
				</radialGradient>
				<linearGradient id={bgGradId} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#443333" />
					<stop offset="100%" stopColor="#221a1a" />
				</linearGradient>
			</defs>

			{/* シールド背景 */}
			<path
				d={shieldPath}
				fill={`url(#${bgGradId})`}
				stroke="#665555"
				strokeWidth="2"
			/>

			{/* 内側のグロー */}
			<path
				d={shieldPath}
				fill={`url(#${glowId})`}
				transform="scale(0.85)"
			/>

			{/* 人のシルエット */}
			<path
				d={personPath}
				fill="#cc3333"
				opacity="0.9"
				transform="translate(-4, 0)"
			/>

			{/* シルエットのグロー */}
			<path
				d={personPath}
				fill="none"
				stroke="#ff6666"
				strokeWidth="2"
				opacity="0.5"
				transform="translate(-4, 0)"
			/>
		</g>
	);
}

// 図形マルアイコン（二重円）
function ShapeCircleIcon({ transform }: { transform: string }) {
	const strokeColor = "#ccaa44";
	const fillColor = "#ffffff";
	const outerRadius = 24;
	const innerRadius = 18;

	// ドーナツ形状（外側円から内側円をくり抜き）
	const donutPath = `
		M ${outerRadius} 0
		A ${outerRadius} ${outerRadius} 0 1 0 ${-outerRadius} 0
		A ${outerRadius} ${outerRadius} 0 1 0 ${outerRadius} 0
		Z
		M ${innerRadius} 0
		A ${innerRadius} ${innerRadius} 0 1 1 ${-innerRadius} 0
		A ${innerRadius} ${innerRadius} 0 1 1 ${innerRadius} 0
		Z
	`;

	return (
		<g transform={transform}>
			<path
				d={donutPath}
				fill={fillColor}
				stroke={strokeColor}
				strokeWidth="2"
				fillRule="evenodd"
			/>
		</g>
	);
}

// 図形バツアイコン（X形状）
function ShapeCrossIcon({ transform }: { transform: string }) {
	const strokeColor = "#ccaa44";
	const fillColor = "#ffffff";
	const size = 22;
	const width = 6;

	// X形状のパス（塗りつぶし可能な形状）
	const crossPath = `
		M ${-size} ${-size + width}
		L ${-size + width} ${-size}
		L 0 ${-width}
		L ${size - width} ${-size}
		L ${size} ${-size + width}
		L ${width} 0
		L ${size} ${size - width}
		L ${size - width} ${size}
		L 0 ${width}
		L ${-size + width} ${size}
		L ${-size} ${size - width}
		L ${-width} 0
		Z
	`;

	return (
		<g transform={transform}>
			<path
				d={crossPath}
				fill={fillColor}
				stroke={strokeColor}
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</g>
	);
}

// 図形サンカクアイコン（二重三角形）
function ShapeTriangleIcon({ transform }: { transform: string }) {
	const strokeColor = "#ccaa44";
	const fillColor = "#ffffff";

	// 二重三角形（外側から内側をくり抜き）
	const doublePath = `
		M 0 -24
		L 22 20
		L -22 20
		Z
		M 0 -16
		L -15 14
		L 15 14
		Z
	`;

	return (
		<g transform={transform}>
			<path
				d={doublePath}
				fill={fillColor}
				stroke={strokeColor}
				strokeWidth="2"
				strokeLinejoin="round"
				fillRule="evenodd"
			/>
		</g>
	);
}

// 図形ヤジルシアイコン（上向き矢印）
function ShapeArrowIcon({ transform }: { transform: string }) {
	const strokeColor = "#ccaa44";
	const fillColor = "#ffffff";

	// 矢印形状
	const arrowPath = `
		M 0 -26
		L 18 6
		L 8 6
		L 8 26
		L -8 26
		L -8 6
		L -18 6
		Z
	`;

	return (
		<g transform={transform}>
			<path
				d={arrowPath}
				fill={fillColor}
				stroke={strokeColor}
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</g>
	);
}

// 図形カイテンアイコン（回転矢印）
function ShapeRotationIcon({ transform }: { transform: string }) {
	const strokeColor = "#ccaa44";
	const fillColor = "#ffffff";
	const outerRadius = 22;
	const innerRadius = 16;

	// 円弧（約270度）の開始・終了角度
	const startAngle = -135;
	const endAngle = 135;
	const startRad = (startAngle * Math.PI) / 180;
	const endRad = (endAngle * Math.PI) / 180;

	// 外側円弧
	const outerX1 = Math.cos(startRad) * outerRadius;
	const outerY1 = Math.sin(startRad) * outerRadius;
	const outerX2 = Math.cos(endRad) * outerRadius;
	const outerY2 = Math.sin(endRad) * outerRadius;

	// 内側円弧
	const innerX1 = Math.cos(startRad) * innerRadius;
	const innerY1 = Math.sin(startRad) * innerRadius;
	const innerX2 = Math.cos(endRad) * innerRadius;
	const innerY2 = Math.sin(endRad) * innerRadius;

	// 矢印の先端
	const arrowTipX = outerX2 + 8;
	const midRadius = (outerRadius + innerRadius) / 2;
	const midY = Math.sin(endRad) * midRadius;

	// 塗りつぶし可能な円弧パス
	const arcPath = `
		M ${outerX1} ${outerY1}
		A ${outerRadius} ${outerRadius} 0 1 1 ${outerX2} ${outerY2}
		L ${arrowTipX} ${midY}
		L ${innerX2} ${innerY2}
		A ${innerRadius} ${innerRadius} 0 1 0 ${innerX1} ${innerY1}
		Z
	`;

	return (
		<g transform={transform}>
			<path
				d={arcPath}
				fill={fillColor}
				stroke={strokeColor}
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</g>
	);
}

// プレースホルダー
function PlaceholderObject({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	return (
		<g transform={transform}>
			<circle
				cx={0}
				cy={0}
				r={SIZES.PLACEHOLDER}
				fill={COLORS.FILL_PLACEHOLDER}
				stroke="#999"
				strokeWidth="1"
			/>
			<text textAnchor="middle" dy="4" fill={COLORS.STROKE_WHITE} fontSize="10">
				{objectId}
			</text>
		</g>
	);
}
