/**
 * エディターページ
 */

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	EditorBoard,
	EditorToolbar,
	HistoryPanel,
	LayerPanel,
	ObjectPalette,
	PropertyPanel,
} from "@/components/editor";
import {
	BoardManagerModal,
	DecodeErrorDialog,
	LoadErrorScreen,
} from "@/components/editor/BoardManager";
import { ResizableLayout } from "@/components/panel";
import { CompactAppHeader } from "@/components/ui/AppHeader";
import { useBoards } from "@/lib/boards";
import {
	createEmptyBoard,
	EditorProvider,
	type GridSettings,
	type ObjectGroup,
	recalculateBoardSize,
	useEditor,
	useImportExport,
	useKeyboardShortcuts,
} from "@/lib/editor";
import { PanelProvider } from "@/lib/panel";
import { generateCommonMeta } from "@/lib/seo";
import {
	type BoardData,
	decodeStgy,
	encodeStgy,
	parseBoardData,
} from "@/lib/stgy";

/** キャンバスの基本サイズ */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

const seo = generateCommonMeta("editor");

export const Route = createFileRoute("/editor")({
	component: EditorPage,
	ssr: false, // TanStack DB (useLiveQuery) requires client-side only
	head: () => seo,
});

/** Default grid settings */
const DEFAULT_GRID_SETTINGS: GridSettings = {
	enabled: false,
	size: 16,
	showGrid: false,
};

/**
 * Decode board from stgyCode
 */
function decodeBoardFromStgy(stgyCode: string): BoardData | null {
	try {
		const binary = decodeStgy(stgyCode);
		return parseBoardData(binary);
	} catch (error) {
		console.warn("Failed to decode board:", error);
		return null;
	}
}

function EditorPage() {
	const { t } = useTranslation();

	// Board manager state
	const [showBoardManager, setShowBoardManager] = useState(false);
	const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	// Memory-only mode (when IndexedDB is unavailable)
	const [isMemoryOnlyMode, setIsMemoryOnlyMode] = useState(false);

	// Decode error state
	const [decodeError, setDecodeError] = useState<{
		boardId: string;
		boardName: string;
	} | null>(null);

	// Initial board state
	const [initialBoard, setInitialBoard] = useState<BoardData>(() =>
		createEmptyBoard(),
	);
	const [initialGroups, setInitialGroups] = useState<ObjectGroup[]>([]);
	const [initialGridSettings, setInitialGridSettings] = useState<GridSettings>(
		DEFAULT_GRID_SETTINGS,
	);
	const [initialEncodeKey, setInitialEncodeKey] = useState<number>(0);

	// Key to force re-render EditorProvider when switching boards
	const [editorKey, setEditorKey] = useState(0);

	// Board operations from useBoards
	const {
		boards,
		isLoading,
		error: storageError,
		clearError,
		createBoard,
		updateBoard,
		deleteBoard,
		getBoard,
	} = useBoards();

	// Handle opening a board
	const handleOpenBoard = useCallback(
		(boardId: string): boolean => {
			const board = getBoard(boardId);
			if (!board) return false;

			const decodedBoard = decodeBoardFromStgy(board.stgyCode);
			if (!decodedBoard) {
				// Show decode error dialog
				setDecodeError({ boardId: board.id, boardName: board.name });
				return false;
			}

			setDecodeError(null);
			setCurrentBoardId(boardId);
			// Use stored board name (may have been renamed) instead of decoded name
			setInitialBoard({ ...decodedBoard, name: board.name });
			setInitialGroups(board.groups);
			setInitialGridSettings(board.gridSettings);
			setInitialEncodeKey(board.encodeKey);
			setEditorKey((prev) => prev + 1);
			return true;
		},
		[getBoard],
	);

	// Handle creating a new board (or starting in memory-only mode)
	const handleCreateNewBoard = useCallback(
		(memoryOnly = false) => {
			const defaultName = t("boardManager.defaultBoardName");
			const newBoard = createEmptyBoard(defaultName);

			if (!memoryOnly && !isMemoryOnlyMode) {
				const { width, height } = recalculateBoardSize(newBoard);
				const boardToSave = { ...newBoard, width, height };
				const stgyCode = encodeStgy(boardToSave, 0);

				const newBoardId = createBoard(
					newBoard.name,
					stgyCode,
					0,
					[],
					DEFAULT_GRID_SETTINGS,
				);

				setCurrentBoardId(newBoardId);
			} else {
				// Memory-only mode: don't save to IndexedDB
				setCurrentBoardId(null);
			}

			setInitialBoard(newBoard);
			setInitialGroups([]);
			setInitialGridSettings(DEFAULT_GRID_SETTINGS);
			setInitialEncodeKey(0);
			setEditorKey((prev) => prev + 1);
		},
		[createBoard, t, isMemoryOnlyMode],
	);

	// Handle decode error: open board manager
	const handleOpenAnotherBoard = useCallback(() => {
		setDecodeError(null);
		setShowBoardManager(true);
	}, []);

	// Handle decode error: delete corrupted board
	const handleDeleteCorruptedBoard = useCallback(() => {
		if (!decodeError) return;

		deleteBoard(decodeError.boardId);
		setDecodeError(null);

		// Open another board or create new one
		const remainingBoards = boards.filter((b) => b.id !== decodeError.boardId);
		if (remainingBoards.length > 0) {
			handleOpenBoard(remainingBoards[0].id);
		} else {
			handleCreateNewBoard();
		}
	}, [decodeError, deleteBoard, boards, handleOpenBoard, handleCreateNewBoard]);

	// Handle storage error: retry
	const handleRetryStorage = useCallback(() => {
		clearError();
		window.location.reload();
	}, [clearError]);

	// Handle storage error: continue without saving
	const handleContinueWithoutSaving = useCallback(() => {
		clearError();
		setIsMemoryOnlyMode(true);
		handleCreateNewBoard(true);
		setIsInitialized(true);
	}, [clearError, handleCreateNewBoard]);

	// Auto-initialize: create first board or open last edited board
	useEffect(() => {
		// Wait for loading to complete, skip if error or memory-only mode
		if (isLoading || isInitialized || storageError || isMemoryOnlyMode) return;

		if (boards.length === 0) {
			// First time: auto-create a new board
			handleCreateNewBoard();
			setIsInitialized(true);
		} else if (!currentBoardId) {
			// Revisit: open the most recently updated board
			const mostRecentBoard = boards[0]; // Already sorted by updatedAt desc
			handleOpenBoard(mostRecentBoard.id);
			setIsInitialized(true);
		}
	}, [
		isLoading,
		isInitialized,
		boards,
		currentBoardId,
		storageError,
		isMemoryOnlyMode,
		handleCreateNewBoard,
		handleOpenBoard,
	]);

	// Show storage error screen
	if (storageError) {
		return (
			<LoadErrorScreen
				error={storageError}
				onRetry={handleRetryStorage}
				onStartWithoutSaving={handleContinueWithoutSaving}
			/>
		);
	}

	// Show loading state while initializing
	if (isLoading || !isInitialized) {
		return (
			<div className="h-screen flex items-center justify-center bg-background">
				<div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	return (
		<PanelProvider>
			<EditorProvider
				key={editorKey}
				initialBoard={initialBoard}
				initialGroups={initialGroups}
				initialGridSettings={initialGridSettings}
			>
				<EditorContent
					initialEncodeKey={initialEncodeKey}
					currentBoardId={currentBoardId}
					isMemoryOnlyMode={isMemoryOnlyMode}
					onOpenBoardManager={() => setShowBoardManager(true)}
					onSaveBoard={(name, stgyCode, encodeKey, groups, gridSettings) => {
						if (currentBoardId && !isMemoryOnlyMode) {
							updateBoard(currentBoardId, {
								name,
								stgyCode,
								encodeKey,
								groups,
								gridSettings,
							});
						}
					}}
					onCreateBoardFromImport={(name, stgyCode, encodeKey) => {
						// 新しいボードを作成
						const newBoardId = createBoard(
							name,
							stgyCode,
							encodeKey,
							[],
							DEFAULT_GRID_SETTINGS,
						);
						// 新しく作成したボードを開く（EditorProviderを再初期化）
						handleOpenBoard(newBoardId);
					}}
				/>
			</EditorProvider>

			{/* Board Manager Modal */}
			{!isMemoryOnlyMode && (
				<BoardManagerModal
					open={showBoardManager}
					onClose={() => setShowBoardManager(false)}
					currentBoardId={currentBoardId}
					onOpenBoard={handleOpenBoard}
					onCreateNewBoard={handleCreateNewBoard}
				/>
			)}

			{/* Decode Error Dialog */}
			<DecodeErrorDialog
				open={decodeError !== null}
				boardName={decodeError?.boardName ?? ""}
				onClose={() => setDecodeError(null)}
				onDelete={handleDeleteCorruptedBoard}
				onOpenAnother={handleOpenAnotherBoard}
			/>
		</PanelProvider>
	);
}

/** EditorContentのProps */
interface EditorContentProps {
	initialEncodeKey: number;
	currentBoardId: string | null;
	isMemoryOnlyMode: boolean;
	onOpenBoardManager: () => void;
	onSaveBoard: (
		name: string,
		stgyCode: string,
		encodeKey: number,
		groups: ObjectGroup[],
		gridSettings: GridSettings,
	) => void;
	onCreateBoardFromImport?: (
		name: string,
		stgyCode: string,
		encodeKey: number,
	) => void;
}

/**
 * エディターコンテンツ（キーボードショートカット有効化）
 */
function EditorContent({
	initialEncodeKey,
	currentBoardId,
	isMemoryOnlyMode,
	onOpenBoardManager,
	onSaveBoard,
	onCreateBoardFromImport,
}: EditorContentProps) {
	// キーボードショートカットを有効化
	useKeyboardShortcuts();

	// Get editor state
	const { state } = useEditor();

	// インポート/エクスポートフック（encodeKeyの管理）
	const { encodeKey, setEncodeKey } = useImportExport();

	// 初期encodeKeyを設定
	useEffect(() => {
		setEncodeKey(initialEncodeKey);
	}, [initialEncodeKey, setEncodeKey]);

	// Auto-save to IndexedDB
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Save current board when dirty (skip in memory-only mode)
	useEffect(() => {
		if (!currentBoardId || !state.isDirty || isMemoryOnlyMode) return;

		// Clear previous timeout
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		// Debounce save
		saveTimeoutRef.current = setTimeout(() => {
			const { width, height } = recalculateBoardSize(state.board);
			const boardToSave = { ...state.board, width, height };
			const stgyCode = encodeStgy(boardToSave, encodeKey ?? 0);

			onSaveBoard(
				state.board.name,
				stgyCode,
				encodeKey ?? 0,
				state.groups,
				state.gridSettings,
			);
			setLastSavedAt(new Date());
		}, 1000);

		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [
		currentBoardId,
		state.isDirty,
		state.board,
		state.groups,
		state.gridSettings,
		encodeKey,
		isMemoryOnlyMode,
		onSaveBoard,
	]);

	const containerRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);

	// コンテナサイズに応じてスケールを計算
	const calculateScale = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const padding = 32; // p-4 = 16px * 2
		const availableWidth = container.clientWidth - padding;
		const availableHeight = container.clientHeight - padding;

		// アスペクト比を維持しながら収まる最大スケールを計算
		const scaleX = availableWidth / CANVAS_WIDTH;
		const scaleY = availableHeight / CANVAS_HEIGHT;
		const newScale = Math.max(0.5, Math.min(3, Math.min(scaleX, scaleY)));

		setScale(newScale);
	}, []);

	// ResizeObserverでコンテナサイズの変更を監視
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		calculateScale();

		const resizeObserver = new ResizeObserver(() => {
			calculateScale();
		});

		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
		};
	}, [calculateScale]);

	// ロゴアイコン
	const logoIcon = (
		<div className="w-8 h-8 rounded-md flex items-center justify-center bg-muted border border-border">
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				className="text-foreground"
				role="img"
				aria-label="STGY Tools logo"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
				<circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
				<path d="M8.5 15.5h7M15.5 8.5v7" strokeLinecap="round" />
			</svg>
		</div>
	);

	return (
		<div className="h-screen flex flex-col bg-background">
			{/* 共通ヘッダー */}
			<CompactAppHeader
				currentPage="editor"
				title="STGY Tools Editor"
				logo={logoIcon}
				showLanguageSelector
			/>

			{/* ツールバー */}
			<EditorToolbar
				lastSavedAt={isMemoryOnlyMode ? null : lastSavedAt}
				onOpenBoardManager={isMemoryOnlyMode ? undefined : onOpenBoardManager}
				onCreateBoardFromImport={
					isMemoryOnlyMode ? undefined : onCreateBoardFromImport
				}
			/>

			{/* メインエリア */}
			<div className="flex-1 overflow-hidden h-full">
				<ResizableLayout
					panelComponents={{
						objectPalette: <ObjectPalette />,
						layerPanel: <LayerPanel />,
						propertyPanel: <PropertyPanel />,
						historyPanel: <HistoryPanel />,
					}}
				>
					{/* 中央: キャンバス */}
					<div
						ref={containerRef}
						className="canvas-container h-full flex items-center justify-center overflow-auto p-4"
					>
						<EditorBoard scale={scale} />
					</div>
				</ResizableLayout>
			</div>
		</div>
	);
}
