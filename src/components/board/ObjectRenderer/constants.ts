import { ObjectIds } from "@/lib/stgy";

/**
 * Object IDs that have custom icon images at /public/assets/icons/{objectId}.png
 * Note: ConeAoE, LineAoE, Line always use SVG rendering for parameter support (images are sidebar icons only)
 */
export const CUSTOM_ICON_IDS = new Set<number>([
	ObjectIds.CircleCheck,
	ObjectIds.SquareCheck,
	ObjectIds.CircleGray,
	ObjectIds.SquareGray,
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
	ObjectIds.EnemySmall,
	ObjectIds.EnemyMedium,
	ObjectIds.EnemyLarge,
	ObjectIds.Buff,
	ObjectIds.Debuff,
	ObjectIds.ShapeCircle,
	ObjectIds.ShapeCross,
	ObjectIds.ShapeTriangle,
	ObjectIds.ShapeSquare,
	ObjectIds.ShapeArrow,
	ObjectIds.ShapeRotation,
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
	ObjectIds.Group,
	ObjectIds.Text,
	ObjectIds.Attack1,
	ObjectIds.Attack2,
	ObjectIds.Attack3,
	ObjectIds.Attack4,
	ObjectIds.Attack5,
	ObjectIds.Attack6,
	ObjectIds.Attack7,
	ObjectIds.Attack8,
	ObjectIds.Bind1,
	ObjectIds.Bind2,
	ObjectIds.Bind3,
	ObjectIds.Ignore1,
	ObjectIds.Ignore2,
	ObjectIds.Square,
	ObjectIds.Circle,
	ObjectIds.Plus,
	ObjectIds.Triangle,
	ObjectIds.WaymarkA,
	ObjectIds.WaymarkB,
	ObjectIds.WaymarkC,
	ObjectIds.WaymarkD,
	ObjectIds.Waymark1,
	ObjectIds.Waymark2,
	ObjectIds.Waymark3,
	ObjectIds.Waymark4,
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
	ObjectIds.Gladiator,
	ObjectIds.Pugilist,
	ObjectIds.Marauder,
	ObjectIds.Lancer,
	ObjectIds.Archer,
	ObjectIds.Conjurer,
	ObjectIds.Thaumaturge,
	ObjectIds.Arcanist,
	ObjectIds.Rogue,
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

/** Cone AoE radius */
export const CONE_RADIUS = 256;

/** Object size constants (legacy: migrating to OBJECT_BBOX_SIZES) */
export const SIZES = {
	ROLE_ICON: 24,
	WAYMARK: 32,
	ENEMY_SMALL: 32,
	ENEMY_MEDIUM: 48,
	ENEMY_LARGE: 64,
	FIELD: 64,
	FIELD_LARGE: 256,
	AOE_BASE: 48,
	CONE_RADIUS: 256,
	LINE_WIDTH: 16,
	PLACEHOLDER: 16,
} as const;

export const COLORS = {
	STROKE_DEFAULT: "#666",
	STROKE_AOE: "#ff8800",
	STROKE_STACK: "#ffff00",
	STROKE_WHITE: "#fff",
	STROKE_ENEMY: "#ff0000",
	FILL_AOE: "rgba(255, 150, 0, 0.4)",
	FILL_ENEMY: "#8b0000",
	FILL_PROXIMITY: "#ffcc00",
	FILL_PLACEHOLDER: "#666",
	FILL_FIELD_GRAY: "rgba(80, 80, 80, 0.6)",
	STROKE_FIELD_GRAY: "#888",
	ROLE_TANK: "#3366cc",
	ROLE_HEALER: "#33cc33",
	ROLE_DPS: "#cc3333",
	ROLE_DEFAULT: "#666",
	WAYMARK_RED: "#cc3333",
	WAYMARK_YELLOW: "#cccc33",
	WAYMARK_BLUE: "#3366cc",
	WAYMARK_PURPLE: "#cc33cc",
	SELECTION: "#00bfff",
} as const;

/** Text rendering constants */
export const TEXT = {
	/** Half-width character width (~0.5x fontSize=14) */
	HALF_WIDTH_CHAR: 7,
	/** Full-width character width (~1.0x fontSize=14) */
	FULL_WIDTH_CHAR: 14,
	/** Minimum bounding box width */
	MIN_BBOX_WIDTH: 40,
	/** Default height */
	DEFAULT_HEIGHT: 20,
} as const;

/**
 * Check if character is full-width.
 * Treats CJK, full-width symbols, and full-width alphanumerics as full-width.
 * Half-width katakana (U+FF61-U+FF9F) is treated as half-width.
 */
export function isFullWidthChar(char: string): boolean {
	const code = char.codePointAt(0);
	if (code === undefined) return false;

	if (code >= 0xff61 && code <= 0xff9f) {
		return false;
	}

	return (
		(code >= 0x4e00 && code <= 0x9fff) ||
		(code >= 0x3040 && code <= 0x309f) ||
		(code >= 0x30a0 && code <= 0x30ff) ||
		(code >= 0xff00 && code <= 0xffef) ||
		(code >= 0x3000 && code <= 0x303f) ||
		(code >= 0x3400 && code <= 0x4dbf) ||
		(code >= 0x20000 && code <= 0x2a6df) ||
		(code >= 0x2a700 && code <= 0x2ebef) ||
		(code >= 0x2f800 && code <= 0x2fa1f)
	);
}

/**
 * Calculate text display width in pixels.
 * Uses different widths for full-width and half-width characters.
 */
export function calculateTextWidth(text: string): number {
	let width = 0;
	for (const char of text) {
		width += isFullWidthChar(char)
			? TEXT.FULL_WIDTH_CHAR
			: TEXT.HALF_WIDTH_CHAR;
	}
	return width;
}

export { DEFAULT_PARAMS } from "@/lib/board";

export const ROLE_LABELS: Record<number, string> = {
	47: "T",
	48: "MT",
	49: "ST",
	50: "H",
	51: "H1",
	52: "H2",
	53: "D",
	54: "D1",
	55: "D2",
	56: "D3",
	57: "D4",
	118: "M",
	119: "R",
	120: "PR",
	121: "MR",
	122: "PH",
	123: "BH",
};

export const ROLE_COLORS: Record<number, string> = {
	47: COLORS.ROLE_TANK,
	48: COLORS.ROLE_TANK,
	49: COLORS.ROLE_TANK,
	50: COLORS.ROLE_HEALER,
	51: COLORS.ROLE_HEALER,
	52: COLORS.ROLE_HEALER,
	122: COLORS.ROLE_HEALER,
	123: COLORS.ROLE_HEALER,
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

export const ENEMY_SIZES: Record<number, number> = {
	60: SIZES.ENEMY_SMALL,
	62: SIZES.ENEMY_MEDIUM,
	64: SIZES.ENEMY_LARGE,
};

/** All field object IDs */
export const LARGE_FIELD_IDS: readonly number[] = [
	ObjectIds.CircleWhiteSolid,
	ObjectIds.CircleWhiteTile,
	ObjectIds.CircleGraySolid,
	ObjectIds.CircleCheck,
	ObjectIds.CircleGray,
	ObjectIds.SquareWhiteSolid,
	ObjectIds.SquareWhiteTile,
	ObjectIds.SquareGraySolid,
	ObjectIds.SquareCheck,
	ObjectIds.SquareGray,
];

export const CIRCLE_FIELD_IDS: readonly number[] = [
	ObjectIds.CircleWhiteSolid,
	ObjectIds.CircleWhiteTile,
	ObjectIds.CircleGraySolid,
	ObjectIds.CircleCheck,
	ObjectIds.CircleGray,
];

export const SQUARE_FIELD_IDS: readonly number[] = [
	ObjectIds.SquareWhiteSolid,
	ObjectIds.SquareWhiteTile,
	ObjectIds.SquareGraySolid,
	ObjectIds.SquareCheck,
	ObjectIds.SquareGray,
];

export const FIELD_OBJECT_IDS: readonly number[] = [
	...CIRCLE_FIELD_IDS,
	...SQUARE_FIELD_IDS,
];

export const AOE_OBJECT_IDS: readonly number[] = [
	ObjectIds.CircleAoE,
	ObjectIds.ConeAoE,
	ObjectIds.LineAoE,
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

export const ENEMY_OBJECT_IDS: readonly number[] = [
	ObjectIds.EnemySmall,
	ObjectIds.EnemyMedium,
	ObjectIds.EnemyLarge,
];

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

export const BIND_MARKER_IDS: readonly number[] = [
	ObjectIds.Bind1,
	ObjectIds.Bind2,
	ObjectIds.Bind3,
];

export const IGNORE_MARKER_IDS: readonly number[] = [
	ObjectIds.Ignore1,
	ObjectIds.Ignore2,
];

export const GENERIC_MARKER_IDS: readonly number[] = [
	ObjectIds.Square,
	ObjectIds.Circle,
	ObjectIds.Plus,
	ObjectIds.Triangle,
];

export const MARKER_OBJECT_IDS: readonly number[] = [
	...ATTACK_MARKER_IDS,
	...BIND_MARKER_IDS,
	...IGNORE_MARKER_IDS,
	...GENERIC_MARKER_IDS,
];

export const JOB_ICON_IDS: readonly number[] = [
	ObjectIds.Gladiator,
	ObjectIds.Pugilist,
	ObjectIds.Marauder,
	ObjectIds.Lancer,
	ObjectIds.Archer,
	ObjectIds.Conjurer,
	ObjectIds.Thaumaturge,
	ObjectIds.Arcanist,
	ObjectIds.Rogue,
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

/** Job abbreviations (English) */
export const JOB_ABBREVIATIONS: Record<number, string> = {
	[ObjectIds.Gladiator]: "GLA",
	[ObjectIds.Pugilist]: "PGL",
	[ObjectIds.Marauder]: "MRD",
	[ObjectIds.Lancer]: "LNC",
	[ObjectIds.Archer]: "ARC",
	[ObjectIds.Conjurer]: "CNJ",
	[ObjectIds.Thaumaturge]: "THM",
	[ObjectIds.Arcanist]: "ACN",
	[ObjectIds.Rogue]: "ROG",
	[ObjectIds.Paladin]: "PLD",
	[ObjectIds.Warrior]: "WAR",
	[ObjectIds.DarkKnight]: "DRK",
	[ObjectIds.Gunbreaker]: "GNB",
	[ObjectIds.WhiteMage]: "WHM",
	[ObjectIds.Scholar]: "SCH",
	[ObjectIds.Astrologian]: "AST",
	[ObjectIds.Sage]: "SGE",
	[ObjectIds.Monk]: "MNK",
	[ObjectIds.Dragoon]: "DRG",
	[ObjectIds.Ninja]: "NIN",
	[ObjectIds.Samurai]: "SAM",
	[ObjectIds.Reaper]: "RPR",
	[ObjectIds.Viper]: "VPR",
	[ObjectIds.Bard]: "BRD",
	[ObjectIds.Machinist]: "MCH",
	[ObjectIds.Dancer]: "DNC",
	[ObjectIds.BlackMage]: "BLM",
	[ObjectIds.Summoner]: "SMN",
	[ObjectIds.RedMage]: "RDM",
	[ObjectIds.Pictomancer]: "PCT",
	[ObjectIds.BlueMage]: "BLU",
};

export const JOB_ROLES: Record<
	number,
	"tank" | "healer" | "melee" | "ranged" | "caster"
> = {
	[ObjectIds.Gladiator]: "tank",
	[ObjectIds.Marauder]: "tank",
	[ObjectIds.Pugilist]: "melee",
	[ObjectIds.Lancer]: "melee",
	[ObjectIds.Rogue]: "melee",
	[ObjectIds.Archer]: "ranged",
	[ObjectIds.Conjurer]: "healer",
	[ObjectIds.Thaumaturge]: "caster",
	[ObjectIds.Arcanist]: "caster",
	[ObjectIds.Paladin]: "tank",
	[ObjectIds.Warrior]: "tank",
	[ObjectIds.DarkKnight]: "tank",
	[ObjectIds.Gunbreaker]: "tank",
	[ObjectIds.WhiteMage]: "healer",
	[ObjectIds.Scholar]: "healer",
	[ObjectIds.Astrologian]: "healer",
	[ObjectIds.Sage]: "healer",
	[ObjectIds.Monk]: "melee",
	[ObjectIds.Dragoon]: "melee",
	[ObjectIds.Ninja]: "melee",
	[ObjectIds.Samurai]: "melee",
	[ObjectIds.Reaper]: "melee",
	[ObjectIds.Viper]: "melee",
	[ObjectIds.Bard]: "ranged",
	[ObjectIds.Machinist]: "ranged",
	[ObjectIds.Dancer]: "ranged",
	[ObjectIds.BlackMage]: "caster",
	[ObjectIds.Summoner]: "caster",
	[ObjectIds.RedMage]: "caster",
	[ObjectIds.Pictomancer]: "caster",
	[ObjectIds.BlueMage]: "caster",
};

export const JOB_ROLE_COLORS: Record<string, string> = {
	tank: COLORS.ROLE_TANK,
	healer: COLORS.ROLE_HEALER,
	melee: COLORS.ROLE_DPS,
	ranged: "#cc6633",
	caster: "#cc33cc",
};

export { DEFAULT_OBJECT_COLOR } from "@/lib/board";

/** Object IDs that support color changes (LineAoE, Line, Text only) */
export const COLOR_CHANGEABLE_OBJECT_IDS = new Set<number>([
	ObjectIds.LineAoE,
	ObjectIds.Line,
	ObjectIds.Text,
]);

/** Object IDs with high-resolution images at /public/assets/icons-hr/{objectId}.png */
export const HR_ICON_IDS = new Set<number>([
	4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
	27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
	46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 60, 62, 64, 65, 66, 67, 68,
	69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87,
	88, 89, 90, 94, 100, 101, 102, 103, 105, 106, 107, 108, 109, 110, 111, 112,
	113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127,
	128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140,
]);

/** Get icon path for object ID, using HR version if available */
export function getIconPath(objectId: number): string {
	if (HR_ICON_IDS.has(objectId)) {
		return `/assets/icons-hr/${objectId}.png`;
	}
	return `/assets/icons/${objectId}.png`;
}
