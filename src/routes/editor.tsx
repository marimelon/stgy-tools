/**
 * エディターページ
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AssetPanel,
	AssetPanelActions,
	BoardTabs,
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
	PropertyPanel,
} from "@/components/editor";
import {
	BoardManagerModal,
	DecodeErrorDialog,
} from "@/components/editor/BoardManager";
import { ResizableLayout } from "@/components/panel";
import { CompactAppHeader } from "@/components/ui/AppHeader";
import { BoardsProvider, useBoards } from "@/lib/boards";
import {
	convertGroupsToIdBased,
	convertGroupsToIndexBased,
	type StoredObjectGroup,
} from "@/lib/boards/groupConversion";
import type { StoredBoard } from "@/lib/boards/schema";
import {
	createEmptyBoard,
	DEFAULT_OVERLAY_SETTINGS,
	EditorStoreProvider,
	type GridSettings,
	type ObjectGroup,
	recalculateBoardSize,
	TabStoreProvider,
	useActiveTabId,
	useAutoSave,
	useEditorActions,
	useFocusedGroup,
	useIsFocusMode,
	useKeyboardShortcuts,
	useOpenTabs,
	useTabActions,
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
	assignBoardObjectIds,
	type BoardData,
	type BoardObject,
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
		const parsed = parseBoardData(binary);
		return assignBoardObjectIds(parsed);
	} catch (error) {
		console.warn("Failed to decode board:", error);
		return null;
	}
}

function EditorPage() {
	const { featureFlags } = Route.useLoaderData();

	return (
		<BoardsProvider>
			<EditorPageContent featureFlags={featureFlags} />
		</BoardsProvider>
	);
}

interface EditorPageContentProps {
	featureFlags: { shortLinksEnabled: boolean };
}

function EditorPageContent({ featureFlags }: EditorPageContentProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { stgy: codeFromUrl } = Route.useSearch();

	// Board manager state
	const [showBoardManager, setShowBoardManager] = useState(false);
	const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);

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

	// Key to force re-render EditorProvider when switching boards
	const [editorKey, setEditorKey] = useState(0);

	// Ref to prevent multiple initialization attempts
	const initializingRef = useRef(false);

	// Board operations from useBoards
	const {
		boards,
		isLoading,
		error: storageError,
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
			// Convert stored groups (index-based) to runtime groups (ID-based)
			const runtimeGroups = convertGroupsToIdBased(
				board.groups as StoredObjectGroup[],
				decodedBoard.objects,
			);
			setInitialGroups(runtimeGroups);
			setInitialGridSettings(board.gridSettings);

			setEditorKey((prev) => prev + 1);
			return true;
		},
		[getBoard],
	);

	// Handle creating a new board
	const handleCreateNewBoard = useCallback(async () => {
		const defaultName = t("boardManager.defaultBoardName");
		const newBoard = createEmptyBoard(defaultName);

		const { width, height } = recalculateBoardSize(newBoard);
		const boardToSave = { ...newBoard, width, height };
		const stgyCode = encodeStgy(boardToSave);

		const newBoardId = await createBoard(
			newBoard.name,
			stgyCode,
			[],
			DEFAULT_GRID_SETTINGS,
		);

		setCurrentBoardId(newBoardId);
		setInitialBoard(newBoard);
		setInitialGroups([]);
		setInitialGridSettings(DEFAULT_GRID_SETTINGS);

		setEditorKey((prev) => prev + 1);
	}, [createBoard, t]);

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
				[],
				DEFAULT_GRID_SETTINGS,
			);

			// Initialize editor with the imported board
			setCurrentBoardId(newBoardId);
			setInitialBoard({ ...decodedBoard, name: boardName });
			setInitialGroups([]);
			setInitialGridSettings(DEFAULT_GRID_SETTINGS);

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
			[],
			DEFAULT_GRID_SETTINGS,
		);

		// Initialize editor with the imported board
		setCurrentBoardId(newBoardId);
		setInitialBoard({ ...decodedBoard, name: boardName });
		setInitialGroups([]);
		setInitialGridSettings(DEFAULT_GRID_SETTINGS);

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
		// Wait for loading to complete, skip if error
		if (isLoading || isInitialized || storageError) return;

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
		codeFromUrl,
		handleCreateNewBoard,
		handleOpenBoard,
		handleImportFromUrl,
		navigate,
	]);

	// Show error state
	if (storageError) {
		return (
			<div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
				<div className="text-destructive text-lg">
					{t("boardManager.loadError")}
				</div>
				<button
					type="button"
					onClick={() => window.location.reload()}
					className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
				>
					{t("boardManager.retry")}
				</button>
			</div>
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
			<TabStoreProvider>
				<PanelStoreProvider>
					<EditorStoreProvider
						key={editorKey}
						initialBoard={initialBoard}
						initialGroups={initialGroups}
						initialGridSettings={initialGridSettings}
						boardId={currentBoardId}
					>
						<EditorWithTabs
							boards={boards}
							currentBoardId={currentBoardId}
							shortLinksEnabled={featureFlags.shortLinksEnabled}
							showBoardManager={showBoardManager}
							onCloseBoardManager={() => setShowBoardManager(false)}
							onOpenBoardManager={() => setShowBoardManager(true)}
							onSaveBoard={(name, stgyCode, groups, gridSettings, objects) => {
								if (currentBoardId) {
									const storedGroups = convertGroupsToIndexBased(
										groups,
										objects,
									);
									void updateBoard(currentBoardId, {
										name,
										stgyCode,
										groups: storedGroups,
										gridSettings,
									});
								}
							}}
							onCreateBoardFromImport={async (name, stgyCode) => {
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
									[],
									DEFAULT_GRID_SETTINGS,
								);

								// 直接エディターを初期化（IndexedDBの反映を待たずに）
								setCurrentBoardId(newBoardId);
								setInitialBoard({ ...decodedBoard, name });
								setInitialGroups([]);
								setInitialGridSettings(DEFAULT_GRID_SETTINGS);

								setEditorKey((prev) => prev + 1);
							}}
							onSelectBoard={handleOpenBoard}
							onCreateNewBoard={handleCreateNewBoard}
							onDuplicateBoard={(id) => {
								const board = getBoard(id);
								if (!board) return;
								void createBoard(
									`${board.name} (Copy)`,
									board.stgyCode,
									board.groups,
									board.gridSettings,
								);
							}}
						/>
					</EditorStoreProvider>

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
			</TabStoreProvider>
		</SettingsStoreProvider>
	);
}

/** EditorContentのProps */
interface EditorContentProps {
	currentBoardId: string | null;
	shortLinksEnabled: boolean;
	onOpenBoardManager: () => void;
	onSaveBoard: (
		name: string,
		stgyCode: string,
		groups: ObjectGroup[],
		gridSettings: GridSettings,
		objects: BoardObject[],
	) => void;
	onCreateBoardFromImport?: (
		name: string,
		stgyCode: string,
	) => void | Promise<void>;
	/** Optional tab bar to render at the bottom of the canvas area */
	children?: React.ReactNode;
}

/**
 * エディターコンテンツ（キーボードショートカット有効化）
 */
function EditorContent({
	currentBoardId,
	shortLinksEnabled,
	onOpenBoardManager,
	onSaveBoard,
	onCreateBoardFromImport,
	children,
}: EditorContentProps) {
	// キーボードショートカットを有効化
	useKeyboardShortcuts();

	// Get editor state
	const isFocusMode = useIsFocusMode();
	const focusedGroup = useFocusedGroup();
	const { unfocus } = useEditorActions();

	// TanStack Store Effect を使用した自動保存
	const { lastSavedAt } = useAutoSave({
		currentBoardId,
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
			width={24}
			height={24}
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
				lastSavedAt={lastSavedAt}
				onOpenBoardManager={onOpenBoardManager}
				onCreateBoardFromImport={onCreateBoardFromImport}
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
						assetPanel: <AssetPanelActions />,
						historyPanel: <HistoryPanelActions />,
					}}
				>
					{/* 中央: キャンバスとタブバー */}
					<div className="h-full flex flex-col">
						<div
							ref={containerRef}
							className="canvas-container flex-1 flex items-center justify-center overflow-auto p-4 relative"
						>
							{/* フォーカスモードインジケーター */}
							{isFocusMode && focusedGroup && (
								<FocusModeIndicator
									groupName={
										focusedGroup.name ||
										`Group (${focusedGroup.objectIds.length})`
									}
									onExit={unfocus}
								/>
							)}
							<EditorBoard scale={scale} />
						</div>
						{/* タブバー（childrenとして渡される） */}
						{children}
					</div>
				</ResizableLayout>
			</div>

			{/* エラートースト */}
			<ErrorToast />
		</div>
	);
}

/** EditorWithTabsのProps */
interface EditorWithTabsProps extends EditorContentProps {
	boards: StoredBoard[];
	showBoardManager: boolean;
	onCloseBoardManager: () => void;
	onSelectBoard: (boardId: string) => boolean;
	onDuplicateBoard: (boardId: string) => void;
	onCreateNewBoard: () => void;
}

/**
 * タブバー付きエディターラッパー
 */
function EditorWithTabs({
	boards,
	showBoardManager,
	onCloseBoardManager,
	onSelectBoard,
	onDuplicateBoard,
	onCreateNewBoard,
	currentBoardId,
	...contentProps
}: EditorWithTabsProps) {
	const openTabs = useOpenTabs();
	const activeTabId = useActiveTabId();
	const { addTab, setInitialTab } = useTabActions();

	// タブストアとcurrentBoardIdを同期
	useEffect(() => {
		if (!currentBoardId) return;

		// 初期化: タブがない場合は現在のボードをタブとして追加
		if (openTabs.length === 0) {
			const existingBoardIds = new Set(boards.map((b) => b.id));
			// localStorageから復元されなかった場合、現在のボードを初期タブとして設定
			if (existingBoardIds.has(currentBoardId)) {
				setInitialTab(currentBoardId);
			}
		} else if (!openTabs.includes(currentBoardId)) {
			// 現在のボードがタブに含まれていない場合は追加
			addTab(currentBoardId);
		}
	}, [currentBoardId, openTabs, boards, addTab, setInitialTab]);

	// タブ切り替え時にボードを選択
	useEffect(() => {
		if (activeTabId && activeTabId !== currentBoardId) {
			onSelectBoard(activeTabId);
		}
	}, [activeTabId, currentBoardId, onSelectBoard]);

	// 統一的な「ボードを開く」ハンドラ（タブ切り替え + ボード読み込み）
	const handleOpenBoard = useCallback(
		(boardId: string) => {
			// タブを追加または切り替え（既存タブの場合はアクティブに切り替わる）
			addTab(boardId);
			// ボードを開く
			onSelectBoard(boardId);
		},
		[addTab, onSelectBoard],
	);

	// 未保存状態のボードIDセット（今後実装）
	const unsavedBoardIds = useMemo(() => new Set<string>(), []);

	return (
		<>
			<EditorContent {...contentProps} currentBoardId={currentBoardId}>
				{/* タブバー */}
				<BoardTabs
					boards={boards}
					unsavedBoardIds={unsavedBoardIds}
					onAddClick={contentProps.onOpenBoardManager}
					onSelectBoard={handleOpenBoard}
					onDuplicateBoard={onDuplicateBoard}
				/>
			</EditorContent>

			{/* Board Manager Modal */}
			<BoardManagerModal
				open={showBoardManager}
				onClose={onCloseBoardManager}
				currentBoardId={currentBoardId}
				onOpenBoard={handleOpenBoard}
				onCreateNewBoard={onCreateNewBoard}
			/>
		</>
	);
}
