/**
 * 自動保存フック
 *
 * EditorContextの状態を監視し、変更があれば自動的にlocalStorageに保存する。
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useEditor } from "@/lib/editor";
import { encodeStgy } from "@/lib/stgy";
import { recalculateBoardSize } from "@/lib/editor/factory";
import { saveSession, createSessionData } from "./storage";

export interface UseAutoSaveOptions {
	/** デバウンス時間 (ミリ秒) */
	debounceMs?: number;
	/** エンコードキー (0-63) */
	encodeKey?: number | null;
	/** 自動保存有効 */
	enabled?: boolean;
}

export interface UseAutoSaveReturn {
	/** 最後の保存時刻 */
	lastSavedAt: Date | null;
	/** 保存中フラグ */
	isSaving: boolean;
	/** 手動保存をトリガー */
	saveNow: () => void;
}

/**
 * 自動保存フック
 */
export function useAutoSave(
	options: UseAutoSaveOptions = {},
): UseAutoSaveReturn {
	const { debounceMs = 1000, encodeKey = null, enabled = true } = options;

	const { state } = useEditor();
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// 保存処理
	const performSave = useCallback(() => {
		if (!enabled) return;

		setIsSaving(true);

		try {
			// ボードサイズを再計算してエンコード
			const { width, height } = recalculateBoardSize(state.board);
			const boardToSave = { ...state.board, width, height };
			const stgyCode = encodeStgy(
				boardToSave,
				encodeKey !== null ? { key: encodeKey } : undefined,
			);

			const sessionData = createSessionData(
				stgyCode,
				encodeKey ?? 0,
				state.groups,
				state.gridSettings,
			);

			saveSession(sessionData);
			setLastSavedAt(new Date());
		} catch (error) {
			console.error("Auto-save failed:", error);
		} finally {
			setIsSaving(false);
		}
	}, [state.board, state.groups, state.gridSettings, encodeKey, enabled]);

	// 手動保存
	const saveNow = useCallback(() => {
		// 既存のタイマーをクリア
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		performSave();
	}, [performSave]);

	// 状態変更を監視して自動保存
	useEffect(() => {
		if (!enabled) return;

		// isDirtyがfalseの場合は保存しない（初期状態または保存済み）
		// ただし、初回読み込み時を除く
		if (!state.isDirty && lastSavedAt === null) {
			// 初回は即座に保存しない
			return;
		}

		// 既存のタイマーをクリア
		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}

		// デバウンス後に保存
		timerRef.current = setTimeout(() => {
			performSave();
			timerRef.current = null;
		}, debounceMs);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [state.isDirty, debounceMs, enabled, performSave, lastSavedAt]);

	// アンマウント時に保存
	useEffect(() => {
		return () => {
			// クリーンアップ時に未保存の変更があれば保存
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				performSave();
			}
		};
	}, [performSave]);

	return {
		lastSavedAt,
		isSaving,
		saveNow,
	};
}
