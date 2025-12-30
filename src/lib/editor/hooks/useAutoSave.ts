/**
 * 自動保存フック
 *
 * TanStack Store Effect を使用して EditorStore の変更を監視し、
 * デバウンス付きで IndexedDB に自動保存する
 */

import { Effect } from "@tanstack/store";
import { useEffect, useRef, useState } from "react";
import { type BoardData, encodeStgy } from "@/lib/stgy";
import { recalculateBoardSize } from "../factory";
import { getEditorStore } from "../store/editorStore";
import type { GridSettings, ObjectGroup } from "../types";

/** 自動保存のデバウンス時間 (ms) */
const AUTO_SAVE_DEBOUNCE_MS = 1000;

/** 保存コールバックの型 */
export type SaveBoardCallback = (
	name: string,
	stgyCode: string,
	encodeKey: number,
	groups: ObjectGroup[],
	gridSettings: GridSettings,
) => void;

/** useAutoSave のオプション */
export interface UseAutoSaveOptions {
	/** 保存先のボードID（nullの場合は保存しない） */
	currentBoardId: string | null;
	/** エンコードキー */
	encodeKey: number | null;
	/** メモリのみモード（trueの場合は保存しない） */
	isMemoryOnlyMode: boolean;
	/** 保存コールバック */
	onSave: SaveBoardCallback;
}

/**
 * 自動保存フック
 *
 * EditorStore の isDirty が true になったとき、デバウンス付きで保存を実行
 */
export function useAutoSave(options: UseAutoSaveOptions) {
	const { currentBoardId, isMemoryOnlyMode } = options;

	// 最終保存時刻
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

	// 外部オプションを ref で保持（Effect 内から最新値を参照するため）
	const optionsRef = useRef(options);
	optionsRef.current = options;

	// デバウンス用タイマー
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		// 保存が無効な場合は Effect をマウントしない
		if (!currentBoardId || isMemoryOnlyMode) {
			return;
		}

		const store = getEditorStore();

		// 保存実行関数
		const executeSave = (
			board: BoardData,
			groups: ObjectGroup[],
			gridSettings: GridSettings,
		) => {
			const { currentBoardId, encodeKey, onSave } = optionsRef.current;
			if (!currentBoardId || optionsRef.current.isMemoryOnlyMode) return;

			const { width, height } = recalculateBoardSize(board);
			const boardToSave = { ...board, width, height };
			const stgyCode = encodeStgy(boardToSave, encodeKey ?? 0);

			onSave(board.name, stgyCode, encodeKey ?? 0, groups, gridSettings);
			setLastSavedAt(new Date());
		};

		// TanStack Store Effect を作成
		const autoSaveEffect = new Effect({
			deps: [store],
			fn: () => {
				const state = store.state;

				// 変更がない場合は何もしない
				if (!state.isDirty) return;

				// 保存が無効な場合は何もしない
				if (
					!optionsRef.current.currentBoardId ||
					optionsRef.current.isMemoryOnlyMode
				) {
					return;
				}

				// 既存のタイマーをクリア
				if (saveTimeoutRef.current) {
					clearTimeout(saveTimeoutRef.current);
				}

				// デバウンス付きで保存
				saveTimeoutRef.current = setTimeout(() => {
					// 再度最新の状態を取得
					const currentState = store.state;
					if (currentState.isDirty) {
						executeSave(
							currentState.board,
							currentState.groups,
							currentState.gridSettings,
						);
					}
				}, AUTO_SAVE_DEBOUNCE_MS);
			},
			eager: false, // 初回は実行しない
		});

		// Effect をマウント
		const unmount = autoSaveEffect.mount();

		// クリーンアップ
		return () => {
			unmount();
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
				saveTimeoutRef.current = null;
			}
		};
	}, [currentBoardId, isMemoryOnlyMode]);

	return { lastSavedAt };
}
