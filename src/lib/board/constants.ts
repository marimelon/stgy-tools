/**
 * ボード関連の共通定数
 * サーバーサイド・クライアントサイド両方で使用
 */

import { ObjectIds } from "@/lib/stgy/types";

/** キャンバスサイズ */
export const CANVAS_WIDTH = 512;
export const CANVAS_HEIGHT = 384;

/** 背景サイズ定数 */
export const BACKGROUND_SIZES = {
	SQUARE_GRAY_BASE: 100,
	SQUARE_GRAY_MULTIPLIER: 3.5,
} as const;

/**
 * オブジェクトごとのバウンディングボックスサイズ定義
 * CSVの7,8カラム目（width, height）から取得
 * アイコンを差し替える際はここのサイズを変更してください
 */
export const OBJECT_BBOX_SIZES: Record<
	number,
	{ width: number; height: number }
> = {
	// ========================================
	// フィールド (256x256)
	// ========================================
	[ObjectIds.CircleWhiteSolid]: { width: 256, height: 256 },
	[ObjectIds.CircleWhiteTile]: { width: 256, height: 256 },
	[ObjectIds.CircleGraySolid]: { width: 256, height: 256 },
	[ObjectIds.CircleCheck]: { width: 256, height: 256 },
	[ObjectIds.SquareWhiteSolid]: { width: 256, height: 256 },
	[ObjectIds.SquareWhiteTile]: { width: 256, height: 256 },
	[ObjectIds.SquareGraySolid]: { width: 256, height: 256 },
	[ObjectIds.SquareCheck]: { width: 256, height: 256 },
	[ObjectIds.CircleGray]: { width: 256, height: 256 },
	[ObjectIds.SquareGray]: { width: 256, height: 256 },

	// ========================================
	// 攻撃範囲
	// ========================================
	[ObjectIds.CircleAoE]: { width: 512, height: 512 },
	// ConeAoE: 動的計算（角度による）- CSV: 512x512
	[ObjectIds.LineAoE]: { width: 128, height: 128 },
	[ObjectIds.Line]: { width: 256, height: 6 },
	[ObjectIds.Gaze]: { width: 128, height: 128 },
	[ObjectIds.Stack]: { width: 128, height: 128 },
	[ObjectIds.StackLine]: { width: 128, height: 128 },
	[ObjectIds.Proximity]: { width: 256, height: 256 },
	[ObjectIds.DonutAoE]: { width: 512, height: 512 },
	[ObjectIds.StackChain]: { width: 128, height: 128 },
	[ObjectIds.ProximityTarget]: { width: 128, height: 128 },
	[ObjectIds.Tankbuster]: { width: 64, height: 64 },
	[ObjectIds.KnockbackRadial]: { width: 256, height: 256 },
	[ObjectIds.KnockbackLine]: { width: 256, height: 256 },
	[ObjectIds.Block]: { width: 64, height: 64 },
	[ObjectIds.TargetMarker]: { width: 64, height: 64 },
	[ObjectIds.CircleAoEMoving]: { width: 128, height: 128 },
	[ObjectIds.Area1P]: { width: 64, height: 64 },
	[ObjectIds.Area2P]: { width: 64, height: 64 },
	[ObjectIds.Area3P]: { width: 64, height: 64 },
	[ObjectIds.Area4P]: { width: 64, height: 64 },

	// ========================================
	// ジョブアイコン (32x32)
	// ========================================
	[ObjectIds.Gladiator]: { width: 32, height: 32 },
	[ObjectIds.Pugilist]: { width: 32, height: 32 },
	[ObjectIds.Marauder]: { width: 32, height: 32 },
	[ObjectIds.Lancer]: { width: 32, height: 32 },
	[ObjectIds.Archer]: { width: 32, height: 32 },
	[ObjectIds.Conjurer]: { width: 32, height: 32 },
	[ObjectIds.Thaumaturge]: { width: 32, height: 32 },
	[ObjectIds.Arcanist]: { width: 32, height: 32 },
	[ObjectIds.Rogue]: { width: 32, height: 32 },
	[ObjectIds.Paladin]: { width: 32, height: 32 },
	[ObjectIds.Monk]: { width: 32, height: 32 },
	[ObjectIds.Warrior]: { width: 32, height: 32 },
	[ObjectIds.Dragoon]: { width: 32, height: 32 },
	[ObjectIds.Bard]: { width: 32, height: 32 },
	[ObjectIds.WhiteMage]: { width: 32, height: 32 },
	[ObjectIds.BlackMage]: { width: 32, height: 32 },
	[ObjectIds.Summoner]: { width: 32, height: 32 },
	[ObjectIds.Scholar]: { width: 32, height: 32 },
	[ObjectIds.Ninja]: { width: 32, height: 32 },
	[ObjectIds.Machinist]: { width: 32, height: 32 },
	[ObjectIds.DarkKnight]: { width: 32, height: 32 },
	[ObjectIds.Astrologian]: { width: 32, height: 32 },
	[ObjectIds.Samurai]: { width: 32, height: 32 },
	[ObjectIds.RedMage]: { width: 32, height: 32 },
	[ObjectIds.BlueMage]: { width: 32, height: 32 },
	[ObjectIds.Gunbreaker]: { width: 32, height: 32 },
	[ObjectIds.Dancer]: { width: 32, height: 32 },
	[ObjectIds.Reaper]: { width: 32, height: 32 },
	[ObjectIds.Sage]: { width: 32, height: 32 },
	[ObjectIds.Viper]: { width: 32, height: 32 },
	[ObjectIds.Pictomancer]: { width: 32, height: 32 },

	// ========================================
	// ロールアイコン (32x32)
	// ========================================
	[ObjectIds.Tank]: { width: 32, height: 32 },
	[ObjectIds.Tank1]: { width: 32, height: 32 },
	[ObjectIds.Tank2]: { width: 32, height: 32 },
	[ObjectIds.Healer]: { width: 32, height: 32 },
	[ObjectIds.Healer1]: { width: 32, height: 32 },
	[ObjectIds.Healer2]: { width: 32, height: 32 },
	[ObjectIds.DPS]: { width: 32, height: 32 },
	[ObjectIds.DPS1]: { width: 32, height: 32 },
	[ObjectIds.DPS2]: { width: 32, height: 32 },
	[ObjectIds.DPS3]: { width: 32, height: 32 },
	[ObjectIds.DPS4]: { width: 32, height: 32 },
	[ObjectIds.MeleeDPS]: { width: 32, height: 32 },
	[ObjectIds.RangedDPS]: { width: 32, height: 32 },
	[ObjectIds.PhysicalRangedDPS]: { width: 32, height: 32 },
	[ObjectIds.MagicalRangedDPS]: { width: 32, height: 32 },
	[ObjectIds.PureHealer]: { width: 32, height: 32 },
	[ObjectIds.BarrierHealer]: { width: 32, height: 32 },

	// ========================================
	// エネミー (64x64)
	// ========================================
	[ObjectIds.EnemySmall]: { width: 64, height: 64 },
	[ObjectIds.EnemyMedium]: { width: 64, height: 64 },
	[ObjectIds.EnemyLarge]: { width: 64, height: 64 },

	// ========================================
	// マーカー (32x32)
	// ========================================
	// 攻撃マーカー
	[ObjectIds.Attack1]: { width: 32, height: 32 },
	[ObjectIds.Attack2]: { width: 32, height: 32 },
	[ObjectIds.Attack3]: { width: 32, height: 32 },
	[ObjectIds.Attack4]: { width: 32, height: 32 },
	[ObjectIds.Attack5]: { width: 32, height: 32 },
	[ObjectIds.Attack6]: { width: 32, height: 32 },
	[ObjectIds.Attack7]: { width: 32, height: 32 },
	[ObjectIds.Attack8]: { width: 32, height: 32 },
	// 足止めマーカー
	[ObjectIds.Bind1]: { width: 32, height: 32 },
	[ObjectIds.Bind2]: { width: 32, height: 32 },
	[ObjectIds.Bind3]: { width: 32, height: 32 },
	// 禁止マーカー
	[ObjectIds.Ignore1]: { width: 32, height: 32 },
	[ObjectIds.Ignore2]: { width: 32, height: 32 },
	// 汎用マーカー
	[ObjectIds.Square]: { width: 32, height: 32 },
	[ObjectIds.Circle]: { width: 32, height: 32 },
	[ObjectIds.Plus]: { width: 32, height: 32 },
	[ObjectIds.Triangle]: { width: 32, height: 32 },

	// ========================================
	// ウェイマーク (48x48)
	// ========================================
	[ObjectIds.WaymarkA]: { width: 48, height: 48 },
	[ObjectIds.WaymarkB]: { width: 48, height: 48 },
	[ObjectIds.WaymarkC]: { width: 48, height: 48 },
	[ObjectIds.WaymarkD]: { width: 48, height: 48 },
	[ObjectIds.Waymark1]: { width: 48, height: 48 },
	[ObjectIds.Waymark2]: { width: 48, height: 48 },
	[ObjectIds.Waymark3]: { width: 48, height: 48 },
	[ObjectIds.Waymark4]: { width: 48, height: 48 },

	// ========================================
	// バフ/デバフ (32x32)
	// ========================================
	[ObjectIds.Buff]: { width: 32, height: 32 },
	[ObjectIds.Debuff]: { width: 32, height: 32 },

	// ========================================
	// ロックオンマーカー (48x48)
	// ========================================
	[ObjectIds.LockOnRed]: { width: 48, height: 48 },
	[ObjectIds.LockOnBlue]: { width: 48, height: 48 },
	[ObjectIds.LockOnPurple]: { width: 48, height: 48 },
	[ObjectIds.LockOnGreen]: { width: 48, height: 48 },

	// ========================================
	// 図形 (48x48)
	// ========================================
	[ObjectIds.ShapeCircle]: { width: 48, height: 48 },
	[ObjectIds.ShapeCross]: { width: 48, height: 48 },
	[ObjectIds.ShapeTriangle]: { width: 48, height: 48 },
	[ObjectIds.ShapeSquare]: { width: 48, height: 48 },
	[ObjectIds.ShapeArrow]: { width: 48, height: 48 },
	[ObjectIds.ShapeRotation]: { width: 48, height: 48 },
	[ObjectIds.EmphasisCircle]: { width: 48, height: 48 },
	[ObjectIds.EmphasisCross]: { width: 48, height: 48 },
	[ObjectIds.EmphasisSquare]: { width: 48, height: 48 },
	[ObjectIds.EmphasisTriangle]: { width: 48, height: 48 },
	[ObjectIds.Clockwise]: { width: 48, height: 48 },
	[ObjectIds.CounterClockwise]: { width: 48, height: 48 },

	// ========================================
	// テキスト / グループ
	// ========================================
	[ObjectIds.Text]: { width: 0, height: 0 },
	[ObjectIds.Group]: { width: 32, height: 32 },
};

/** デフォルトサイズ */
export const DEFAULT_BBOX_SIZE = { width: 32, height: 32 };

