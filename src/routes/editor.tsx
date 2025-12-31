/**
 * エディターページ
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AssetPanel,
	AssetPanelActions,
	DebugPanel,
	DuplicateBoardModal,
	EditorBoard,
	EditorToolbar,
	ErrorToast,
	FocusModeIndicator,
	HistoryPanel,
	HistoryPanelActions,
	LayerPanel,
	ObjectPalette,
	ObjectPaletteActions,
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
import type { StoredBoard } from "@/lib/boards/schema";
import {
	createEmptyBoard,
	DEFAULT_OVERLAY_SETTINGS,
	EditorStoreProvider,
	type GridSettings,
	type ObjectGroup,
	recalculateBoardSize,
	useAutoSave,
	useEditorActions,
	useFocusedGroup,
	useImportExport,
	useIsFocusMode,
	useKeyboardShortcuts,
} from "@/lib/editor";
import { PanelStoreProvider } from "@/lib/panel";
import {
	generateCanonicalLink,
	generateHreflangLinks,
	getLocalizedSeo,
	SITE_CONFIG,
} from "@/lib/seo";
import { getFeatureFlagsFn } from "@/lib/server/featureFlags";
import { SettingsStoreProvider } from "@/lib/settings";
import {
	type BoardData,
	decodeStgy,
	encodeStgy,
	parseBoardData,
} from "@/lib/stgy";

/** キャンバスの基本サイズ */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

/** Search params for editor page */
type EditorSearchParams = {
	stgy?: string;
	lang?: string;
};

export const Route = createFileRoute("/editor")({
	component: EditorPage,
	ssr: false, // TanStack DB (useLiveQuery) requires client-side only
	loader: async () => {
		const featureFlags = await getFeatureFlagsFn();
		return { featureFlags };
	},
	head: ({ match }) => {
		const { lang } = match.search;
		const seo = getLocalizedSeo("editor", lang);

		return {
			meta: [
				{ title: seo.title },
				{ name: "description", content: seo.description },
				// Open Graph
				{ property: "og:title", content: seo.title },
				{ property: "og:description", content: seo.description },
				{ property: "og:type", content: "website" },
				{ property: "og:url", content: `${SITE_CONFIG.url}${seo.path}` },
				{ property: "og:image", content: `${SITE_CONFIG.url}/favicon.svg` },
				{ property: "og:locale", content: seo.ogLocale },
				// Twitter Card
				{ name: "twitter:card", content: "summary" },
				{ name: "twitter:title", content: seo.title },
				{ name: "twitter:description", content: seo.description },
				{ name: "twitter:image", content: `${SITE_CONFIG.url}/favicon.svg` },
			],
			links: [
				generateCanonicalLink(seo.path),
				...generateHreflangLinks(seo.path),
			],
		};
	},
	validateSearch: (search: Record<string, unknown>): EditorSearchParams => ({
		stgy: typeof search.stgy === "string" ? search.stgy : undefined,
		lang: typeof search.lang === "string" ? search.lang : undefined,
	}),
});

/** Default grid settings */
const DEFAULT_GRID_SETTINGS: GridSettings = {
	enabled: false,
	size: 16,
	showGrid: false,
	overlayType: "none",
	showBackground: true,
	canvasColor: "slate-800",
	overlaySettings: DEFAULT_OVERLAY_SETTINGS,
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
	const navigate = useNavigate();
	const { stgy: codeFromUrl } = Route.useSearch();
	const { featureFlags } = Route.useLoaderData();

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

	// Ref to prevent multiple initialization attempts
	const initializingRef = useRef(false);

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
		findBoardByContent,
	} = useBoards();

	// Pending import state (for duplicate detection modal)
	const [pendingImport, setPendingImport] = useState<{
		code: string;
		existingBoard: StoredBoard;
	} | null>(null);

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
		async (memoryOnly = false) => {
			const defaultName = t("boardManager.defaultBoardName");
			const newBoard = createEmptyBoard(defaultName);

			if (!memoryOnly && !isMemoryOnlyMode) {
				const { width, height } = recalculateBoardSize(newBoard);
				const boardToSave = { ...newBoard, width, height };
				const stgyCode = encodeStgy(boardToSave, { key: 0 });

				const newBoardId = await createBoard(
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
	const handleDeleteCorruptedBoard = useCallback(async () => {
		if (!decodeError) return;

		deleteBoard(decodeError.boardId);
		setDecodeError(null);

		// Open another board or create new one
		const remainingBoards = boards.filter((b) => b.id !== decodeError.boardId);
		if (remainingBoards.length > 0) {
			handleOpenBoard(remainingBoards[0].id);
		} else {
			await handleCreateNewBoard();
		}
	}, [decodeError, deleteBoard, boards, handleOpenBoard, handleCreateNewBoard]);

	// Handle storage error: retry
	const handleRetryStorage = useCallback(() => {
		clearError();
		window.location.reload();
	}, [clearError]);

	// Handle storage error: continue without saving
	const handleContinueWithoutSaving = useCallback(async () => {
		clearError();
		setIsMemoryOnlyMode(true);
		await handleCreateNewBoard(true);
		setIsInitialized(true);
	}, [clearError, handleCreateNewBoard]);

	// Handle importing a board from URL query parameter
	const handleImportFromUrl = useCallback(
		async (code: string): Promise<boolean | "pending"> => {
			const trimmedCode = code.trim();

			// Check for existing board with same content (ignores encryption key)
			const existingBoard = await findBoardByContent(trimmedCode);
			if (existingBoard) {
				// Show duplicate detection modal
				setPendingImport({ code: trimmedCode, existingBoard });
				return "pending";
			}

			// Decode the stgy code
			const decodedBoard = decodeBoardFromStgy(trimmedCode);
			if (!decodedBoard) {
				console.warn("Failed to decode board from URL parameter");
				return false;
			}

			// Create a new board with the imported data
			const boardName = decodedBoard.name || t("boardManager.defaultBoardName");
			const newBoardId = await createBoard(
				boardName,
				trimmedCode,
				0,
				[],
				DEFAULT_GRID_SETTINGS,
			);

			// Initialize editor with the imported board
			setCurrentBoardId(newBoardId);
			setInitialBoard({ ...decodedBoard, name: boardName });
			setInitialGroups([]);
			setInitialGridSettings(DEFAULT_GRID_SETTINGS);
			setInitialEncodeKey(0);
			setEditorKey((prev) => prev + 1);

			// Clear the URL parameter to prevent re-import on refresh
			navigate({ to: "/editor", search: {}, replace: true });

			return true;
		},
		[createBoard, t, navigate, findBoardByContent],
	);

	// Handle duplicate modal: open existing board
	const handleOpenExistingFromImport = useCallback(() => {
		if (!pendingImport) return;

		handleOpenBoard(pendingImport.existingBoard.id);
		setPendingImport(null);

		// Clear URL parameter
		navigate({ to: "/editor", search: {}, replace: true });
	}, [pendingImport, handleOpenBoard, navigate]);

	// Handle duplicate modal: create new board
	const handleCreateNewFromImport = useCallback(async () => {
		if (!pendingImport) return;

		const decodedBoard = decodeBoardFromStgy(pendingImport.code);
		if (!decodedBoard) {
			console.warn("Failed to decode board from pending import");
			setPendingImport(null);
			return;
		}

		// Create new board
		const boardName = decodedBoard.name || t("boardManager.defaultBoardName");
		const newBoardId = await createBoard(
			boardName,
			pendingImport.code,
			0,
			[],
			DEFAULT_GRID_SETTINGS,
		);

		// Initialize editor with the imported board
		setCurrentBoardId(newBoardId);
		setInitialBoard({ ...decodedBoard, name: boardName });
		setInitialGroups([]);
		setInitialGridSettings(DEFAULT_GRID_SETTINGS);
		setInitialEncodeKey(0);
		setEditorKey((prev) => prev + 1);

		setPendingImport(null);

		// Clear URL parameter
		navigate({ to: "/editor", search: {}, replace: true });
	}, [pendingImport, createBoard, t, navigate]);

	// Handle duplicate modal: cancel
	const handleCancelImport = useCallback(async () => {
		setPendingImport(null);

		// Clear URL parameter
		navigate({ to: "/editor", search: {}, replace: true });

		// Open the most recent board or create new one
		if (boards.length > 0) {
			handleOpenBoard(boards[0].id);
		} else {
			await handleCreateNewBoard();
		}
	}, [navigate, boards, handleOpenBoard, handleCreateNewBoard]);

	// Auto-initialize: create first board or open last edited board
	useEffect(() => {
		// Wait for loading to complete, skip if error or memory-only mode
		if (isLoading || isInitialized || storageError || isMemoryOnlyMode) return;

		// Prevent multiple initialization attempts (race condition with boards update)
		if (initializingRef.current) return;
		initializingRef.current = true;

		const initializeEditor = async () => {
			// Check for stgy code in URL query parameter (from Image Generator page)
			if (codeFromUrl) {
				// Clear URL parameter immediately to prevent re-processing on state updates
				navigate({ to: "/editor", search: {}, replace: true });

				const result = await handleImportFromUrl(codeFromUrl);
				if (result === "pending") {
					// Duplicate found, modal will be shown
					setIsInitialized(true);
					return;
				}
				if (result === true) {
					setIsInitialized(true);
					return;
				}
				// result === false: decode failed, continue to normal flow
			}

			if (boards.length === 0) {
				// First time: auto-create a new board
				await handleCreateNewBoard();
				setIsInitialized(true);
			} else if (!currentBoardId) {
				// Revisit: open the most recently updated board
				const mostRecentBoard = boards[0]; // Already sorted by updatedAt desc
				handleOpenBoard(mostRecentBoard.id);
				setIsInitialized(true);
			}
		};

		initializeEditor();
	}, [
		isLoading,
		isInitialized,
		boards,
		currentBoardId,
		storageError,
		isMemoryOnlyMode,
		codeFromUrl,
		handleCreateNewBoard,
		handleOpenBoard,
		handleImportFromUrl,
		navigate,
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
		<SettingsStoreProvider>
			<PanelStoreProvider>
				<EditorStoreProvider
					key={editorKey}
					initialBoard={initialBoard}
					initialGroups={initialGroups}
					initialGridSettings={initialGridSettings}
				>
					<EditorContent
						initialEncodeKey={initialEncodeKey}
						currentBoardId={currentBoardId}
						isMemoryOnlyMode={isMemoryOnlyMode}
						shortLinksEnabled={featureFlags.shortLinksEnabled}
						onOpenBoardManager={() => setShowBoardManager(true)}
						onSaveBoard={(name, stgyCode, encodeKey, groups, gridSettings) => {
							if (currentBoardId && !isMemoryOnlyMode) {
								void updateBoard(currentBoardId, {
									name,
									stgyCode,
									encodeKey,
									groups,
									gridSettings,
								});
							}
						}}
						onCreateBoardFromImport={async (name, stgyCode, encodeKey) => {
							// stgyCodeをデコードしてボードデータを取得
							const decodedBoard = decodeBoardFromStgy(stgyCode);
							if (!decodedBoard) {
								console.warn("Failed to decode imported board");
								return;
							}

							// 新しいボードをIndexedDBに保存
							const newBoardId = await createBoard(
								name,
								stgyCode,
								encodeKey,
								[],
								DEFAULT_GRID_SETTINGS,
							);

							// 直接エディターを初期化（IndexedDBの反映を待たずに）
							setCurrentBoardId(newBoardId);
							setInitialBoard({ ...decodedBoard, name });
							setInitialGroups([]);
							setInitialGridSettings(DEFAULT_GRID_SETTINGS);
							setInitialEncodeKey(encodeKey);
							setEditorKey((prev) => prev + 1);
						}}
					/>
				</EditorStoreProvider>

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

				{/* Duplicate Board Modal */}
				{pendingImport && (
					<DuplicateBoardModal
						open={true}
						onClose={handleCancelImport}
						existingBoard={pendingImport.existingBoard}
						onOpenExisting={handleOpenExistingFromImport}
						onCreateNew={handleCreateNewFromImport}
					/>
				)}
			</PanelStoreProvider>
		</SettingsStoreProvider>
	);
}

/** EditorContentのProps */
interface EditorContentProps {
	initialEncodeKey: number;
	currentBoardId: string | null;
	isMemoryOnlyMode: boolean;
	shortLinksEnabled: boolean;
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
	) => void | Promise<void>;
}

/**
 * エディターコンテンツ（キーボードショートカット有効化）
 */
function EditorContent({
	initialEncodeKey,
	currentBoardId,
	isMemoryOnlyMode,
	shortLinksEnabled,
	onOpenBoardManager,
	onSaveBoard,
	onCreateBoardFromImport,
}: EditorContentProps) {
	// キーボードショートカットを有効化
	useKeyboardShortcuts();

	// Get editor state
	const isFocusMode = useIsFocusMode();
	const focusedGroup = useFocusedGroup();
	const { unfocus } = useEditorActions();

	// インポート/エクスポートフック（encodeKeyの管理）
	const { encodeKey, setEncodeKey } = useImportExport();

	// 初期encodeKeyを設定
	useEffect(() => {
		setEncodeKey(initialEncodeKey);
	}, [initialEncodeKey, setEncodeKey]);

	// TanStack Store Effect を使用した自動保存
	const { lastSavedAt } = useAutoSave({
		currentBoardId,
		encodeKey,
		isMemoryOnlyMode,
		onSave: onSaveBoard,
	});

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
		<img
			src="/favicon.svg"
			width={32}
			height={32}
			alt="STGY Tools logo"
			className="rounded"
		/>
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
				shortLinksEnabled={shortLinksEnabled}
			/>

			{/* メインエリア */}
			<div className="flex-1 overflow-hidden h-full">
				<ResizableLayout
					panelComponents={{
						objectPalette: <ObjectPalette />,
						assetPanel: <AssetPanel />,
						layerPanel: <LayerPanel />,
						propertyPanel: <PropertyPanel />,
						historyPanel: <HistoryPanel />,
						debugPanel: <DebugPanel />,
					}}
					panelActions={{
						objectPalette: <ObjectPaletteActions />,
						assetPanel: <AssetPanelActions />,
						historyPanel: <HistoryPanelActions />,
					}}
				>
					{/* 中央: キャンバス */}
					<div
						ref={containerRef}
						className="canvas-container h-full flex items-center justify-center overflow-auto p-4 relative"
					>
						{/* フォーカスモードインジケーター */}
						{isFocusMode && focusedGroup && (
							<FocusModeIndicator
								groupName={
									focusedGroup.name ||
									`Group (${focusedGroup.objectIndices.length})`
								}
								onExit={unfocus}
							/>
						)}
						<EditorBoard scale={scale} />
					</div>
				</ResizableLayout>
			</div>

			{/* エラートースト */}
			<ErrorToast />
		</div>
	);
}
