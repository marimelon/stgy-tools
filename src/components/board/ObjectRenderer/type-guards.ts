/**
 * オブジェクトID判定関数
 * ObjectIds の範囲は docs/csv-spec.md および src/lib/stgy/types.ts を参照
 */
import { ObjectIds } from "@/lib/stgy";
import {
	AOE_OBJECT_IDS,
	ENEMY_OBJECT_IDS,
	FIELD_OBJECT_IDS,
	JOB_ICON_IDS,
	MARKER_OBJECT_IDS,
} from "./constants";

export function isFieldObject(id: number): boolean {
	return FIELD_OBJECT_IDS.includes(id);
}

export function isAoEObject(id: number): boolean {
	return AOE_OBJECT_IDS.includes(id);
}

/**
 * ロールアイコン判定
 * - 18-46: 基本クラス・ジョブアイコン（Gladiator〜Pictomancer）
 * - 47-57: ロールアイコン（Tank, Healer, DPS等）
 * - 101-102: 追加ジョブアイコン（Viper, Pictomancer）
 * - 118-123: 追加ロールアイコン（MeleeDPS, RangedDPS等）
 */
export function isRoleIcon(id: number): boolean {
	return (
		(id >= 18 && id <= 57) ||
		(id >= 101 && id <= 102) ||
		(id >= 118 && id <= 123)
	);
}

export function isWaymark(id: number): boolean {
	return id >= ObjectIds.WaymarkA && id <= ObjectIds.Waymark4;
}

export function isEnemy(id: number): boolean {
	return ENEMY_OBJECT_IDS.includes(id);
}

export function isMarker(id: number): boolean {
	return MARKER_OBJECT_IDS.includes(id);
}

export function isJobIcon(id: number): boolean {
	return JOB_ICON_IDS.includes(id);
}
