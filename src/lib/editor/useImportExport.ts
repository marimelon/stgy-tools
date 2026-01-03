/**
 * インポート/エクスポート機能のカスタムフック
 */

import { useState } from "react";
import type { BoardData } from "@/lib/stgy";
import {
	assignBoardObjectIds,
	decodeStgy,
	extractKeyFromStgy,
	parseBoardData,
} from "@/lib/stgy";

/**
 * インポート結果
 */
export interface ImportResult {
	success: boolean;
	board?: BoardData;
	key?: number;
	error?: string;
}

/**
 * useImportExportフックの戻り値
 */
export interface UseImportExportReturn {
	// インポート関連
	/** インポートモーダル表示状態 */
	showImportModal: boolean;
	/** インポートモーダルを開く */
	openImportModal: () => void;
	/** インポートモーダルを閉じる */
	closeImportModal: () => void;
	/** インポートテキスト */
	importText: string;
	/** インポートテキストを設定 */
	setImportText: (text: string) => void;
	/** インポートエラー */
	importError: string | null;
	/** インポート実行 */
	executeImport: () => ImportResult;
	/** インポートをリセット */
	resetImport: () => void;
	/** ボード管理に追加するか */
	addToBoards: boolean;
	/** ボード管理に追加するかを設定 */
	setAddToBoards: (value: boolean) => void;

	// エクスポート関連
	/** エクスポートモーダル表示状態 */
	showExportModal: boolean;
	/** エクスポートモーダルを開く */
	openExportModal: () => void;
	/** エクスポートモーダルを閉じる */
	closeExportModal: () => void;
	/** エンコードキー */
	encodeKey: number | null;
	/** エンコードキーを設定 */
	setEncodeKey: (key: number | null) => void;
}

/**
 * インポート/エクスポート機能のカスタムフック
 */
export function useImportExport(): UseImportExportReturn {
	const [showImportModal, setShowImportModal] = useState(false);
	const [importText, setImportText] = useState("");
	const [importError, setImportError] = useState<string | null>(null);
	const [addToBoards, setAddToBoards] = useState(true);
	const [showExportModal, setShowExportModal] = useState(false);
	const [encodeKey, setEncodeKey] = useState<number | null>(null);

	const openImportModal = () => {
		setShowImportModal(true);
	};

	const closeImportModal = () => {
		setShowImportModal(false);
	};

	const resetImport = () => {
		setImportText("");
		setImportError(null);
		setAddToBoards(true);
	};

	const executeImport = (): ImportResult => {
		try {
			setImportError(null);
			const trimmedText = importText.trim();
			const key = extractKeyFromStgy(trimmedText);
			const binary = decodeStgy(trimmedText);
			const parsed = parseBoardData(binary);
			const board = assignBoardObjectIds(parsed);

			return {
				success: true,
				board,
				key,
			};
		} catch (e) {
			const errorMessage =
				e instanceof Error ? e.message : "インポートに失敗しました";
			setImportError(errorMessage);
			return {
				success: false,
				error: errorMessage,
			};
		}
	};

	const openExportModal = () => {
		setShowExportModal(true);
	};

	const closeExportModal = () => {
		setShowExportModal(false);
	};

	return {
		showImportModal,
		openImportModal,
		closeImportModal,
		importText,
		setImportText,
		importError,
		executeImport,
		resetImport,
		addToBoards,
		setAddToBoards,
		showExportModal,
		openExportModal,
		closeExportModal,
		encodeKey,
		setEncodeKey,
	};
}
