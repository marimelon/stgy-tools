/**
 * オブジェクトパレットの定数
 */

import { ObjectIds } from "@/lib/stgy";

/** パレット専用アイコンがあるオブジェクトID一覧 */
export const PALETTE_ICON_OBJECT_IDS: number[] = [
	ObjectIds.ConeAoE, // 10: 扇範囲攻撃
	ObjectIds.Line, // 12: ライン
	ObjectIds.DonutAoE, // 17: 輪形範囲攻撃
	ObjectIds.Text, // 100: テキスト
];
