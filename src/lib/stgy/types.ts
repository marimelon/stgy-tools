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
	1: "Circle White Solid", // unused (CSV: False)
	2: "Circle White Tile", // unused (CSV: False)
	3: "Circle Gray Solid", // unused (CSV: False)
	4: "Circle Checkered",
	5: "Square White Solid", // unused (CSV: False)
	6: "Square White Tile", // unused (CSV: False)
	7: "Square Gray Solid", // unused (CSV: False)
	8: "Square Checkered",
	124: "Circle Gray",
	125: "Square Gray",

	// AoE
	9: "Circle AoE",
	10: "Cone AoE",
	11: "Line AoE",
	12: "Line",
	13: "Gaze Attack",
	14: "Stack Marker",
	15: "Stack Marker: Line",
	16: "Proximity Marker",
	17: "Donut AoE",
	106: "Stack Marker: Sequential",
	107: "Proximity Marker: Targeted",
	108: "Tankbuster",
	109: "Knockback: Radial",
	110: "Knockback: Line",
	111: "Soak",
	112: "Target Indicator",
	126: "Circle AoE: Moving",
	127: "1-Player Area",
	128: "2-Player Area",
	129: "3-Player Area",
	130: "4-Player Area",

	// Job icons
	18: "Gladiator",
	19: "Pugilist",
	20: "Marauder",
	21: "Lancer",
	22: "Archer",
	23: "Conjurer",
	24: "Thaumaturge",
	25: "Arcanist",
	26: "Rogue",
	27: "Paladin",
	28: "Monk",
	29: "Warrior",
	30: "Dragoon",
	31: "Bard",
	32: "White Mage",
	33: "Black Mage",
	34: "Summoner",
	35: "Scholar",
	36: "Ninja",
	37: "Machinist",
	38: "Dark Knight",
	39: "Astrologian",
	40: "Samurai",
	41: "Red Mage",
	42: "Blue Mage",
	43: "Gunbreaker",
	44: "Dancer",
	45: "Reaper",
	46: "Sage",
	101: "Viper",
	102: "Pictomancer",

	// Role icons
	47: "Tank",
	48: "Tank 1",
	49: "Tank 2",
	50: "Healer",
	51: "Healer 1",
	52: "Healer 2",
	53: "DPS",
	54: "DPS 1",
	55: "DPS 2",
	56: "DPS 3",
	57: "DPS 4",
	118: "Melee DPS",
	119: "Ranged DPS",
	120: "Physical Ranged DPS",
	121: "Magical Ranged DPS",
	122: "Pure Healer",
	123: "Barrier Healer",

	// Enemy
	60: "Enemy Small",
	62: "Enemy Medium",
	64: "Enemy Large",

	// Attack markers
	65: "Attack 1",
	66: "Attack 2",
	67: "Attack 3",
	68: "Attack 4",
	69: "Attack 5",
	115: "Attack 6",
	116: "Attack 7",
	117: "Attack 8",

	// Bind markers
	70: "Bind 1",
	71: "Bind 2",
	72: "Bind 3",

	// Ignore markers
	73: "Ignore 1",
	74: "Ignore 2",

	// Generic markers
	75: "Square",
	76: "Circle",
	77: "Plus",
	78: "Triangle",

	// Waymarks
	79: "Waymark A",
	80: "Waymark B",
	81: "Waymark C",
	82: "Waymark D",
	83: "Waymark 1",
	84: "Waymark 2",
	85: "Waymark 3",
	86: "Waymark 4",

	// Buff/Debuff
	113: "Buff",
	114: "Debuff",

	// Lock-on markers
	131: "Lock-on Red",
	132: "Lock-on Blue",
	133: "Lock-on Purple",
	134: "Lock-on Green",

	// Shapes
	87: "Shape Circle",
	88: "Shape Cross",
	89: "Shape Triangle",
	90: "Shape Square",
	94: "Shape Arrow",
	103: "Shape Rotation",
	135: "Highlight Circle",
	136: "Highlight Cross",
	137: "Highlight Square",
	138: "Highlight Triangle",
	139: "Clockwise",
	140: "Counter-clockwise",

	// Other
	100: "Text",
	105: "Group",
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
		name: "Size",
		defaultValue: 100,
		min: 50,
		max: 200,
		useSlider: true,
	},
	[EditParamIds.Rotation]: {
		name: "Rotation",
		defaultValue: 0,
		min: -180,
		max: 180,
		useSlider: true,
	},
	[EditParamIds.Opacity]: {
		name: "Opacity",
		defaultValue: 0,
		min: 0,
		max: 100,
		useSlider: true,
	},
	[EditParamIds.Height]: {
		name: "Height",
		defaultValue: 128,
		min: 16,
		max: 384,
		useSlider: true,
	},
	[EditParamIds.Width]: {
		name: "Width",
		defaultValue: 128,
		min: 16,
		max: 512,
		useSlider: true,
	},
	[EditParamIds.ConeAngle]: {
		name: "Cone Angle",
		defaultValue: 90,
		min: 10,
		max: 360,
		useSlider: true,
	},
	[EditParamIds.DonutRange]: {
		name: "Donut Range",
		defaultValue: 50,
		min: 0,
		max: 240,
		useSlider: true,
	},
	[EditParamIds.DisplayCount]: {
		name: "Display Count",
		defaultValue: 1,
		min: 1,
		max: 5,
		useSlider: true,
	},
	[EditParamIds.HeightCount]: {
		name: "Height Count",
		defaultValue: 1,
		min: 1,
		max: 5,
		useSlider: true,
	},
	[EditParamIds.WidthCount]: {
		name: "Width Count",
		defaultValue: 1,
		min: 1,
		max: 5,
		useSlider: true,
	},
	[EditParamIds.LineWidth]: {
		name: "Line Width",
		defaultValue: 6,
		min: 2,
		max: 10,
		useSlider: true,
	},
	[EditParamIds.SizeSmall]: {
		name: "Size",
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
