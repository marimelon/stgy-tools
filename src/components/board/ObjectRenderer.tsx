import { useId } from "react";
import { DEFAULT_BBOX_SIZE, OBJECT_BBOX_SIZES } from "@/lib/board";
import type { BoardObject, Color } from "@/lib/stgy";
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
	// AoE関連
	GazeIcon,
	KnockbackLineIcon,
	KnockbackRadialIcon,
	LockOnBlueIcon,
	LockOnGreenIcon,
	LockOnPurpleIcon,
	// 特殊アイコン
	LockOnRedIcon,
	ShapeArrowIcon,
	// 図形
	ShapeCircleIcon,
	ShapeCrossIcon,
	ShapeRotationIcon,
	ShapeTriangleIcon,
	StackChainIcon,
	StackIcon,
	StackLineIcon,
} from "./icons";

// ========================================
// アイコン表示設定
// ========================================

/**
 * オリジナル画像（PNG）を使用するかチェック
 * デフォルトでオリジナル画像を使用
 * localStorage.setItem('useFallbackSvg', 'true') で代替SVGに切り替え可能
 */
function useOriginalIcons(): boolean {
	if (typeof window === "undefined") return true;
	return localStorage.getItem("useFallbackSvg") !== "true";
}

/**
 * カスタムアイコン対応オブジェクトIDのセット
 * 画像ファイルは /public/icons/{objectId}.png に配置
 * 注: LineAoE, Line はパラメータ反映のため常にSVGでレンダリング（画像はサイドバーアイコンのみ）
 */
const CUSTOM_ICON_IDS = new Set<number>([
	// フィールド
	ObjectIds.CircleCheck,
	ObjectIds.SquareCheck,
	ObjectIds.CircleGray,
	ObjectIds.SquareGray,
	// 攻撃範囲（LineAoE, Line は除外 - 常にSVGでレンダリング）
	ObjectIds.CircleAoE,
	ObjectIds.ConeAoE,
	// ObjectIds.LineAoE, // サイドバーアイコンのみ画像使用
	// ObjectIds.Line,    // サイドバーアイコンのみ画像使用
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
	// エネミー
	ObjectIds.EnemySmall,
	ObjectIds.EnemyMedium,
	ObjectIds.EnemyLarge,
	// バフ/デバフ
	ObjectIds.Buff,
	ObjectIds.Debuff,
	// 図形
	ObjectIds.ShapeCircle,
	ObjectIds.ShapeCross,
	ObjectIds.ShapeTriangle,
	ObjectIds.ShapeSquare,
	ObjectIds.ShapeArrow,
	ObjectIds.ShapeRotation,
	// ロックオン
	ObjectIds.LockOnRed,
	ObjectIds.LockOnBlue,
	ObjectIds.LockOnPurple,
	ObjectIds.LockOnGreen,
	// 強調
	ObjectIds.EmphasisCircle,
	ObjectIds.EmphasisCross,
	ObjectIds.EmphasisSquare,
	ObjectIds.EmphasisTriangle,
	// 回転
	ObjectIds.Clockwise,
	ObjectIds.CounterClockwise,
	// グループ
	ObjectIds.Group,
	// テキスト
	ObjectIds.Text,
	// 攻撃マーカー
	ObjectIds.Attack1,
	ObjectIds.Attack2,
	ObjectIds.Attack3,
	ObjectIds.Attack4,
	ObjectIds.Attack5,
	ObjectIds.Attack6,
	ObjectIds.Attack7,
	ObjectIds.Attack8,
	// 足止めマーカー
	ObjectIds.Bind1,
	ObjectIds.Bind2,
	ObjectIds.Bind3,
	// 禁止マーカー
	ObjectIds.Ignore1,
	ObjectIds.Ignore2,
	// 汎用マーカー
	ObjectIds.Square,
	ObjectIds.Circle,
	ObjectIds.Plus,
	ObjectIds.Triangle,
	// ウェイマーク
	ObjectIds.WaymarkA,
	ObjectIds.WaymarkB,
	ObjectIds.WaymarkC,
	ObjectIds.WaymarkD,
	ObjectIds.Waymark1,
	ObjectIds.Waymark2,
	ObjectIds.Waymark3,
	ObjectIds.Waymark4,
	// ロールアイコン
	ObjectIds.Tank,
	ObjectIds.Tank1,
	ObjectIds.Tank2,
	ObjectIds.Healer,
	ObjectIds.Healer1,
	ObjectIds.Healer2,
	ObjectIds.DPS,
	ObjectIds.DPS1,
	ObjectIds.DPS2,
	ObjectIds.DPS3,
	ObjectIds.DPS4,
	// ジョブアイコン（基本クラス）
	ObjectIds.Gladiator,
	ObjectIds.Pugilist,
	ObjectIds.Marauder,
	ObjectIds.Lancer,
	ObjectIds.Archer,
	ObjectIds.Conjurer,
	ObjectIds.Thaumaturge,
	ObjectIds.Arcanist,
	ObjectIds.Rogue,
	// ジョブアイコン（上級ジョブ）
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
]);

// ========================================
// 定数定義
// ========================================

/** 扇形攻撃の半径 */
const CONE_RADIUS = 256;

/** オブジェクトサイズ定数（レガシー：徐々にOBJECT_BBOX_SIZESに移行） */
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

// OBJECT_BBOX_SIZES と DEFAULT_BBOX_SIZE は @/lib/board から import

/**
 * カスタムアイコン画像をレンダリング
 * OBJECT_BBOX_SIZESのサイズを使用してバウンディングボックス内に収める
 */
function CustomIconImage({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const iconSize = OBJECT_BBOX_SIZES[objectId];
	if (!iconSize) return null;

	return (
		<g transform={transform}>
			<image
				href={`/icons/${objectId}.png`}
				x={-iconSize.width / 2}
				y={-iconSize.height / 2}
				width={iconSize.width}
				height={iconSize.height}
				preserveAspectRatio="xMidYMid meet"
			/>
		</g>
	);
}

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
	// param1（縦幅）またはparam2（横幅）がデフォルトから変更されているか
	const height = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
	const width = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
	return (
		height !== DEFAULT_PARAMS.LINE_HEIGHT || width !== DEFAULT_PARAMS.LINE_WIDTH
	);
}

/**
 * オリジナル画像が利用可能な場合は画像を返し、そうでなければnullを返す
 * 色やパラメータがデフォルトから変更されている場合はSVGでレンダリングするためnullを返す
 */
function renderOriginalIconIfEnabled(
	objectId: number,
	transform: string,
	color?: Color,
	param1?: number,
	param2?: number,
): React.ReactNode | null {
	if (!useOriginalIcons()) return null;
	if (!CUSTOM_ICON_IDS.has(objectId)) return null;
	// 色がデフォルトから変更されている場合はSVGでレンダリング
	if (color && isColorChanged(color)) return null;
	// 直線範囲攻撃のパラメータが変更されている場合はSVGでレンダリング
	if (isLineAoEParamsChanged(objectId, param1, param2)) return null;
	return <CustomIconImage objectId={objectId} transform={transform} />;
}

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

/** 大きいフィールドID（すべてのフィールドオブジェクト） */
const LARGE_FIELD_IDS: readonly number[] = [
	// 円形フィールド
	ObjectIds.CircleWhiteSolid,
	ObjectIds.CircleWhiteTile,
	ObjectIds.CircleGraySolid,
	ObjectIds.CircleCheck,
	ObjectIds.CircleGray,
	// 四角形フィールド
	ObjectIds.SquareWhiteSolid,
	ObjectIds.SquareWhiteTile,
	ObjectIds.SquareGraySolid,
	ObjectIds.SquareCheck,
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
	// ObjectIds.Line は特殊処理（始点-終点の絶対座標線）
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

/** 攻撃マーカーID */
const ATTACK_MARKER_IDS: readonly number[] = [
	ObjectIds.Attack1,
	ObjectIds.Attack2,
	ObjectIds.Attack3,
	ObjectIds.Attack4,
	ObjectIds.Attack5,
	ObjectIds.Attack6,
	ObjectIds.Attack7,
	ObjectIds.Attack8,
];

/** 足止めマーカーID */
const BIND_MARKER_IDS: readonly number[] = [
	ObjectIds.Bind1,
	ObjectIds.Bind2,
	ObjectIds.Bind3,
];

/** 禁止マーカーID */
const IGNORE_MARKER_IDS: readonly number[] = [
	ObjectIds.Ignore1,
	ObjectIds.Ignore2,
];

/** 汎用マーカーID */
const GENERIC_MARKER_IDS: readonly number[] = [
	ObjectIds.Square,
	ObjectIds.Circle,
	ObjectIds.Plus,
	ObjectIds.Triangle,
];

/** マーカーオブジェクトID（全種類） */
const MARKER_OBJECT_IDS: readonly number[] = [
	...ATTACK_MARKER_IDS,
	...BIND_MARKER_IDS,
	...IGNORE_MARKER_IDS,
	...GENERIC_MARKER_IDS,
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
const JOB_ROLES: Record<
	number,
	"tank" | "healer" | "melee" | "ranged" | "caster"
> = {
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
	const bbox = getObjectBoundingBox(
		objectId,
		param1,
		param2,
		object.param3,
		text,
		position,
	);

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
	} else if (objectId === ObjectIds.Line) {
		// Line: 始点(position)から終点(param1/10, param2/10)への線
		// param1, param2 は座標を10倍した整数値（小数第一位まで対応）
		const endX = (param1 ?? position.x * 10 + 2560) / 10;
		const endY = (param2 ?? position.y * 10) / 10;
		const lineThickness = object.param3 ?? 6;
		const lineFill = colorToRgba(color);
		content = (
			<line
				x1={position.x}
				y1={position.y}
				x2={endX}
				y2={endY}
				stroke={lineFill}
				strokeWidth={lineThickness}
				strokeLinecap="butt"
			/>
		);
	} else if (isAoEObject(objectId)) {
		content = (
			<AoEObject
				objectId={objectId}
				transform={transform}
				color={color}
				param1={param1}
				param2={param2}
				param3={object.param3}
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
	} else if (isMarker(objectId)) {
		content = <MarkerIcon objectId={objectId} transform={transform} />;
	} else if (objectId === ObjectIds.Text && text) {
		content = <TextObject transform={transform} text={text} color={color} />;
	} else {
		content = <PlaceholderObject objectId={objectId} transform={transform} />;
	}

	// Lineは絶対座標で描画するため回転を適用しない
	const effectiveRotation = objectId === ObjectIds.Line ? 0 : rotation;

	// 選択インジケーター
	const selectionIndicator = selected && (
		<SelectionIndicator
			x={position.x}
			y={position.y}
			width={bbox.width * scale}
			height={bbox.height * scale}
			offsetX={(bbox.offsetX ?? 0) * scale}
			offsetY={(bbox.offsetY ?? 0) * scale}
			rotation={effectiveRotation}
		/>
	);

	// 透過度をSVGのopacityに変換 (color.opacity: 0=不透明, 100=透明)
	const svgOpacity = 1 - color.opacity / 100;

	if (!showBoundingBox) {
		return (
			// biome-ignore lint/a11y/useSemanticElements: SVG elements cannot be replaced with button
			<g
				role="button"
				tabIndex={0}
				onClick={handleClick}
				onKeyDown={(e) =>
					e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)
				}
				style={{ cursor: "pointer", opacity: svgOpacity, outline: "none" }}
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
			onKeyDown={(e) =>
				e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)
			}
			style={{ cursor: "pointer", opacity: svgOpacity, outline: "none" }}
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
				rotation={effectiveRotation}
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
	const { objectId, position, rotation, size, param1, param2, text, flags } =
		object;

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
				<circle
					cx={boxCenterX}
					cy={boxCenterY}
					r={2}
					fill={COLORS.DEBUG_GREEN}
				/>
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
export function getObjectBoundingBox(
	objectId: number,
	param1?: number,
	param2?: number,
	param3?: number,
	text?: string,
	position?: Position,
): { width: number; height: number; offsetX?: number; offsetY?: number } {
	// 扇形攻撃（動的計算）
	if (objectId === ObjectIds.ConeAoE) {
		const angle = param1 ?? 90;
		const cone = getConeBoundingBox(angle, CONE_RADIUS);
		return {
			width: cone.width,
			height: cone.height,
			offsetX: 0,
			offsetY: 0,
		};
	}

	// テキスト（動的計算）
	if (objectId === ObjectIds.Text) {
		const textLength = text?.length ?? 4;
		const width = Math.max(textLength * TEXT.CHAR_WIDTH, TEXT.MIN_BBOX_WIDTH);
		return { width, height: TEXT.DEFAULT_HEIGHT };
	}

	// Line: 始点(position)から終点(param1/10, param2/10)への線
	if (objectId === ObjectIds.Line && position) {
		const endX = (param1 ?? position.x * 10 + 2560) / 10;
		const endY = (param2 ?? position.y * 10) / 10;
		const lineThickness = param3 ?? 6;
		// position基準の相対座標で計算
		const relEndX = endX - position.x;
		const relEndY = endY - position.y;
		// 始点(0,0)と終点を含むバウンディングボックス
		const minX = Math.min(0, relEndX);
		const maxX = Math.max(0, relEndX);
		const minY = Math.min(0, relEndY);
		const maxY = Math.max(0, relEndY);
		const width = Math.max(maxX - minX, lineThickness);
		const height = Math.max(maxY - minY, lineThickness);
		return {
			width,
			height,
			offsetX: (minX + maxX) / 2,
			offsetY: (minY + maxY) / 2,
		};
	}

	// LineAoE: アンカーポイント10 = 端点基準
	if (objectId === ObjectIds.LineAoE) {
		const length = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
		const thickness = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
		return {
			width: length,
			height: thickness,
			offsetX: length / 2,
			offsetY: 0,
		};
	}

	// OBJECT_BBOX_SIZESから取得
	const size = OBJECT_BBOX_SIZES[objectId];
	if (size) {
		return size;
	}

	// デフォルト
	return DEFAULT_BBOX_SIZE;
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

function isMarker(id: number): boolean {
	return MARKER_OBJECT_IDS.includes(id);
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
	const id = useId();

	// オリジナル画像が有効な場合は画像を使用（色が変更されている場合はSVGを使用）
	const originalIcon = renderOriginalIconIfEnabled(objectId, transform, color);
	if (originalIcon) return originalIcon;
	const fill = colorToRgba(color);
	const size = LARGE_FIELD_IDS.includes(objectId)
		? SIZES.FIELD_LARGE
		: SIZES.FIELD;

	// チェッカーパターンのタイルサイズ（参照画像に合わせて調整）
	const tileSize = LARGE_FIELD_IDS.includes(objectId) ? 16 : 4;

	// パターンID
	const checkerPatternId = `checker-${id}`;
	const marblePatternId = `marble-${id}`;
	const borderGradientId = `border-${id}`;

	// チェック柄（CircleCheck, SquareCheck）
	if (
		objectId === ObjectIds.CircleCheck ||
		objectId === ObjectIds.SquareCheck
	) {
		const isCircle = objectId === ObjectIds.CircleCheck;
		return (
			<g transform={transform}>
				<defs>
					{/* チェッカーパターン定義 */}
					<pattern
						id={checkerPatternId}
						width={tileSize * 2}
						height={tileSize * 2}
						patternUnits="userSpaceOnUse"
						patternTransform={`translate(${-size / 2}, ${-size / 2})`}
					>
						<rect width={tileSize * 2} height={tileSize * 2} fill="#a0a0a0" />
						<rect width={tileSize} height={tileSize} fill="#707070" />
						<rect
							x={tileSize}
							y={tileSize}
							width={tileSize}
							height={tileSize}
							fill="#707070"
						/>
					</pattern>
					{/* 縁のグラデーション */}
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#b0b0b0" />
						<stop offset="50%" stopColor="#808080" />
						<stop offset="100%" stopColor="#606060" />
					</linearGradient>
				</defs>
				{isCircle ? (
					<>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill={`url(#${checkerPatternId})`}
						/>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				) : (
					<>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill={`url(#${checkerPatternId})`}
						/>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				)}
			</g>
		);
	}

	// グレー無地（CircleGraySolid, SquareGraySolid）
	if (
		objectId === ObjectIds.CircleGraySolid ||
		objectId === ObjectIds.SquareGraySolid
	) {
		const isCircle = objectId === ObjectIds.CircleGraySolid;
		return (
			<g transform={transform}>
				<defs>
					{/* 大理石風グラデーション */}
					<radialGradient id={marblePatternId} cx="50%" cy="50%" r="70%">
						<stop offset="0%" stopColor="#d8d8d8" />
						<stop offset="50%" stopColor="#b8b8b8" />
						<stop offset="100%" stopColor="#989898" />
					</radialGradient>
					{/* 縁のグラデーション */}
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#a0a0a0" />
						<stop offset="50%" stopColor="#707070" />
						<stop offset="100%" stopColor="#505050" />
					</linearGradient>
				</defs>
				{isCircle ? (
					<>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill={`url(#${marblePatternId})`}
						/>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				) : (
					<>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill={`url(#${marblePatternId})`}
						/>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				)}
			</g>
		);
	}

	// 白タイル（CircleWhiteTile, SquareWhiteTile）
	if (
		objectId === ObjectIds.CircleWhiteTile ||
		objectId === ObjectIds.SquareWhiteTile
	) {
		const isCircle = objectId === ObjectIds.CircleWhiteTile;
		return (
			<g transform={transform}>
				<defs>
					{/* 白タイルチェッカーパターン */}
					<pattern
						id={checkerPatternId}
						width={tileSize * 2}
						height={tileSize * 2}
						patternUnits="userSpaceOnUse"
						patternTransform={`translate(${-size / 2}, ${-size / 2})`}
					>
						<rect width={tileSize * 2} height={tileSize * 2} fill="#e8e8e8" />
						<rect width={tileSize} height={tileSize} fill="#c8c8c8" />
						<rect
							x={tileSize}
							y={tileSize}
							width={tileSize}
							height={tileSize}
							fill="#c8c8c8"
						/>
					</pattern>
					{/* 縁のグラデーション */}
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#b0b0b0" />
						<stop offset="50%" stopColor="#808080" />
						<stop offset="100%" stopColor="#606060" />
					</linearGradient>
				</defs>
				{isCircle ? (
					<>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill={`url(#${checkerPatternId})`}
						/>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				) : (
					<>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill={`url(#${checkerPatternId})`}
						/>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				)}
			</g>
		);
	}

	// 白無地（CircleWhiteSolid, SquareWhiteSolid）
	if (
		objectId === ObjectIds.CircleWhiteSolid ||
		objectId === ObjectIds.SquareWhiteSolid
	) {
		const isCircle = objectId === ObjectIds.CircleWhiteSolid;
		return (
			<g transform={transform}>
				<defs>
					{/* 白大理石風グラデーション */}
					<radialGradient id={marblePatternId} cx="50%" cy="50%" r="70%">
						<stop offset="0%" stopColor="#f0f0f0" />
						<stop offset="50%" stopColor="#e0e0e0" />
						<stop offset="100%" stopColor="#d0d0d0" />
					</radialGradient>
					{/* 縁のグラデーション */}
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#a0a0a0" />
						<stop offset="50%" stopColor="#707070" />
						<stop offset="100%" stopColor="#505050" />
					</linearGradient>
				</defs>
				{isCircle ? (
					<>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill={`url(#${marblePatternId})`}
						/>
						<circle
							cx={0}
							cy={0}
							r={size / 2}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				) : (
					<>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill={`url(#${marblePatternId})`}
						/>
						<rect
							x={-size / 2}
							y={-size / 2}
							width={size}
							height={size}
							fill="none"
							stroke={`url(#${borderGradientId})`}
							strokeWidth="2"
						/>
					</>
				)}
			</g>
		);
	}

	// 円形グレー（CircleGray）- 大きめ、縁ありグレー
	if (objectId === ObjectIds.CircleGray) {
		return (
			<g transform={transform}>
				<defs>
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#a0a0a0" />
						<stop offset="50%" stopColor="#808080" />
						<stop offset="100%" stopColor="#606060" />
					</linearGradient>
				</defs>
				<circle
					cx={0}
					cy={0}
					r={size / 2}
					fill={COLORS.FILL_FIELD_GRAY}
					stroke={`url(#${borderGradientId})`}
					strokeWidth="3"
				/>
			</g>
		);
	}

	// 正方形グレー（SquareGray）- 大きめ、縁ありグレー
	if (objectId === ObjectIds.SquareGray) {
		return (
			<g transform={transform}>
				<defs>
					<linearGradient
						id={borderGradientId}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#a0a0a0" />
						<stop offset="50%" stopColor="#808080" />
						<stop offset="100%" stopColor="#606060" />
					</linearGradient>
				</defs>
				<rect
					x={-size / 2}
					y={-size / 2}
					width={size}
					height={size}
					fill={COLORS.FILL_FIELD_GRAY}
					stroke={`url(#${borderGradientId})`}
					strokeWidth="3"
				/>
			</g>
		);
	}

	// フォールバック（カラー指定のシンプルな図形）
	const isCircle = CIRCLE_FIELD_IDS.includes(objectId);
	return (
		<g transform={transform}>
			{isCircle ? (
				<circle
					cx={0}
					cy={0}
					r={size / 2}
					fill={fill}
					stroke={COLORS.STROKE_DEFAULT}
					strokeWidth="1"
				/>
			) : (
				<rect
					x={-size / 2}
					y={-size / 2}
					width={size}
					height={size}
					fill={fill}
					stroke={COLORS.STROKE_DEFAULT}
					strokeWidth="1"
				/>
			)}
		</g>
	);
}

// AoEオブジェクト
function AoEObject({
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
	// オリジナル画像が有効な場合は画像を使用（色やパラメータが変更されている場合はSVGを使用）
	const originalIcon = renderOriginalIconIfEnabled(
		objectId,
		transform,
		color,
		param1,
		param2,
	);
	if (originalIcon) return originalIcon;

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

		case ObjectIds.LineAoE: {
			// LineAoE: param1 = 縦幅（長さ）、param2 = 横幅（太さ）
			// アンカーポイント10 = 端点基準（左端が原点）
			const length = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
			const thickness = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
			return (
				<rect
					x={0}
					y={-thickness / 2}
					width={length}
					height={thickness}
					fill={fill}
					stroke={COLORS.STROKE_AOE}
					strokeWidth="2"
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
	// オリジナル画像が有効な場合は画像を使用
	const originalIcon = renderOriginalIconIfEnabled(objectId, transform);
	if (originalIcon) return originalIcon;

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
	// オリジナル画像が有効な場合は画像を使用
	const originalIcon = renderOriginalIconIfEnabled(objectId, transform);
	if (originalIcon) return originalIcon;

	const size = SIZES.WAYMARK;
	const info = WAYMARK_INFO[objectId] ?? {
		label: "?",
		color: COLORS.ROLE_DEFAULT,
	};

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

	// オリジナル画像が有効な場合は画像を使用
	const originalIcon = renderOriginalIconIfEnabled(objectId, transform);
	if (originalIcon) return originalIcon;
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

			{/* エネミー大の外縁 */}
			{outerPath && <path d={outerPath} fill="#ffccaa" stroke="none" />}

			{/* シールド本体 */}
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

			{/* 顔のパーツ */}
			<g
				fill={colors.faceColor}
				opacity={objectId === ObjectIds.EnemySmall ? 1 : 0.9}
				filter={
					colors.hasGlow && colors.glowId ? `url(#${colors.glowId})` : undefined
				}
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
	// オリジナル画像が有効な場合は画像を使用
	const originalIcon = renderOriginalIconIfEnabled(objectId, transform);
	if (originalIcon) return originalIcon;

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

// マーカーアイコン（攻撃マーカー、足止めマーカー、禁止マーカー、汎用マーカー）
function MarkerIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	// オリジナル画像が有効な場合は画像を使用
	const originalIcon = renderOriginalIconIfEnabled(objectId, transform);
	if (originalIcon) return originalIcon;

	if (ATTACK_MARKER_IDS.includes(objectId)) {
		return <AttackMarkerIcon objectId={objectId} transform={transform} />;
	}
	if (BIND_MARKER_IDS.includes(objectId)) {
		return <BindMarkerIcon objectId={objectId} transform={transform} />;
	}
	if (IGNORE_MARKER_IDS.includes(objectId)) {
		return <IgnoreMarkerIcon objectId={objectId} transform={transform} />;
	}
	if (GENERIC_MARKER_IDS.includes(objectId)) {
		return <GenericMarkerIcon objectId={objectId} transform={transform} />;
	}
	return <PlaceholderObject objectId={objectId} transform={transform} />;
}

// 攻撃マーカー（六角形、下にタブ付き、中央に数字）
function AttackMarkerIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const id = useId();
	const glowId = `attackMarkerGlow-${id}`;
	const gradId = `attackMarkerGrad-${id}`;

	// 数字を取得
	const numberMap: Record<number, number> = {
		[ObjectIds.Attack1]: 1,
		[ObjectIds.Attack2]: 2,
		[ObjectIds.Attack3]: 3,
		[ObjectIds.Attack4]: 4,
		[ObjectIds.Attack5]: 5,
		[ObjectIds.Attack6]: 6,
		[ObjectIds.Attack7]: 7,
		[ObjectIds.Attack8]: 8,
	};
	const num = numberMap[objectId] ?? 1;

	// 六角形のパス（下にタブ付き）
	const hexPath = `
		M 0 -20
		L 17 -10
		L 17 10
		L 8 18
		L 8 24
		L -8 24
		L -8 18
		L -17 10
		L -17 -10
		Z
	`;

	return (
		<g transform={transform}>
			{/* 透明な背景（クリック領域） */}
			<rect x={-20} y={-22} width={40} height={48} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="2" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#ffee88" />
					<stop offset="50%" stopColor="#ffcc00" />
					<stop offset="100%" stopColor="#ff9900" />
				</linearGradient>
			</defs>

			{/* グロー効果 */}
			<path
				d={hexPath}
				fill="none"
				stroke="#ffaa00"
				strokeWidth="6"
				filter={`url(#${glowId})`}
				opacity="0.6"
			/>

			{/* 六角形の縁 */}
			<path
				d={hexPath}
				fill="none"
				stroke={`url(#${gradId})`}
				strokeWidth="3"
				strokeLinejoin="round"
			/>

			{/* 内側の六角形 */}
			<path
				d={`
					M 0 -16
					L 13 -8
					L 13 8
					L 6 14
					L 6 20
					L -6 20
					L -6 14
					L -13 8
					L -13 -8
					Z
				`}
				fill="rgba(40, 30, 20, 0.8)"
				stroke="none"
			/>

			{/* 数字 */}
			<text
				x={0}
				y={2}
				textAnchor="middle"
				dominantBaseline="middle"
				fill="#ffdd66"
				fontSize="18"
				fontWeight="bold"
				fontFamily="Arial, sans-serif"
			>
				{num}
			</text>
		</g>
	);
}

// 足止めマーカー（3つのチェーンリンク）
function BindMarkerIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const id = useId();
	const glowId = `bindMarkerGlow-${id}`;

	// 数字を取得
	const numberMap: Record<number, number> = {
		[ObjectIds.Bind1]: 1,
		[ObjectIds.Bind2]: 2,
		[ObjectIds.Bind3]: 3,
	};
	const num = numberMap[objectId] ?? 1;

	// 楕円形のチェーンリンク（縦長の楕円）
	const rx = 8; // 横の半径
	const ry = 12; // 縦の半径

	return (
		<g transform={transform}>
			{/* 透明な背景（クリック領域） */}
			<rect x={-20} y={-30} width={44} height={64} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="1.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			{/* グロー効果 */}
			<g filter={`url(#${glowId})`} opacity="0.5">
				<ellipse
					cx={-4}
					cy={-14}
					rx={rx}
					ry={ry}
					fill="none"
					stroke="#bb77dd"
					strokeWidth="6"
				/>
				<ellipse
					cx={4}
					cy={0}
					rx={rx}
					ry={ry}
					fill="none"
					stroke="#bb77dd"
					strokeWidth="6"
				/>
				<ellipse
					cx={-4}
					cy={14}
					rx={rx}
					ry={ry}
					fill="none"
					stroke="#bb77dd"
					strokeWidth="6"
				/>
			</g>

			{/* リンク1（上）- 外側の白い縁 */}
			<ellipse
				cx={-4}
				cy={-14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#ffffff"
				strokeWidth="3"
			/>
			{/* リンク1 - 内側の紫 */}
			<ellipse
				cx={-4}
				cy={-14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#9955bb"
				strokeWidth="1.5"
			/>

			{/* リンク2（中央）- 外側の白い縁 */}
			<ellipse
				cx={4}
				cy={0}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#ffffff"
				strokeWidth="3"
			/>
			{/* リンク2 - 内側の紫 */}
			<ellipse
				cx={4}
				cy={0}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#9955bb"
				strokeWidth="1.5"
			/>

			{/* リンク3（下）- 外側の白い縁 */}
			<ellipse
				cx={-4}
				cy={14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#ffffff"
				strokeWidth="3"
			/>
			{/* リンク3 - 内側の紫 */}
			<ellipse
				cx={-4}
				cy={14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#9955bb"
				strokeWidth="1.5"
			/>

			{/* 数字 */}
			<text
				x={16}
				y={-16}
				textAnchor="middle"
				dominantBaseline="middle"
				fill="#ffffff"
				fontSize="14"
				fontWeight="bold"
				fontFamily="Arial, sans-serif"
			>
				{num}
			</text>
		</g>
	);
}

// 禁止マーカー（円に斜線）
function IgnoreMarkerIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const id = useId();
	const glowId = `ignoreMarkerGlow-${id}`;

	// 数字を取得
	const numberMap: Record<number, number> = {
		[ObjectIds.Ignore1]: 1,
		[ObjectIds.Ignore2]: 2,
	};
	const num = numberMap[objectId] ?? 1;

	const radius = 18;

	return (
		<g transform={transform}>
			{/* 透明な背景（クリック領域） */}
			<rect x={-22} y={-22} width={44} height={44} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="2" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			{/* グロー効果 */}
			<g filter={`url(#${glowId})`} opacity="0.6">
				<circle
					cx={0}
					cy={0}
					r={radius}
					fill="none"
					stroke="#ff4444"
					strokeWidth="5"
				/>
				<line
					x1={-12}
					y1={12}
					x2={12}
					y2={-12}
					stroke="#ff4444"
					strokeWidth="5"
				/>
			</g>

			{/* メインの円 */}
			<circle
				cx={0}
				cy={0}
				r={radius}
				fill="none"
				stroke="#ff6666"
				strokeWidth="3"
			/>

			{/* 斜線 */}
			<line
				x1={-12}
				y1={12}
				x2={12}
				y2={-12}
				stroke="#ff6666"
				strokeWidth="3"
				strokeLinecap="round"
			/>

			{/* 数字（左上に小さく） */}
			<text
				x={-10}
				y={-10}
				textAnchor="middle"
				dominantBaseline="middle"
				fill="#ffffff"
				fontSize="10"
				fontWeight="bold"
				fontFamily="Arial, sans-serif"
			>
				{num}
			</text>
		</g>
	);
}

// 汎用マーカー（四角、丸、プラス、三角）
function GenericMarkerIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const id = useId();
	const glowId = `genericMarkerGlow-${id}`;
	const gradId = `genericMarkerGrad-${id}`;

	return (
		<g transform={transform}>
			{/* 透明な背景（クリック領域） */}
			<rect x={-24} y={-24} width={48} height={48} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="3" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#88ddff" />
					<stop offset="50%" stopColor="#44aaff" />
					<stop offset="100%" stopColor="#2288dd" />
				</linearGradient>
			</defs>

			{objectId === ObjectIds.Square && (
				<>
					{/* グロー */}
					<rect
						x={-16}
						y={-16}
						width={32}
						height={32}
						rx={4}
						ry={4}
						fill="none"
						stroke="#66ccff"
						strokeWidth="8"
						filter={`url(#${glowId})`}
						opacity="0.5"
					/>
					{/* 外側の四角 */}
					<rect
						x={-16}
						y={-16}
						width={32}
						height={32}
						rx={4}
						ry={4}
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="3"
					/>
					{/* 内側の四角 */}
					<rect
						x={-10}
						y={-10}
						width={20}
						height={20}
						rx={2}
						ry={2}
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="2"
					/>
				</>
			)}

			{objectId === ObjectIds.Circle && (
				<>
					{/* グロー */}
					<circle
						cx={0}
						cy={0}
						r={16}
						fill="none"
						stroke="#66ccff"
						strokeWidth="8"
						filter={`url(#${glowId})`}
						opacity="0.5"
					/>
					{/* 外側の円 */}
					<circle
						cx={0}
						cy={0}
						r={16}
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="3"
					/>
					{/* 内側の円 */}
					<circle
						cx={0}
						cy={0}
						r={10}
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="2"
					/>
				</>
			)}

			{objectId === ObjectIds.Plus && (
				<>
					{/* グロー */}
					<g filter={`url(#${glowId})`} opacity="0.5">
						<line
							x1={0}
							y1={-16}
							x2={0}
							y2={16}
							stroke="#66ccff"
							strokeWidth="10"
						/>
						<line
							x1={-16}
							y1={0}
							x2={16}
							y2={0}
							stroke="#66ccff"
							strokeWidth="10"
						/>
					</g>
					{/* プラス記号 */}
					<line
						x1={0}
						y1={-16}
						x2={0}
						y2={16}
						stroke={`url(#${gradId})`}
						strokeWidth="4"
						strokeLinecap="round"
					/>
					<line
						x1={-16}
						y1={0}
						x2={16}
						y2={0}
						stroke={`url(#${gradId})`}
						strokeWidth="4"
						strokeLinecap="round"
					/>
				</>
			)}

			{objectId === ObjectIds.Triangle && (
				<>
					{/* グロー */}
					<path
						d="M 0 -18 L 16 14 L -16 14 Z"
						fill="none"
						stroke="#66ccff"
						strokeWidth="8"
						filter={`url(#${glowId})`}
						opacity="0.5"
						strokeLinejoin="round"
					/>
					{/* 外側の三角形 */}
					<path
						d="M 0 -18 L 16 14 L -16 14 Z"
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="3"
						strokeLinejoin="round"
					/>
					{/* 内側の三角形 */}
					<path
						d="M 0 -10 L 10 8 L -10 8 Z"
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth="2"
						strokeLinejoin="round"
					/>
				</>
			)}
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
