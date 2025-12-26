/**
 * レイヤーパネルの型定義
 */

import type { ObjectGroup } from "@/lib/editor/types";

/**
 * ドロップターゲット情報
 */
export interface DropTarget {
	/** ドロップ先のobjects配列インデックス */
	index: number;
	/** 挿入位置（前か後か） */
	position: "before" | "after";
}

/**
 * レイヤーアイテムの表示データ
 */
export interface LayerItem {
	type: "object" | "group-header";
	/** オブジェクトのインデックス（type: "object" の場合） */
	index?: number;
	/** グループ情報（type: "group-header" の場合） */
	group?: ObjectGroup;
	/** グループ内のオブジェクトかどうか */
	isInGroup: boolean;
	/** 所属グループID */
	groupId?: string;
}

/**
 * レイヤーコンテキストメニューのターゲット種別
 */
export type LayerContextMenuTarget =
	| { type: "object"; index: number; isInGroup: boolean; groupId?: string }
	| { type: "group"; group: ObjectGroup };

/**
 * レイヤーコンテキストメニューの状態
 */
export interface LayerContextMenuState {
	/** メニューが開いているか */
	isOpen: boolean;
	/** メニュー表示位置X */
	x: number;
	/** メニュー表示位置Y */
	y: number;
	/** メニューのターゲット */
	target: LayerContextMenuTarget | null;
}
