/**
 * Object category definitions
 */

import { ObjectIds } from "@/lib/stgy";

/** Hidden objects (False in CSV) - only shown in debug mode */
export const HIDDEN_OBJECT_IDS: number[] = [
	// Fields (hidden)
	ObjectIds.CircleWhiteSolid, // 1: Circle white solid field
	ObjectIds.CircleWhiteTile, // 2: Circle white tile field
	ObjectIds.CircleGraySolid, // 3: Circle gray solid field
	ObjectIds.SquareWhiteSolid, // 5: Square white solid field
	ObjectIds.SquareWhiteTile, // 6: Square white tile field
	ObjectIds.SquareGraySolid, // 7: Square gray solid field
	// Roles (hidden)
	58, // DPS5
	59, // DPS6
	// Enemies (hidden)
	61, // Enemy small 2
	63, // Enemy medium 2
	// Shapes (hidden)
	104, // Shape: arrow clockwise
	// Group
	ObjectIds.Group, // 105: Group
];

/** Object categories (following CSV display order)
 * Sorted by TofuObjectCategory.ja.csv column 1:
 * 1. Class/Job (Category 2, column 1: 1)
 * 2. Attack range (Category 6, column 1: 2)
 * 3. Icon/Marker (Category 3, column 1: 3)
 * 4. Shape/Symbol (Category 4, column 1: 4)
 * 5. Field (Category 1, column 1: 5)
 *
 * Within each category, sorted by TofuObject.ja.csv column 4
 */
export const OBJECT_CATEGORIES: Record<string, number[]> = {
	// Category 2: Class/Job (column 1: 1) - sorted by column 3 (sort order)
	jobs: [
		// Role icons (sort order 1-17)
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
		// Tank jobs (sort order 20-23)
		ObjectIds.Paladin, // 20
		ObjectIds.Warrior, // 21
		ObjectIds.DarkKnight, // 22
		ObjectIds.Gunbreaker, // 23
		// Healer jobs (sort order 30-33)
		ObjectIds.WhiteMage, // 30
		ObjectIds.Scholar, // 31
		ObjectIds.Astrologian, // 32
		ObjectIds.Sage, // 33
		// Melee DPS jobs (sort order 40-45)
		ObjectIds.Monk, // 40
		ObjectIds.Dragoon, // 41
		ObjectIds.Ninja, // 42
		ObjectIds.Samurai, // 43
		ObjectIds.Reaper, // 44
		ObjectIds.Viper, // 45
		// Physical ranged DPS jobs (sort order 50-52)
		ObjectIds.Bard, // 50
		ObjectIds.Machinist, // 51
		ObjectIds.Dancer, // 52
		// Magical ranged DPS jobs (sort order 60-63)
		ObjectIds.BlackMage, // 60
		ObjectIds.Summoner, // 61
		ObjectIds.RedMage, // 62
		ObjectIds.Pictomancer, // 63
		// Blue Mage (sort order 70)
		ObjectIds.BlueMage, // 70
		// Base classes (sort order 200-208)
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
	// Category 6: Attack range (column 1: 2) - sorted by column 4
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
	// Category 3: Icon/Marker (column 1: 3)
	markers: [
		// Enemies
		ObjectIds.EnemySmall,
		ObjectIds.EnemyMedium,
		ObjectIds.EnemyLarge,
		// Buff/Debuff
		ObjectIds.Buff,
		ObjectIds.Debuff,
		// Attack markers
		ObjectIds.Attack1,
		ObjectIds.Attack2,
		ObjectIds.Attack3,
		ObjectIds.Attack4,
		ObjectIds.Attack5,
		ObjectIds.Attack6,
		ObjectIds.Attack7,
		ObjectIds.Attack8,
		// Bind/Ignore
		ObjectIds.Bind1,
		ObjectIds.Bind2,
		ObjectIds.Bind3,
		ObjectIds.Ignore1,
		ObjectIds.Ignore2,
		// Generic markers
		ObjectIds.Square,
		ObjectIds.Circle,
		ObjectIds.Plus,
		ObjectIds.Triangle,
		// Field markers
		ObjectIds.WaymarkA,
		ObjectIds.WaymarkB,
		ObjectIds.WaymarkC,
		ObjectIds.WaymarkD,
		ObjectIds.Waymark1,
		ObjectIds.Waymark2,
		ObjectIds.Waymark3,
		ObjectIds.Waymark4,
		// Lock-on markers
		ObjectIds.LockOnRed,
		ObjectIds.LockOnBlue,
		ObjectIds.LockOnPurple,
		ObjectIds.LockOnGreen,
	],
	// Category 4: Shape/Symbol (column 1: 4)
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
	// Category 1: Field (column 1: 5)
	fields: [
		// Note: CircleWhiteSolid, CircleWhiteTile, CircleGraySolid,
		// SquareWhiteSolid, SquareWhiteTile, SquareGraySolid are unused (CSV: False)
		ObjectIds.CircleCheck,
		ObjectIds.SquareCheck,
		ObjectIds.CircleGray,
		ObjectIds.SquareGray,
	],
};
