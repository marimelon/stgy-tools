/**
 * stgy board data type definitions
 */

/**
 * RGBA color information
 */
export interface Color {
	r: number;
	g: number;
	b: number;
	/** Opacity 0-100 */
	opacity: number;
}

/**
 * Position (stored in 1/10 pixel units, converted to pixels for display)
 */
export interface Position {
	x: number;
	y: number;
}

/**
 * Object state flags
 */
export interface ObjectFlags {
	visible: boolean;
	flipHorizontal: boolean;
	flipVertical: boolean;
	locked: boolean;
}

/**
 * Board object without ID (parser output)
 * Output from parser, ID is assigned by assignObjectIds
 */
export interface BoardObjectWithoutId {
	/** Object ID (indicates object type) */
	objectId: number;
	/** Text content (for text objects) */
	text?: string;
	flags: ObjectFlags;
	/** Position (in pixels) */
	position: Position;
	/** Rotation angle (-180 to 180 degrees) */
	rotation: number;
	/** Size (50-200, 100=100%) */
	size: number;
	color: Color;
	/** Object-specific parameter 1 (e.g., cone angle for cone AoE) */
	param1?: number;
	/** Object-specific parameter 2 (e.g., donut range for donut AoE) */
	param2?: number;
	param3?: number;
}

/**
 * Board object with runtime ID
 */
export interface BoardObject extends BoardObjectWithoutId {
	/** Runtime ID (discarded on save) */
	id: string;
}

/**
 * Background ID
 */
export enum BackgroundId {
	None = 1,
	FullCheck = 2,
	CircleCheck = 3,
	SquareCheck = 4,
	FullGray = 5,
	CircleGray = 6,
	SquareGray = 7,
}

/**
 * Board data with runtime ID objects
 *
 * Note: The stgy binary format does not include board size (width/height).
 * Canvas size is fixed (512x384) or calculated at render time.
 */
export interface BoardData {
	/** Version (= 2) */
	version: number;
	name: string;
	backgroundId: BackgroundId;
	objects: BoardObject[];
	/** Padding byte after size array (for round-trip, internal use) */
	_sizePaddingByte?: number;
	/** Empty field count at section content start (for round-trip, internal use) */
	_emptyFieldCount?: number;
}

/**
 * Parsed board data (objects without ID)
 * Output type of parseBoardData. Converted to BoardData by assignObjectIds.
 */
export interface ParsedBoardData {
	/** Version (= 2) */
	version: number;
	name: string;
	backgroundId: BackgroundId;
	/** Object list (without ID) */
	objects: BoardObjectWithoutId[];
	/** Padding byte after size array (for round-trip, internal use) */
	_sizePaddingByte?: number;
	/** Empty field count at section content start (for round-trip, internal use) */
	_emptyFieldCount?: number;
}

/**
 * Object name map (i18n keys)
 */
export const ObjectNames: Record<number, string> = {
	// Field
	1: "円形白無地フィールド", // unused (CSV: False)
	2: "円形白タイルフィールド", // unused (CSV: False)
	3: "円形グレー無地フィールド", // unused (CSV: False)
	4: "円形チェック",
	5: "四角形白無地フィールド", // unused (CSV: False)
	6: "四角形白タイルフィールド", // unused (CSV: False)
	7: "四角形グレー無地フィールド", // unused (CSV: False)
	8: "正方形チェック",
	124: "円形グレー",
	125: "正方形グレー",

	// AoE
	9: "円形範囲攻撃",
	10: "扇範囲攻撃",
	11: "直線範囲攻撃",
	12: "ライン",
	13: "視線攻撃",
	14: "頭割りダメージ攻撃",
	15: "頭割りダメージ攻撃：直線型",
	16: "距離減衰ダメージ攻撃",
	17: "輪形範囲攻撃",
	106: "頭割りダメージ攻撃：連続型",
	107: "距離減衰ダメージ攻撃：対象発動型",
	108: "強攻撃",
	109: "ノックバック攻撃：放射型",
	110: "ノックバック攻撃：直線型",
	111: "受け止め攻撃",
	112: "ターゲット予兆",
	126: "円形範囲攻撃：移動型",
	127: "1人用エリア",
	128: "2人用エリア",
	129: "3人用エリア",
	130: "4人用エリア",

	// Job icons
	18: "剣術士",
	19: "格闘士",
	20: "斧術士",
	21: "槍術士",
	22: "弓術士",
	23: "幻術士",
	24: "呪術士",
	25: "巴術士",
	26: "双剣士",
	27: "ナイト",
	28: "モンク",
	29: "戦士",
	30: "竜騎士",
	31: "吟遊詩人",
	32: "白魔道士",
	33: "黒魔道士",
	34: "召喚士",
	35: "学者",
	36: "忍者",
	37: "機工士",
	38: "暗黒騎士",
	39: "占星術師",
	40: "侍",
	41: "赤魔道士",
	42: "青魔道士",
	43: "ガンブレイカー",
	44: "踊り子",
	45: "リーパー",
	46: "賢者",
	101: "ヴァイパー",
	102: "ピクトマンサー",

	// Role icons
	47: "タンク",
	48: "タンク1",
	49: "タンク2",
	50: "ヒーラー",
	51: "ヒーラー1",
	52: "ヒーラー2",
	53: "DPS",
	54: "DPS1",
	55: "DPS2",
	56: "DPS3",
	57: "DPS4",
	118: "近接DPS",
	119: "遠隔DPS",
	120: "遠隔物理DPS",
	121: "遠隔魔法DPS",
	122: "ピュアヒーラー",
	123: "バリアヒーラー",

	// Enemy
	60: "エネミー小",
	62: "エネミー中",
	64: "エネミー大",

	// Attack markers
	65: "攻撃1",
	66: "攻撃2",
	67: "攻撃3",
	68: "攻撃4",
	69: "攻撃5",
	115: "攻撃6",
	116: "攻撃7",
	117: "攻撃8",

	// Bind markers
	70: "足止め1",
	71: "足止め2",
	72: "足止め3",

	// Ignore markers
	73: "禁止1",
	74: "禁止2",

	// Generic markers
	75: "シカク",
	76: "マル",
	77: "プラス",
	78: "サンカク",

	// Waymarks
	79: "フィールドマーカーA",
	80: "フィールドマーカーB",
	81: "フィールドマーカーC",
	82: "フィールドマーカーD",
	83: "フィールドマーカー1",
	84: "フィールドマーカー2",
	85: "フィールドマーカー3",
	86: "フィールドマーカー4",

	// Buff/Debuff
	113: "バフ効果",
	114: "デバフ効果",

	// Lock-on markers
	131: "ロックオン赤",
	132: "ロックオン青",
	133: "ロックオン紫",
	134: "ロックオン緑",

	// Shapes
	87: "図形マル",
	88: "図形バツ",
	89: "図形サンカク",
	90: "図形シカク",
	94: "図形ヤジルシ",
	103: "図形カイテン",
	135: "強調マル",
	136: "強調バツ",
	137: "強調シカク",
	138: "強調サンカク",
	139: "時計回り",
	140: "反時計回り",

	// Other
	100: "テキスト",
	105: "グループ",
};

export const ObjectIds = {
	// Field
	/** @deprecated unused (CSV: False) */
	CircleWhiteSolid: 1,
	/** @deprecated unused (CSV: False) */
	CircleWhiteTile: 2,
	/** @deprecated unused (CSV: False) */
	CircleGraySolid: 3,
	CircleCheck: 4,
	/** @deprecated unused (CSV: False) */
	SquareWhiteSolid: 5,
	/** @deprecated unused (CSV: False) */
	SquareWhiteTile: 6,
	/** @deprecated unused (CSV: False) */
	SquareGraySolid: 7,
	SquareCheck: 8,
	CircleGray: 124,
	SquareGray: 125,

	// AoE
	CircleAoE: 9,
	ConeAoE: 10,
	LineAoE: 11,
	Line: 12,
	Gaze: 13,
	Stack: 14,
	StackLine: 15,
	Proximity: 16,
	DonutAoE: 17,
	StackChain: 106,
	ProximityTarget: 107,
	Tankbuster: 108,
	KnockbackRadial: 109,
	KnockbackLine: 110,
	Block: 111,
	TargetMarker: 112,
	CircleAoEMoving: 126,
	Area1P: 127,
	Area2P: 128,
	Area3P: 129,
	Area4P: 130,

	// Job icons
	Gladiator: 18,
	Pugilist: 19,
	Marauder: 20,
	Lancer: 21,
	Archer: 22,
	Conjurer: 23,
	Thaumaturge: 24,
	Arcanist: 25,
	Rogue: 26,
	Paladin: 27,
	Monk: 28,
	Warrior: 29,
	Dragoon: 30,
	Bard: 31,
	WhiteMage: 32,
	BlackMage: 33,
	Summoner: 34,
	Scholar: 35,
	Ninja: 36,
	Machinist: 37,
	DarkKnight: 38,
	Astrologian: 39,
	Samurai: 40,
	RedMage: 41,
	BlueMage: 42,
	Gunbreaker: 43,
	Dancer: 44,
	Reaper: 45,
	Sage: 46,
	Viper: 101,
	Pictomancer: 102,

	// Role icons
	Tank: 47,
	Tank1: 48,
	Tank2: 49,
	Healer: 50,
	Healer1: 51,
	Healer2: 52,
	DPS: 53,
	DPS1: 54,
	DPS2: 55,
	DPS3: 56,
	DPS4: 57,
	MeleeDPS: 118,
	RangedDPS: 119,
	PhysicalRangedDPS: 120,
	MagicalRangedDPS: 121,
	PureHealer: 122,
	BarrierHealer: 123,

	// Enemy
	EnemySmall: 60,
	EnemyMedium: 62,
	EnemyLarge: 64,

	// Attack markers
	Attack1: 65,
	Attack2: 66,
	Attack3: 67,
	Attack4: 68,
	Attack5: 69,
	Attack6: 115,
	Attack7: 116,
	Attack8: 117,

	// Bind markers
	Bind1: 70,
	Bind2: 71,
	Bind3: 72,

	// Ignore markers
	Ignore1: 73,
	Ignore2: 74,

	// Generic markers
	Square: 75,
	Circle: 76,
	Plus: 77,
	Triangle: 78,

	// Waymarks
	WaymarkA: 79,
	WaymarkB: 80,
	WaymarkC: 81,
	WaymarkD: 82,
	Waymark1: 83,
	Waymark2: 84,
	Waymark3: 85,
	Waymark4: 86,

	// Buff/Debuff
	Buff: 113,
	Debuff: 114,

	// Lock-on markers
	LockOnRed: 131,
	LockOnBlue: 132,
	LockOnPurple: 133,
	LockOnGreen: 134,

	// Shapes
	ShapeCircle: 87,
	ShapeCross: 88,
	ShapeTriangle: 89,
	ShapeSquare: 90,
	ShapeArrow: 94,
	ShapeRotation: 103,
	EmphasisCircle: 135,
	EmphasisCross: 136,
	EmphasisSquare: 137,
	EmphasisTriangle: 138,
	Clockwise: 139,
	CounterClockwise: 140,

	// Other
	Text: 100,
	Group: 105,
} as const;

/**
 * Object flip flags (CSV column 19=horizontal flip, column 20=vertical flip)
 * Used for controlling flip option visibility in property panel
 */
export const OBJECT_FLIP_FLAGS: Record<
	number,
	{ horizontal: boolean; vertical: boolean }
> = {
	// Field
	4: { horizontal: false, vertical: false },
	8: { horizontal: false, vertical: false },
	124: { horizontal: false, vertical: false },
	125: { horizontal: false, vertical: false },

	// AoE
	9: { horizontal: false, vertical: false },
	10: { horizontal: true, vertical: true },
	11: { horizontal: false, vertical: false },
	12: { horizontal: false, vertical: false },
	13: { horizontal: false, vertical: false },
	14: { horizontal: false, vertical: false },
	15: { horizontal: false, vertical: true },
	16: { horizontal: false, vertical: false },
	17: { horizontal: true, vertical: true },
	106: { horizontal: false, vertical: false },
	107: { horizontal: false, vertical: true },
	108: { horizontal: false, vertical: false },
	109: { horizontal: false, vertical: false },
	110: { horizontal: false, vertical: true },
	111: { horizontal: false, vertical: false },
	112: { horizontal: false, vertical: false },
	126: { horizontal: false, vertical: true },
	127: { horizontal: false, vertical: false },
	128: { horizontal: false, vertical: false },
	129: { horizontal: false, vertical: false },
	130: { horizontal: false, vertical: false },

	// Enemy
	60: { horizontal: false, vertical: true },
	62: { horizontal: false, vertical: true },
	64: { horizontal: false, vertical: true },

	// Buff/Debuff
	113: { horizontal: true, vertical: true },
	114: { horizontal: true, vertical: true },

	// Shapes
	87: { horizontal: false, vertical: false },
	88: { horizontal: false, vertical: false },
	89: { horizontal: false, vertical: true },
	90: { horizontal: false, vertical: false },
	94: { horizontal: false, vertical: true },
	103: { horizontal: true, vertical: true },
	135: { horizontal: false, vertical: false },
	136: { horizontal: false, vertical: false },
	137: { horizontal: false, vertical: false },
	138: { horizontal: false, vertical: false },
	139: { horizontal: false, vertical: false },
	140: { horizontal: false, vertical: false },
};

/** Default flip flags (for undefined objects) */
export const DEFAULT_FLIP_FLAGS = { horizontal: false, vertical: false };

/**
 * Unused object ID list (CSV column 2 is False)
 * Used to hide objects in palette and editor UI
 */
export const DISABLED_OBJECT_IDS: readonly number[] = [
	// Field (unused)
	ObjectIds.CircleWhiteSolid,
	ObjectIds.CircleWhiteTile,
	ObjectIds.CircleGraySolid,
	ObjectIds.SquareWhiteSolid,
	ObjectIds.SquareWhiteTile,
	ObjectIds.SquareGraySolid,
	// Role (unused)
	58,
	59,
	// Enemy (unused)
	61,
	63,
	// Shapes (unused)
	91,
	92,
	93,
	95,
	96,
	97,
	98,
	99,
	104,
] as const;

/**
 * Edit parameter IDs (TofuEditParam.ja.csv)
 */
export const EditParamIds = {
	None: 0,
	Size: 1,
	Rotation: 2,
	Opacity: 3,
	Height: 4,
	Width: 5,
	ConeAngle: 6,
	DonutRange: 7,
	DisplayCount: 8,
	HeightCount: 9,
	WidthCount: 10,
	LineWidth: 11,
	SizeSmall: 12,
} as const;

/**
 * Edit parameter definition (from TofuEditParam.ja.csv)
 */
export interface EditParamDefinition {
	/** Parameter name (i18n key) */
	name: string;
	defaultValue: number;
	min: number;
	max: number;
	useSlider: boolean;
}

export const EDIT_PARAMS: Record<number, EditParamDefinition> = {
	[EditParamIds.Size]: {
		name: "サイズ",
		defaultValue: 100,
		min: 50,
		max: 200,
		useSlider: true,
	},
	[EditParamIds.Rotation]: {
		name: "角度",
		defaultValue: 0,
		min: -180,
		max: 180,
		useSlider: true,
	},
	[EditParamIds.Opacity]: {
		name: "透過度",
		defaultValue: 0,
		min: 0,
		max: 100,
		useSlider: true,
	},
	[EditParamIds.Height]: {
		name: "縦幅",
		defaultValue: 128,
		min: 16,
		max: 384,
		useSlider: true,
	},
	[EditParamIds.Width]: {
		name: "横幅",
		defaultValue: 128,
		min: 16,
		max: 512,
		useSlider: true,
	},
	[EditParamIds.ConeAngle]: {
		name: "範囲角度",
		defaultValue: 90,
		min: 10,
		max: 360,
		useSlider: true,
	},
	[EditParamIds.DonutRange]: {
		name: "ドーナツ範囲",
		defaultValue: 50,
		min: 0,
		max: 240,
		useSlider: true,
	},
	[EditParamIds.DisplayCount]: {
		name: "表示数",
		defaultValue: 1,
		min: 1,
		max: 5,
		useSlider: true,
	},
	[EditParamIds.HeightCount]: {
		name: "縦幅数",
		defaultValue: 1,
		min: 1,
		max: 5,
		useSlider: true,
	},
	[EditParamIds.WidthCount]: {
		name: "横幅数",
		defaultValue: 1,
		min: 1,
		max: 5,
		useSlider: true,
	},
	[EditParamIds.LineWidth]: {
		name: "線幅",
		defaultValue: 6,
		min: 2,
		max: 10,
		useSlider: true,
	},
	[EditParamIds.SizeSmall]: {
		name: "サイズ",
		defaultValue: 50,
		min: 10,
		max: 200,
		useSlider: true,
	},
};

/**
 * Editable parameter slots per object (TofuObject.ja.csv columns 10-14)
 * Specify EditParamIds in order [param1, param2, param3, param4, param5]
 */
export const OBJECT_EDIT_PARAMS: Record<number, readonly number[]> = {
	// Field
	[ObjectIds.CircleCheck]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.SquareCheck]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.CircleGray]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.SquareGray]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],

	// AoE
	[ObjectIds.CircleAoE]: [
		EditParamIds.SizeSmall,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.ConeAoE]: [
		EditParamIds.SizeSmall,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
		EditParamIds.ConeAngle,
	],
	[ObjectIds.LineAoE]: [
		EditParamIds.Height,
		EditParamIds.Width,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.Line]: [
		EditParamIds.Rotation,
		EditParamIds.Opacity,
		EditParamIds.LineWidth,
	],
	[ObjectIds.Gaze]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.Stack]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.StackLine]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
		EditParamIds.DisplayCount,
	],
	[ObjectIds.Proximity]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.DonutAoE]: [
		EditParamIds.SizeSmall,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
		EditParamIds.ConeAngle,
		EditParamIds.DonutRange,
	],
	[ObjectIds.StackChain]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.ProximityTarget]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.Tankbuster]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.KnockbackRadial]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.KnockbackLine]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
		EditParamIds.HeightCount,
		EditParamIds.WidthCount,
	],
	[ObjectIds.Block]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.TargetMarker]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.CircleAoEMoving]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.Area1P]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.Area2P]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.Area3P]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],
	[ObjectIds.Area4P]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	],

	// Job/Role/Enemy/Markers etc. use DEFAULT_EDIT_PARAMS
};

/** Default edit parameters (for most objects: Size, Rotation, Opacity) */
export const DEFAULT_EDIT_PARAMS: readonly number[] = [
	EditParamIds.Size,
	EditParamIds.Rotation,
	EditParamIds.Opacity,
];

/**
 * Object placement limits (from CSV column 22)
 * -1: no limit, 0: for text, other: max placement count
 */
export const OBJECT_LIMITS: Partial<Record<number, number>> = {
	[ObjectIds.LineAoE]: 10,
	[ObjectIds.Line]: 10,
};

/** Maximum total objects on a board */
export const MAX_TOTAL_OBJECTS = 50;
