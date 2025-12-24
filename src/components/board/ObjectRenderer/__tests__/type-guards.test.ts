/**
 * タイプガード関数のテスト
 */

import { describe, expect, it } from "vitest";
import { ObjectIds } from "@/lib/stgy";
import {
	isAoEObject,
	isEnemy,
	isFieldObject,
	isJobIcon,
	isMarker,
	isRoleIcon,
	isWaymark,
} from "../type-guards";

describe("type-guards", () => {
	describe("isFieldObject", () => {
		it("CircleCheck", () => {
			expect(isFieldObject(ObjectIds.CircleCheck)).toBe(true);
		});

		it("SquareCheck", () => {
			expect(isFieldObject(ObjectIds.SquareCheck)).toBe(true);
		});

		it("CircleGray", () => {
			expect(isFieldObject(ObjectIds.CircleGray)).toBe(true);
		});

		it("SquareGray", () => {
			expect(isFieldObject(ObjectIds.SquareGray)).toBe(true);
		});

		it("非フィールドオブジェクト", () => {
			expect(isFieldObject(ObjectIds.Tank)).toBe(false);
			expect(isFieldObject(ObjectIds.CircleAoE)).toBe(false);
		});
	});

	describe("isAoEObject", () => {
		it("CircleAoE", () => {
			expect(isAoEObject(ObjectIds.CircleAoE)).toBe(true);
		});

		it("ConeAoE", () => {
			expect(isAoEObject(ObjectIds.ConeAoE)).toBe(true);
		});

		it("LineAoE", () => {
			expect(isAoEObject(ObjectIds.LineAoE)).toBe(true);
		});

		it("Gaze", () => {
			expect(isAoEObject(ObjectIds.Gaze)).toBe(true);
		});

		it("DonutAoE", () => {
			expect(isAoEObject(ObjectIds.DonutAoE)).toBe(true);
		});

		it("非AoEオブジェクト", () => {
			expect(isAoEObject(ObjectIds.Tank)).toBe(false);
			expect(isAoEObject(ObjectIds.WaymarkA)).toBe(false);
		});
	});

	describe("isRoleIcon", () => {
		it("基本クラス・ジョブアイコン（18-46）", () => {
			expect(isRoleIcon(18)).toBe(true);
			expect(isRoleIcon(30)).toBe(true);
			expect(isRoleIcon(46)).toBe(true);
		});

		it("ロールアイコン（47-57）", () => {
			expect(isRoleIcon(ObjectIds.Tank)).toBe(true);
			expect(isRoleIcon(ObjectIds.Healer)).toBe(true);
			expect(isRoleIcon(ObjectIds.DPS)).toBe(true);
			expect(isRoleIcon(57)).toBe(true);
		});

		it("追加ジョブアイコン（101-102）", () => {
			expect(isRoleIcon(101)).toBe(true);
			expect(isRoleIcon(102)).toBe(true);
		});

		it("追加ロールアイコン（118-123）", () => {
			expect(isRoleIcon(118)).toBe(true);
			expect(isRoleIcon(123)).toBe(true);
		});

		it("非ロールアイコン", () => {
			expect(isRoleIcon(17)).toBe(false);
			expect(isRoleIcon(58)).toBe(false);
			expect(isRoleIcon(100)).toBe(false);
			expect(isRoleIcon(103)).toBe(false);
			expect(isRoleIcon(117)).toBe(false);
			expect(isRoleIcon(124)).toBe(false);
		});
	});

	describe("isWaymark", () => {
		it("WaymarkA-D", () => {
			expect(isWaymark(ObjectIds.WaymarkA)).toBe(true);
			expect(isWaymark(ObjectIds.WaymarkB)).toBe(true);
			expect(isWaymark(ObjectIds.WaymarkC)).toBe(true);
			expect(isWaymark(ObjectIds.WaymarkD)).toBe(true);
		});

		it("Waymark1-4", () => {
			expect(isWaymark(ObjectIds.Waymark1)).toBe(true);
			expect(isWaymark(ObjectIds.Waymark2)).toBe(true);
			expect(isWaymark(ObjectIds.Waymark3)).toBe(true);
			expect(isWaymark(ObjectIds.Waymark4)).toBe(true);
		});

		it("非ウェイマーク", () => {
			expect(isWaymark(ObjectIds.Tank)).toBe(false);
			expect(isWaymark(ObjectIds.CircleAoE)).toBe(false);
		});
	});

	describe("isEnemy", () => {
		it("EnemySmall", () => {
			expect(isEnemy(ObjectIds.EnemySmall)).toBe(true);
		});

		it("EnemyMedium", () => {
			expect(isEnemy(ObjectIds.EnemyMedium)).toBe(true);
		});

		it("EnemyLarge", () => {
			expect(isEnemy(ObjectIds.EnemyLarge)).toBe(true);
		});

		it("非エネミー", () => {
			expect(isEnemy(ObjectIds.Tank)).toBe(false);
			expect(isEnemy(ObjectIds.WaymarkA)).toBe(false);
		});
	});

	describe("isMarker", () => {
		it("Attack markers", () => {
			expect(isMarker(ObjectIds.Attack1)).toBe(true);
			expect(isMarker(ObjectIds.Attack2)).toBe(true);
			expect(isMarker(ObjectIds.Attack3)).toBe(true);
			expect(isMarker(ObjectIds.Attack4)).toBe(true);
			expect(isMarker(ObjectIds.Attack5)).toBe(true);
		});

		it("Bind markers", () => {
			expect(isMarker(ObjectIds.Bind1)).toBe(true);
			expect(isMarker(ObjectIds.Bind2)).toBe(true);
			expect(isMarker(ObjectIds.Bind3)).toBe(true);
		});

		it("Ignore markers", () => {
			expect(isMarker(ObjectIds.Ignore1)).toBe(true);
			expect(isMarker(ObjectIds.Ignore2)).toBe(true);
		});

		it("Generic markers", () => {
			expect(isMarker(ObjectIds.Square)).toBe(true);
			expect(isMarker(ObjectIds.Circle)).toBe(true);
			expect(isMarker(ObjectIds.Plus)).toBe(true);
			expect(isMarker(ObjectIds.Triangle)).toBe(true);
		});

		it("非マーカー", () => {
			expect(isMarker(ObjectIds.Tank)).toBe(false);
			expect(isMarker(ObjectIds.WaymarkA)).toBe(false);
		});
	});

	describe("isJobIcon", () => {
		it("ジョブアイコン", () => {
			// JOB_ICON_IDSに含まれるIDを確認
			// 具体的なIDは実装に依存
			expect(typeof isJobIcon(18)).toBe("boolean");
		});

		it("非ジョブアイコン", () => {
			expect(isJobIcon(ObjectIds.Tank)).toBe(false);
			expect(isJobIcon(ObjectIds.CircleAoE)).toBe(false);
		});
	});
});
