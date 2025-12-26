/**
 * オブジェクトカテゴリ定義
 */

import { ObjectIds } from "@/lib/stgy";

/** 非表示オブジェクト（CSVでFalse） - デバッグモード時のみ表示 */
export const HIDDEN_OBJECT_IDS: number[] = [
	// フィールド（非表示）
	ObjectIds.CircleWhiteSolid, // 1: 円形白無地フィールド
	ObjectIds.CircleWhiteTile, // 2: 円形白タイルフィールド
	ObjectIds.CircleGraySolid, // 3: 円形グレー無地フィールド
	ObjectIds.SquareWhiteSolid, // 5: 四角形白無地フィールド
	ObjectIds.SquareWhiteTile, // 6: 四角形白タイルフィールド
	ObjectIds.SquareGraySolid, // 7: 四角形グレー無地フィールド
	// ロール（非表示）
	58, // DPS5
	59, // DPS6
	// エネミー（非表示）
	61, // エネミー小2
	63, // エネミー中2
	// 図形（非表示）
	104, // 図形：矢印右回り
	// グループ
	ObjectIds.Group, // 105: グループ
];

/** オブジェクトカテゴリ（CSVの表示順序に準拠）
 * TofuObjectCategory.ja.csv カラム1でソート:
 * 1. クラス/ジョブ (カテゴリ2, カラム1: 1)
 * 2. 攻撃範囲 (カテゴリ6, カラム1: 2)
 * 3. アイコン/マーカー (カテゴリ3, カラム1: 3)
 * 4. 図形/記号 (カテゴリ4, カラム1: 4)
 * 5. フィールド (カテゴリ1, カラム1: 5)
 *
 * 各カテゴリ内はTofuObject.ja.csv カラム4でソート
 */
export const OBJECT_CATEGORIES: Record<string, number[]> = {
	// カテゴリ2: クラス/ジョブ (カラム1: 1) - カラム3（ソート順）でソート
	jobs: [
		// ロールアイコン (ソート順 1-17)
		ObjectIds.Tank, // 1
		ObjectIds.Tank1, // 2
		ObjectIds.Tank2, // 3
		ObjectIds.Healer, // 4
		ObjectIds.Healer1, // 5
		ObjectIds.Healer2, // 6
		ObjectIds.PureHealer, // 7
		ObjectIds.BarrierHealer, // 8
		ObjectIds.DPS, // 9
		ObjectIds.DPS1, // 10
		ObjectIds.DPS2, // 11
		ObjectIds.DPS3, // 12
		ObjectIds.DPS4, // 13
		ObjectIds.MeleeDPS, // 14
		ObjectIds.RangedDPS, // 15
		ObjectIds.PhysicalRangedDPS, // 16
		ObjectIds.MagicalRangedDPS, // 17
		// タンクジョブ (ソート順 20-23)
		ObjectIds.Paladin, // 20
		ObjectIds.Warrior, // 21
		ObjectIds.DarkKnight, // 22
		ObjectIds.Gunbreaker, // 23
		// ヒーラージョブ (ソート順 30-33)
		ObjectIds.WhiteMage, // 30
		ObjectIds.Scholar, // 31
		ObjectIds.Astrologian, // 32
		ObjectIds.Sage, // 33
		// 近接DPSジョブ (ソート順 40-45)
		ObjectIds.Monk, // 40
		ObjectIds.Dragoon, // 41
		ObjectIds.Ninja, // 42
		ObjectIds.Samurai, // 43
		ObjectIds.Reaper, // 44
		ObjectIds.Viper, // 45
		// 遠隔物理DPSジョブ (ソート順 50-52)
		ObjectIds.Bard, // 50
		ObjectIds.Machinist, // 51
		ObjectIds.Dancer, // 52
		// 遠隔魔法DPSジョブ (ソート順 60-63)
		ObjectIds.BlackMage, // 60
		ObjectIds.Summoner, // 61
		ObjectIds.RedMage, // 62
		ObjectIds.Pictomancer, // 63
		// 青魔道士 (ソート順 70)
		ObjectIds.BlueMage, // 70
		// 基本クラス (ソート順 200-208)
		ObjectIds.Gladiator, // 200
		ObjectIds.Marauder, // 201
		ObjectIds.Conjurer, // 202
		ObjectIds.Pugilist, // 203
		ObjectIds.Lancer, // 204
		ObjectIds.Rogue, // 205
		ObjectIds.Archer, // 206
		ObjectIds.Thaumaturge, // 207
		ObjectIds.Arcanist, // 208
	],
	// カテゴリ6: 攻撃範囲 (カラム1: 2) - カラム4でソート
	attacks: [
		ObjectIds.CircleAoE, // 101
		ObjectIds.ConeAoE, // 102
		ObjectIds.LineAoE, // 103
		ObjectIds.Gaze, // 105
		ObjectIds.Stack, // 106
		ObjectIds.StackLine, // 107
		ObjectIds.Proximity, // 108
		ObjectIds.DonutAoE, // 109
		ObjectIds.StackChain, // 110
		ObjectIds.ProximityTarget, // 111
		ObjectIds.Tankbuster, // 112
		ObjectIds.KnockbackRadial, // 113
		ObjectIds.KnockbackLine, // 114
		ObjectIds.Block, // 115
		ObjectIds.TargetMarker, // 116
		ObjectIds.CircleAoEMoving, // 117
		ObjectIds.Area1P, // 118
		ObjectIds.Area2P, // 119
		ObjectIds.Area3P, // 120
		ObjectIds.Area4P, // 121
	],
	// カテゴリ3: アイコン/マーカー (カラム1: 3)
	markers: [
		// エネミー
		ObjectIds.EnemySmall,
		ObjectIds.EnemyMedium,
		ObjectIds.EnemyLarge,
		// バフ/デバフ
		ObjectIds.Buff,
		ObjectIds.Debuff,
		// 攻撃マーカー
		ObjectIds.Attack1,
		ObjectIds.Attack2,
		ObjectIds.Attack3,
		ObjectIds.Attack4,
		ObjectIds.Attack5,
		ObjectIds.Attack6,
		ObjectIds.Attack7,
		ObjectIds.Attack8,
		// 足止め/禁止
		ObjectIds.Bind1,
		ObjectIds.Bind2,
		ObjectIds.Bind3,
		ObjectIds.Ignore1,
		ObjectIds.Ignore2,
		// 汎用マーカー
		ObjectIds.Square,
		ObjectIds.Circle,
		ObjectIds.Plus,
		ObjectIds.Triangle,
		// フィールドマーカー
		ObjectIds.WaymarkA,
		ObjectIds.WaymarkB,
		ObjectIds.WaymarkC,
		ObjectIds.WaymarkD,
		ObjectIds.Waymark1,
		ObjectIds.Waymark2,
		ObjectIds.Waymark3,
		ObjectIds.Waymark4,
		// ロックオンマーカー
		ObjectIds.LockOnRed,
		ObjectIds.LockOnBlue,
		ObjectIds.LockOnPurple,
		ObjectIds.LockOnGreen,
	],
	// カテゴリ4: 図形/記号 (カラム1: 4)
	shapes: [
		ObjectIds.Text,
		ObjectIds.ShapeCircle,
		ObjectIds.ShapeCross,
		ObjectIds.ShapeTriangle,
		ObjectIds.ShapeSquare,
		ObjectIds.ShapeArrow,
		ObjectIds.ShapeRotation,
		ObjectIds.EmphasisCircle,
		ObjectIds.EmphasisCross,
		ObjectIds.EmphasisSquare,
		ObjectIds.EmphasisTriangle,
		ObjectIds.Clockwise,
		ObjectIds.CounterClockwise,
		ObjectIds.Line,
	],
	// カテゴリ1: フィールド (カラム1: 5)
	fields: [
		// 注意: CircleWhiteSolid, CircleWhiteTile, CircleGraySolid,
		// SquareWhiteSolid, SquareWhiteTile, SquareGraySolid は未使用 (CSV: False)
		ObjectIds.CircleCheck,
		ObjectIds.SquareCheck,
		ObjectIds.CircleGray,
		ObjectIds.SquareGray,
	],
};
