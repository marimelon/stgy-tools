/**
 * stgy ボードデータの型定義
 */

/**
 * RGBA色情報
 */
export interface Color {
	r: number;
	g: number;
	b: number;
	/** 透過度 0-100 */
	opacity: number;
}

/**
 * 座標 (1/10ピクセル単位で格納、表示時はピクセルに変換)
 */
export interface Position {
	x: number;
	y: number;
}

/**
 * オブジェクトの状態フラグ
 */
export interface ObjectFlags {
	/** 表示状態 */
	visible: boolean;
	/** 左右反転 */
	flipHorizontal: boolean;
	/** 上下反転 */
	flipVertical: boolean;
	/** ロック状態 */
	locked: boolean;
}

/**
 * ボード上のオブジェクト
 */
export interface BoardObject {
	/** オブジェクトID (オブジェクト種別を示す) */
	objectId: number;
	/** テキスト内容 (テキストオブジェクトの場合) */
	text?: string;
	/** 状態フラグ */
	flags: ObjectFlags;
	/** 座標 (ピクセル単位) */
	position: Position;
	/** 回転角度 (-180〜180度) */
	rotation: number;
	/** サイズ (50〜200, 100=100%) */
	size: number;
	/** 色・透過度 */
	color: Color;
	/** 固有パラメータ1 (扇範囲攻撃の範囲角度など) */
	param1?: number;
	/** 固有パラメータ2 (輪形範囲攻撃のドーナツ範囲など) */
	param2?: number;
	/** 固有パラメータ3 */
	param3?: number;
}

/**
 * 背景ID
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
 * ボードデータ
 */
export interface BoardData {
	/** バージョン (= 2) */
	version: number;
	/** ボード幅 */
	width: number;
	/** ボード高さ */
	height: number;
	/** ボード名 */
	name: string;
	/** 背景ID */
	backgroundId: BackgroundId;
	/** オブジェクトリスト */
	objects: BoardObject[];
	/** サイズ配列後のパディングバイト (ラウンドトリップ用、内部使用) */
	_sizePaddingByte?: number;
}

/**
 * オブジェクトID定数
 */
/** オブジェクト名マップ */
export const ObjectNames: Record<number, string> = {
	// フィールド
	1: "円形白無地フィールド", // 未使用 (CSV: False)
	2: "円形白タイルフィールド", // 未使用 (CSV: False)
	3: "円形グレー無地フィールド", // 未使用 (CSV: False)
	4: "円形チェック",
	5: "四角形白無地フィールド", // 未使用 (CSV: False)
	6: "四角形白タイルフィールド", // 未使用 (CSV: False)
	7: "四角形グレー無地フィールド", // 未使用 (CSV: False)
	8: "正方形チェック",
	124: "円形グレー",
	125: "正方形グレー",

	// 攻撃範囲
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

	// ジョブアイコン
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

	// ロールアイコン
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

	// エネミー
	60: "エネミー小",
	62: "エネミー中",
	64: "エネミー大",

	// 攻撃マーカー
	65: "攻撃1",
	66: "攻撃2",
	67: "攻撃3",
	68: "攻撃4",
	69: "攻撃5",
	115: "攻撃6",
	116: "攻撃7",
	117: "攻撃8",

	// 足止めマーカー
	70: "足止め1",
	71: "足止め2",
	72: "足止め3",

	// 禁止マーカー
	73: "禁止1",
	74: "禁止2",

	// 汎用マーカー
	75: "シカク",
	76: "マル",
	77: "プラス",
	78: "サンカク",

	// フィールドマーカー
	79: "フィールドマーカーA",
	80: "フィールドマーカーB",
	81: "フィールドマーカーC",
	82: "フィールドマーカーD",
	83: "フィールドマーカー1",
	84: "フィールドマーカー2",
	85: "フィールドマーカー3",
	86: "フィールドマーカー4",

	// バフ/デバフ
	113: "バフ効果",
	114: "デバフ効果",

	// ロックオンマーカー
	131: "ロックオン赤",
	132: "ロックオン青",
	133: "ロックオン紫",
	134: "ロックオン緑",

	// 図形
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

	// その他
	100: "テキスト",
	105: "グループ",
};

export const ObjectIds = {
	// フィールド
	/** @deprecated 未使用 (CSV: False) */
	CircleWhiteSolid: 1,
	/** @deprecated 未使用 (CSV: False) */
	CircleWhiteTile: 2,
	/** @deprecated 未使用 (CSV: False) */
	CircleGraySolid: 3,
	CircleCheck: 4,
	/** @deprecated 未使用 (CSV: False) */
	SquareWhiteSolid: 5,
	/** @deprecated 未使用 (CSV: False) */
	SquareWhiteTile: 6,
	/** @deprecated 未使用 (CSV: False) */
	SquareGraySolid: 7,
	SquareCheck: 8,
	CircleGray: 124,
	SquareGray: 125,

	// 攻撃範囲
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

	// ジョブアイコン
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

	// ロールアイコン
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

	// エネミー
	EnemySmall: 60,
	EnemyMedium: 62,
	EnemyLarge: 64,

	// 攻撃マーカー
	Attack1: 65,
	Attack2: 66,
	Attack3: 67,
	Attack4: 68,
	Attack5: 69,
	Attack6: 115,
	Attack7: 116,
	Attack8: 117,

	// 足止めマーカー
	Bind1: 70,
	Bind2: 71,
	Bind3: 72,

	// 禁止マーカー
	Ignore1: 73,
	Ignore2: 74,

	// 汎用マーカー
	Square: 75,
	Circle: 76,
	Plus: 77,
	Triangle: 78,

	// フィールドマーカー
	WaymarkA: 79,
	WaymarkB: 80,
	WaymarkC: 81,
	WaymarkD: 82,
	Waymark1: 83,
	Waymark2: 84,
	Waymark3: 85,
	Waymark4: 86,

	// バフ/デバフ
	Buff: 113,
	Debuff: 114,

	// ロックオンマーカー
	LockOnRed: 131,
	LockOnBlue: 132,
	LockOnPurple: 133,
	LockOnGreen: 134,

	// 図形
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

	// その他
	Text: 100,
	Group: 105,
} as const;

/**
 * オブジェクトの反転可能フラグ (CSV カラム19=左右反転, カラム20=上下反転)
 * プロパティパネルで反転オプションの表示制御に使用
 */
export const OBJECT_FLIP_FLAGS: Record<
	number,
	{ horizontal: boolean; vertical: boolean }
> = {
	// フィールド
	4: { horizontal: false, vertical: false }, // 円形チェック
	8: { horizontal: false, vertical: false }, // 正方形チェック
	124: { horizontal: false, vertical: false }, // 円形グレー
	125: { horizontal: false, vertical: false }, // 正方形グレー

	// 攻撃範囲
	9: { horizontal: false, vertical: false }, // 円形範囲攻撃
	10: { horizontal: true, vertical: true }, // 扇範囲攻撃
	11: { horizontal: false, vertical: false }, // 直線範囲攻撃
	12: { horizontal: false, vertical: false }, // ライン
	13: { horizontal: false, vertical: false }, // 視線攻撃
	14: { horizontal: false, vertical: false }, // 頭割りダメージ攻撃
	15: { horizontal: false, vertical: true }, // 頭割りダメージ攻撃：直線型
	16: { horizontal: false, vertical: false }, // 距離減衰ダメージ攻撃
	17: { horizontal: true, vertical: true }, // 輪形範囲攻撃
	106: { horizontal: false, vertical: false }, // 頭割りダメージ攻撃：連続型
	107: { horizontal: false, vertical: true }, // 距離減衰ダメージ攻撃：対象発動型
	108: { horizontal: false, vertical: false }, // 強攻撃
	109: { horizontal: false, vertical: false }, // ノックバック攻撃：放射型
	110: { horizontal: false, vertical: true }, // ノックバック攻撃：直線型
	111: { horizontal: false, vertical: false }, // 受け止め攻撃
	112: { horizontal: false, vertical: false }, // ターゲット予兆
	126: { horizontal: false, vertical: true }, // 円形範囲攻撃：移動型
	127: { horizontal: false, vertical: false }, // 1人用エリア
	128: { horizontal: false, vertical: false }, // 2人用エリア
	129: { horizontal: false, vertical: false }, // 3人用エリア
	130: { horizontal: false, vertical: false }, // 4人用エリア

	// エネミー
	60: { horizontal: false, vertical: true }, // エネミー小
	62: { horizontal: false, vertical: true }, // エネミー中
	64: { horizontal: false, vertical: true }, // エネミー大

	// バフ/デバフ
	113: { horizontal: true, vertical: true }, // バフ効果
	114: { horizontal: true, vertical: true }, // デバフ効果

	// 図形
	87: { horizontal: false, vertical: false }, // 図形マル
	88: { horizontal: false, vertical: false }, // 図形バツ
	89: { horizontal: false, vertical: true }, // 図形サンカク
	90: { horizontal: false, vertical: false }, // 図形シカク
	94: { horizontal: false, vertical: true }, // 図形ヤジルシ
	103: { horizontal: true, vertical: true }, // 図形カイテン
	135: { horizontal: false, vertical: false }, // 強調マル
	136: { horizontal: false, vertical: false }, // 強調バツ
	137: { horizontal: false, vertical: false }, // 強調シカク
	138: { horizontal: false, vertical: false }, // 強調サンカク
	139: { horizontal: false, vertical: false }, // 時計回り
	140: { horizontal: false, vertical: false }, // 反時計回り
};

/** デフォルトの反転フラグ（未定義のオブジェクト用） */
export const DEFAULT_FLIP_FLAGS = { horizontal: false, vertical: false };

/**
 * 未使用オブジェクトID一覧 (CSV 2カラム目が False)
 * パレットやエディタUIで非表示にするために使用
 */
export const DISABLED_OBJECT_IDS: readonly number[] = [
	// フィールド (未使用)
	ObjectIds.CircleWhiteSolid, // 1
	ObjectIds.CircleWhiteTile, // 2
	ObjectIds.CircleGraySolid, // 3
	ObjectIds.SquareWhiteSolid, // 5
	ObjectIds.SquareWhiteTile, // 6
	ObjectIds.SquareGraySolid, // 7
	// ロール (未使用)
	58, // DPS5
	59, // DPS6
	// エネミー (未使用)
	61, // エネミー小2
	63, // エネミー中2
	// 図形 (未使用)
	91, // 未使用
	92, // 未使用
	93, // 未使用
	95, // 未使用
	96, // 未使用
	97, // 未使用
	98, // 未使用
	99, // 未使用
	104, // 図形：矢印右回り
] as const;

/**
 * 編集パラメータID (TofuEditParam.ja.csv)
 */
export const EditParamIds = {
	None: 0,
	Size: 1, // サイズ (100, 50-200)
	Rotation: 2, // 角度 (0, -180-180)
	Opacity: 3, // 透過度 (0, 0-100)
	Height: 4, // 縦幅 (128, 16-384)
	Width: 5, // 横幅 (128, 16-512)
	ConeAngle: 6, // 範囲角度 (90, 10-360)
	DonutRange: 7, // ドーナツ範囲 (50, 0-240)
	DisplayCount: 8, // 表示数 (1, 1-5)
	HeightCount: 9, // 縦幅数 (1, 1-5)
	WidthCount: 10, // 横幅数 (1, 1-5)
	LineWidth: 11, // 縦幅/線幅 (6, 2-10)
	SizeSmall: 12, // サイズ (50, 10-200) - 攻撃範囲用
} as const;

/**
 * 編集パラメータ定義 (TofuEditParam.ja.csv から)
 */
export interface EditParamDefinition {
	/** パラメータ名 */
	name: string;
	/** デフォルト値 */
	defaultValue: number;
	/** 最小値 */
	min: number;
	/** 最大値 */
	max: number;
	/** スライダー表示するか */
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
 * オブジェクトごとの編集可能パラメータスロット (TofuObject.ja.csv カラム10-14)
 * [param1, param2, param3, param4, param5] の順でEditParamIdsを指定
 */
export const OBJECT_EDIT_PARAMS: Record<number, readonly number[]> = {
	// フィールド (サイズ、角度、透過度)
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

	// 攻撃範囲
	[ObjectIds.CircleAoE]: [
		EditParamIds.SizeSmall,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 12,2,3
	[ObjectIds.ConeAoE]: [
		EditParamIds.SizeSmall,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
		EditParamIds.ConeAngle,
	], // 12,2,3,6
	[ObjectIds.LineAoE]: [
		EditParamIds.Height,
		EditParamIds.Width,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 4,5,2,3
	[ObjectIds.Line]: [
		EditParamIds.Rotation,
		EditParamIds.Opacity,
		EditParamIds.LineWidth,
	], // 2,3,11
	[ObjectIds.Gaze]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.Stack]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.StackLine]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
		EditParamIds.DisplayCount,
	], // 1,2,3,8
	[ObjectIds.Proximity]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.DonutAoE]: [
		EditParamIds.SizeSmall,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
		EditParamIds.ConeAngle,
		EditParamIds.DonutRange,
	], // 12,2,3,6,7
	[ObjectIds.StackChain]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.ProximityTarget]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.Tankbuster]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.KnockbackRadial]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.KnockbackLine]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
		EditParamIds.HeightCount,
		EditParamIds.WidthCount,
	], // 1,2,3,9,10
	[ObjectIds.Block]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.TargetMarker]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.CircleAoEMoving]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.Area1P]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.Area2P]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.Area3P]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3
	[ObjectIds.Area4P]: [
		EditParamIds.Size,
		EditParamIds.Rotation,
		EditParamIds.Opacity,
	], // 1,2,3

	// ジョブ・ロール・エネミー・マーカー等 (サイズ、角度、透過度)
	// 基本的に 1,2,3 なのでデフォルトとして扱う
};

/** デフォルトの編集パラメータ（ほとんどのオブジェクト用: サイズ、角度、透過度） */
export const DEFAULT_EDIT_PARAMS: readonly number[] = [
	EditParamIds.Size,
	EditParamIds.Rotation,
	EditParamIds.Opacity,
];

/**
 * オブジェクト配置数制限 (CSV カラム22から)
 * -1: 制限なし, 0: テキスト用, その他: 最大配置数
 */
export const OBJECT_LIMITS: Partial<Record<number, number>> = {
	[ObjectIds.LineAoE]: 10, // 直線範囲攻撃: 10個まで
	[ObjectIds.Line]: 10, // ライン: 10個まで
};

/** 全オブジェクトの最大配置数 */
export const MAX_TOTAL_OBJECTS = 50;
