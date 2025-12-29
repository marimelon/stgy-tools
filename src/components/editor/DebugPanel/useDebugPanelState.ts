/**
 * デバッグパネル状態管理フック
 *
 * BoardDataをJSON形式で表示・編集するための状態管理
 * - 自動同期（500msデバウンス）
 * - 外部変更検出
 * - バリデーションエラー表示
 */

import { useEffect, useRef, useState } from "react";
import { useEditorActions } from "@/lib/editor/hooks/useEditorActions";
import { useBoard } from "@/lib/editor/hooks/useEditorStore";
import type { BoardData } from "@/lib/stgy";
import { safeParseBoardData } from "@/lib/stgy/schema";

/** 同期ステータス */
export type SyncStatus = "synced" | "pending" | "error";

/** デバッグパネル状態 */
export interface DebugPanelState {
	/** JSON文字列 */
	jsonString: string;
	/** JSON文字列を更新 */
	setJsonString: (value: string) => void;
	/** 同期ステータス */
	syncStatus: SyncStatus;
	/** バリデーションエラー */
	validationErrors: string[] | null;
}

/** デバウンス時間（ミリ秒） */
const DEBOUNCE_MS = 500;

/**
 * デバッグパネル状態管理フック
 */
export function useDebugPanelState(): DebugPanelState {
	const board = useBoard();
	const { updateBoardFromDebug } = useEditorActions();

	// ローカルJSON文字列状態
	const [jsonString, setJsonStringInternal] = useState(() =>
		JSON.stringify(board, null, 2),
	);

	// 同期ステータス
	const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

	// バリデーションエラー
	const [validationErrors, setValidationErrors] = useState<string[] | null>(
		null,
	);

	// 外部変更追跡用ref
	const lastExternalBoardRef = useRef<BoardData>(board);

	// ローカル編集フラグ（外部変更と区別するため）
	const isLocalEditRef = useRef(false);

	// デバウンスタイマーref
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// デバウンス同期
	useEffect(() => {
		if (syncStatus !== "pending") return;

		// 既存のタイマーをクリア
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			const result = safeParseBoardData(jsonString);

			if (result.success) {
				isLocalEditRef.current = true;
				updateBoardFromDebug(result.data);
				lastExternalBoardRef.current = result.data;
				setSyncStatus("synced");
				setValidationErrors(null);
			} else {
				setSyncStatus("error");
				setValidationErrors(result.errors);
			}
		}, DEBOUNCE_MS);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [jsonString, syncStatus, updateBoardFromDebug]);

	// 外部変更検出
	useEffect(() => {
		// ローカル編集による変更は無視
		if (isLocalEditRef.current) {
			isLocalEditRef.current = false;
			return;
		}

		// 外部変更があった場合、JSON文字列を更新
		setJsonStringInternal(JSON.stringify(board, null, 2));
		lastExternalBoardRef.current = board;
		setSyncStatus("synced");
		setValidationErrors(null);
	}, [board]);

	// JSON文字列変更ハンドラー
	const setJsonString = (value: string) => {
		setJsonStringInternal(value);
		setSyncStatus("pending");
	};

	return {
		jsonString,
		setJsonString,
		syncStatus,
		validationErrors,
	};
}
