/**
 * Import/export functionality hook
 */

import { useState } from "react";
import type { BoardData } from "@/lib/stgy";
import {
	assignBoardObjectIdsDeterministic,
	decodeStgy,
	extractKeyFromStgy,
	parseBoardData,
} from "@/lib/stgy";

export interface ImportResult {
	success: boolean;
	board?: BoardData;
	key?: number;
	error?: string;
}

export interface UseImportExportReturn {
	// Import
	showImportModal: boolean;
	openImportModal: () => void;
	closeImportModal: () => void;
	importText: string;
	setImportText: (text: string) => void;
	importError: string | null;
	executeImport: () => ImportResult;
	resetImport: () => void;

	// Export
	showExportModal: boolean;
	openExportModal: () => void;
	closeExportModal: () => void;
	encodeKey: number | null;
	setEncodeKey: (key: number | null) => void;
}

export function useImportExport(): UseImportExportReturn {
	const [showImportModal, setShowImportModal] = useState(false);
	const [importText, setImportText] = useState("");
	const [importError, setImportError] = useState<string | null>(null);
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
	};

	const executeImport = (): ImportResult => {
		try {
			setImportError(null);
			const trimmedText = importText.trim();
			const key = extractKeyFromStgy(trimmedText);
			const binary = decodeStgy(trimmedText);
			const parsed = parseBoardData(binary);
			const board = assignBoardObjectIdsDeterministic(parsed);

			return {
				success: true,
				board,
				key,
			};
		} catch (e) {
			const errorMessage = e instanceof Error ? e.message : "Import failed";
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
		showExportModal,
		openExportModal,
		closeExportModal,
		encodeKey,
		setEncodeKey,
	};
}
