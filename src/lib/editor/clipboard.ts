/**
 * グローバルクリップボード
 * アプリ内の全エディタータブで共有されるインメモリストア
 */

import { useSyncExternalStore } from "react";
import type { BoardObject } from "@/lib/stgy";

/** グローバルクリップボードストア */
let clipboardStore: BoardObject[] | null = null;

/** サブスクライバーのセット */
const subscribers = new Set<() => void>();

/**
 * クリップボードの状態変更を購読
 * useSyncExternalStore用
 */
export function subscribeToClipboard(callback: () => void): () => void {
	subscribers.add(callback);
	return () => {
		subscribers.delete(callback);
	};
}

/**
 * サブスクライバーに通知
 */
function notifySubscribers(): void {
	for (const callback of subscribers) {
		callback();
	}
}

/**
 * オブジェクトをクリップボードに保存
 */
export function writeToClipboard(objects: BoardObject[]): void {
	clipboardStore = structuredClone(objects);
	notifySubscribers();
}

/**
 * クリップボードからオブジェクトを読み取り
 * @returns オブジェクト配列、または空の場合は null
 */
export function readFromClipboard(): BoardObject[] | null {
	if (!clipboardStore || clipboardStore.length === 0) {
		return null;
	}
	return clipboardStore;
}

/**
 * クリップボードにデータがあるか確認
 */
export function hasClipboardData(): boolean {
	return clipboardStore !== null && clipboardStore.length > 0;
}

/**
 * クリップボードの状態を取得（useSyncExternalStore用スナップショット）
 */
export function getClipboardSnapshot(): boolean {
	return hasClipboardData();
}

/**
 * グローバルクリップボードの状態を監視するフック
 * タブ間でクリップボードが共有されるため、他タブでコピーされた場合も検知
 */
export function useGlobalClipboard(): boolean {
	// 第3引数はSSR用のスナップショット（サーバー側ではクリップボードは常に空）
	return useSyncExternalStore(
		subscribeToClipboard,
		getClipboardSnapshot,
		() => false,
	);
}
