import { ObjectIds } from "@/lib/stgy";

// ========================================
// アイコン表示設定
// ========================================

/**
 * カスタムアイコン対応オブジェクトIDのセット
 * 画像ファイルは /public/icons/{objectId}.png に配置
 * 注: ConeAoE, LineAoE, Line はパラメータ反映のため常にSVGでレンダリング（画像はサイドバーアイコンのみ）
 */
export const CUSTOM_ICON_IDS = new Set<number>([
	// フィールド
	ObjectIds.CircleCheck,
	ObjectIds.SquareCheck,
	ObjectIds.CircleGray,
	ObjectIds.SquareGray,
	// 攻撃範囲（ConeAoE, LineAoE, Line は除外 - 常にSVGでレンダリング）
	ObjectIds.CircleAoE,
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
	ObjectIds.MeleeDPS,
	ObjectIds.RangedDPS,
	ObjectIds.PhysicalRangedDPS,
	ObjectIds.MagicalRangedDPS,
	ObjectIds.PureHealer,
	ObjectIds.BarrierHealer,
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
export const CONE_RADIUS = 256;

/** オブジェクトサイズ定数（レガシー：徐々にOBJECT_BBOX_SIZESに移行） */
export const SIZES = {
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
export const COLORS = {
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
export const TEXT = {
	CHAR_WIDTH: 10,
	MIN_BBOX_WIDTH: 40,
	DEFAULT_HEIGHT: 20,
} as const;

/** デフォルトのパラメータ値 */
export const DEFAULT_PARAMS = {
	LINE_HEIGHT: 128, // 直線範囲攻撃の縦幅デフォルト
	LINE_WIDTH: 128, // 直線範囲攻撃の横幅デフォルト
} as const;

// ========================================
// ルックアップテーブル
// ========================================

/** ロールラベルマップ */
export const ROLE_LABELS: Record<number, string> = {
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
export const ROLE_COLORS: Record<number, string> = {
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
export const WAYMARK_INFO: Record<number, { label: string; color: string }> = {
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
export const ENEMY_SIZES: Record<number, number> = {
	60: SIZES.ENEMY_SMALL,
	62: SIZES.ENEMY_MEDIUM,
	64: SIZES.ENEMY_LARGE,
};

// ========================================
// オブジェクトID分類
// ========================================

/** 大きいフィールドID（すべてのフィールドオブジェクト） */
export const LARGE_FIELD_IDS: readonly number[] = [
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
export const CIRCLE_FIELD_IDS: readonly number[] = [
	ObjectIds.CircleWhiteSolid,
	ObjectIds.CircleWhiteTile,
	ObjectIds.CircleGraySolid,
	ObjectIds.CircleCheck,
	ObjectIds.CircleGray,
];

/** 四角形フィールドID */
export const SQUARE_FIELD_IDS: readonly number[] = [
	ObjectIds.SquareWhiteSolid,
	ObjectIds.SquareWhiteTile,
	ObjectIds.SquareGraySolid,
	ObjectIds.SquareCheck,
	ObjectIds.SquareGray,
];

/** フィールドオブジェクトID */
export const FIELD_OBJECT_IDS: readonly number[] = [
	...CIRCLE_FIELD_IDS,
	...SQUARE_FIELD_IDS,
];

/** AoEオブジェクトID */
export const AOE_OBJECT_IDS: readonly number[] = [
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
	ObjectIds.ShapeSquare,
	ObjectIds.ShapeTriangle,
	ObjectIds.ShapeArrow,
	ObjectIds.ShapeRotation,
];

/** エネミーオブジェクトID */
export const ENEMY_OBJECT_IDS: readonly number[] = [
	ObjectIds.EnemySmall,
	ObjectIds.EnemyMedium,
	ObjectIds.EnemyLarge,
];

/** 攻撃マーカーID */
export const ATTACK_MARKER_IDS: readonly number[] = [
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
export const BIND_MARKER_IDS: readonly number[] = [
	ObjectIds.Bind1,
	ObjectIds.Bind2,
	ObjectIds.Bind3,
];

/** 禁止マーカーID */
export const IGNORE_MARKER_IDS: readonly number[] = [
	ObjectIds.Ignore1,
	ObjectIds.Ignore2,
];

/** 汎用マーカーID */
export const GENERIC_MARKER_IDS: readonly number[] = [
	ObjectIds.Square,
	ObjectIds.Circle,
	ObjectIds.Plus,
	ObjectIds.Triangle,
];

/** マーカーオブジェクトID（全種類） */
export const MARKER_OBJECT_IDS: readonly number[] = [
	...ATTACK_MARKER_IDS,
	...BIND_MARKER_IDS,
	...IGNORE_MARKER_IDS,
	...GENERIC_MARKER_IDS,
];

/** ジョブアイコンID */
export const JOB_ICON_IDS: readonly number[] = [
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
export const JOB_ABBREVIATIONS: Record<number, string> = {
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
export const JOB_ROLES: Record<
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
export const JOB_ROLE_COLORS: Record<string, string> = {
	tank: COLORS.ROLE_TANK,
	healer: COLORS.ROLE_HEALER,
	melee: COLORS.ROLE_DPS,
	ranged: "#cc6633", // レンジDPSはオレンジ
	caster: "#cc33cc", // キャスターDPSは紫
};

/** デフォルトの色（この色の場合はオリジナル画像を使用） */
export const DEFAULT_OBJECT_COLOR = { r: 255, g: 100, b: 0, opacity: 0 } as const;

/**
 * 色変更が有効なオブジェクトID
 * 直線範囲攻撃、ライン、テキストのみ色変更に対応
 */
export const COLOR_CHANGEABLE_OBJECT_IDS = new Set<number>([
	ObjectIds.LineAoE,
	ObjectIds.Line,
	ObjectIds.Text,
]);
