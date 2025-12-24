/**
 * インポート/エクスポート機能のカスタムフック
 */

import { useState } from "react";
import type { BoardData } from "@/lib/stgy";
import {
	decodeStgy,
	encodeStgy,
	extractKeyFromStgy,
	parseBoardData,
} from "@/lib/stgy";
import { recalculateBoardSize } from "./factory";

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
	/** エクスポートコードを生成 */
	generateExportCode: (board: BoardData) => string;
	/** クリップボードにコピー */
	copyToClipboard: (text: string) => Promise<void>;
}

/**
 * インポート/エクスポート機能のカスタムフック
 */
export function useImportExport(): UseImportExportReturn {
	// インポート状態
	const [showImportModal, setShowImportModal] = useState(false);
	const [importText, setImportText] = useState("");
	const [importError, setImportError] = useState<string | null>(null);

	// エクスポート状態
	const [showExportModal, setShowExportModal] = useState(false);
	const [encodeKey, setEncodeKey] = useState<number | null>(null);

	// インポートモーダル操作
	const openImportModal = () => {
		setShowImportModal(true);
	};

	const closeImportModal = () => {
		setShowImportModal(false);
	};

	const resetImport = () => {
		setImportText("");
		setImportError(null);
	};

	// インポート実行
	const executeImport = (): ImportResult => {
		try {
			setImportError(null);
			const trimmedText = importText.trim();

			// キーを抽出
			const key = extractKeyFromStgy(trimmedText);

			// デコード
			const binary = decodeStgy(trimmedText);
			const board = parseBoardData(binary);

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

	// エクスポートモーダル操作
	const openExportModal = () => {
		setShowExportModal(true);
	};

	const closeExportModal = () => {
		setShowExportModal(false);
	};

	// エクスポートコード生成
	const generateExportCode = (board: BoardData): string => {
		const { width, height } = recalculateBoardSize(board);
		const exportBoard = {
			...board,
			width,
			height,
		};
		return encodeStgy(
			exportBoard,
			encodeKey !== null ? { key: encodeKey } : undefined,
		);
	};

	// クリップボードにコピー
	const copyToClipboard = async (text: string): Promise<void> => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// フォールバック
			const textarea = document.createElement("textarea");
			textarea.value = text;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
		}
	};

	return {
		// インポート
		showImportModal,
		openImportModal,
		closeImportModal,
		importText,
		setImportText,
		importError,
		executeImport,
		resetImport,
		// エクスポート
		showExportModal,
		openExportModal,
		closeExportModal,
		encodeKey,
		setEncodeKey,
		generateExportCode,
		copyToClipboard,
	};
}
