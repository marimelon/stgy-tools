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
  /** ロック状態 (true = 非ロック) */
  unlocked: boolean;
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
}

/**
 * オブジェクトID定数
 */
/** オブジェクト名マップ */
export const ObjectNames: Record<number, string> = {
  // フィールド
  1: "円形白無地フィールド",
  2: "円形白タイルフィールド",
  3: "円形グレー無地フィールド",
  4: "円形チェック",
  5: "四角形白無地フィールド",
  6: "四角形白タイルフィールド",
  7: "四角形グレー無地フィールド",
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
  CircleWhiteSolid: 1,
  CircleWhiteTile: 2,
  CircleGraySolid: 3,
  CircleCheck: 4,
  SquareWhiteSolid: 5,
  SquareWhiteTile: 6,
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
