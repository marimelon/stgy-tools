/**
 * 履歴状態更新ユーティリティ
 */

import type { BoardData, HistoryEntry, ObjectGroup } from "../../types";
import { MAX_HISTORY_SIZE } from "../../types";
import { generateHistoryId } from "../utils";

/**
 * 履歴エントリを追加
 * @param currentHistory 現在の履歴配列
 * @param currentIndex 現在の履歴インデックス
 * @param board ボードデータ
 * @param groups グループ配列
 * @param description 履歴の説明
 * @returns 更新された履歴配列と新しいインデックス
 */
export function addHistoryEntry(
	currentHistory: HistoryEntry[],
	currentIndex: number,
	board: BoardData,
	groups: ObjectGroup[],
	description: string,
): { history: HistoryEntry[]; historyIndex: number } {
	// 現在位置以降の履歴を削除
	const newHistory = currentHistory.slice(0, currentIndex + 1);

	// 新しいエントリを追加
	const entry: HistoryEntry = {
		id: generateHistoryId(),
		board: structuredClone(board),
		groups: structuredClone(groups),
		description,
	};
	newHistory.push(entry);

	// 履歴が多すぎる場合は古いものを削除
	if (newHistory.length > MAX_HISTORY_SIZE) {
		newHistory.shift();
	}

	return {
		history: newHistory,
		historyIndex: newHistory.length - 1,
	};
}

/**
 * 履歴を完全に置き換え
 * @param newHistory 新しい履歴配列
 * @param newIndex 新しい履歴インデックス
 * @returns 更新された履歴配列とインデックス
 */
export function replaceHistory(
	newHistory: HistoryEntry[],
	newIndex: number,
): { history: HistoryEntry[]; historyIndex: number } {
	return {
		history: newHistory,
		historyIndex: newIndex,
	};
}

/**
 * 履歴インデックスを変更（undo/redo用）
 * @param currentHistory 現在の履歴配列
 * @param newIndex 新しいインデックス
 * @returns 更新された履歴インデックス
 */
export function setHistoryIndex(
	currentHistory: HistoryEntry[],
	newIndex: number,
): number {
	// インデックスを範囲内にクランプ
	return Math.max(0, Math.min(newIndex, currentHistory.length - 1));
}
