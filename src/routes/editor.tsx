/**
 * エディターページ
 */

import NiceModal from "@ebay/nice-modal-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
	AssetPanel,
	AssetPanelActions,
	BoardTabs,
	DebugPanel,
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
	type DecodeErrorResult,
} from "@/components/editor/BoardManager";
import { ResizableLayout } from "@/components/panel";
import { CompactAppHeader } from "@/components/ui/AppHeader";
import { BoardsProvider, useBoards } from "@/lib/boards";
import type { StoredBoard } from "@/lib/boards/schema";
import {
	EditorStoreProvider,
	type GridSettings,
	type ObjectGroup,
	TabStoreProvider,
	useActiveTabId,
	useAutoSave,
	useEditorActions,
	useEditorBoardManager,
	useEditorImport,
	useEditorInitialization,
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
import type { BoardObject } from "@/lib/stgy";

/** キャンバスの基本サイズ */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

/** Search params for editor page */
type EditorSearchParams = {
	stgy?: string;
	lang?: string;
	import?: string;
	key?: string;
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
				generateCanonicalLink(seo.path, lang),
				...generateHreflangLinks(seo.path),
			],
		};
	},
	validateSearch: (search: Record<string, unknown>): EditorSearchParams => ({
		stgy: typeof search.stgy === "string" ? search.stgy : undefined,
		lang: typeof search.lang === "string" ? search.lang : undefined,
		import: typeof search.import === "string" ? search.import : undefined,
		key: typeof search.key === "string" ? search.key : undefined,
	}),
});

/** Import success toast component */
interface ImportSuccessToastProps {
	count: number;
	folderName: string;
	onDismiss: () => void;
}

function ImportSuccessToast({
	count,
	folderName,
	onDismiss,
}: ImportSuccessToastProps) {
	const { t } = useTranslation();

	return createPortal(
		<div
			className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg bg-foreground text-background shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200"
			onPointerDown={(e) => e.stopPropagation()}
		>
			<Check className="size-4 text-green-400" />
			<span className="text-sm">
				{t("viewer.importComplete", { count, folder: folderName })}
			</span>
			<button
				type="button"
				onClick={onDismiss}
				className="text-background/70 hover:text-background transition-colors"
			>
				<X className="size-4" />
			</button>
		</div>,
		document.body,
	);
}

function EditorPage() {
	const { featureFlags } = Route.useLoaderData();

	return (
		<BoardsProvider>
			<NiceModal.Provider>
				<EditorPageContent featureFlags={featureFlags} />
			</NiceModal.Provider>
		</BoardsProvider>
	);
}

interface EditorPageContentProps {
	featureFlags: { shortLinksEnabled: boolean };
}

function EditorPageContent({ featureFlags }: EditorPageContentProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const searchParams = Route.useSearch();

	// Board operations from useBoards
	const { boards, isLoading, error: storageError, deleteBoard } = useBoards();

	// Board manager hook
	const boardManager = useEditorBoardManager();
	const {
		currentBoardId,
		initialBoard,
		initialGroups,
		initialGridSettings,
		editorKey,
		decodeError,
		openBoard,
		createNewBoard,
		saveBoard,
		duplicateBoard,
		createBoardFromImport,
		clearDecodeError,
		setBoard,
	} = boardManager;

	// Import hook
	const importManager = useEditorImport({
		onBoardCreated: (boardId, board) => {
			setBoard(boardId, board);
		},
		onOpenBoard: openBoard,
		onCreateNewBoard: createNewBoard,
		navigate,
		boards,
	});
	const { pendingImportBoardIds, importSuccess, clearImportSuccess } =
		importManager;

	// Initialization hook
	const { isInitialized } = useEditorInitialization({
		boardManager,
		importManager,
		searchParams,
		navigate,
		isLoadingBoards: isLoading,
		storageError,
		boards,
	});

	// Handle decode error using nice-modal
	useEffect(() => {
		if (!decodeError) return;

		const showDecodeErrorModal = async () => {
			const result = (await NiceModal.show(DecodeErrorDialog, {
				boardName: decodeError.boardName,
			})) as DecodeErrorResult;

			if (result === "delete") {
				deleteBoard(decodeError.boardId);
				const remainingBoards = boards.filter(
					(b) => b.id !== decodeError.boardId,
				);
				if (remainingBoards.length > 0) {
					openBoard(remainingBoards[0].id);
				} else {
					await createNewBoard();
				}
			} else if (result === "open-another") {
				NiceModal.show(BoardManagerModal, {
					currentBoardId,
					onOpenBoard: openBoard,
					onCreateNewBoard: createNewBoard,
				});
			}

			clearDecodeError();
		};

		showDecodeErrorModal();
	}, [
		decodeError,
		deleteBoard,
		boards,
		openBoard,
		createNewBoard,
		currentBoardId,
		clearDecodeError,
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
		<>
			<SettingsStoreProvider>
				<TabStoreProvider initialBoardIds={pendingImportBoardIds}>
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
								onSaveBoard={saveBoard}
								onCreateBoardFromImport={createBoardFromImport}
								onSelectBoard={openBoard}
								onCreateNewBoard={createNewBoard}
								onDuplicateBoard={duplicateBoard}
							/>
						</EditorStoreProvider>
					</PanelStoreProvider>
				</TabStoreProvider>
			</SettingsStoreProvider>
			{/* Import success toast */}
			{importSuccess && (
				<ImportSuccessToast
					count={importSuccess.count}
					folderName={importSuccess.folderName}
					onDismiss={clearImportSuccess}
				/>
			)}
		</>
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
interface EditorWithTabsProps
	extends Omit<EditorContentProps, "onOpenBoardManager"> {
	boards: StoredBoard[];
	onSelectBoard: (boardId: string) => boolean;
	onDuplicateBoard: (boardId: string) => void;
	onCreateNewBoard: () => void;
}

/**
 * タブバー付きエディターラッパー
 */
function EditorWithTabs({
	boards,
	onSelectBoard,
	onDuplicateBoard,
	onCreateNewBoard,
	currentBoardId,
	...contentProps
}: EditorWithTabsProps) {
	const openTabs = useOpenTabs();
	const activeTabId = useActiveTabId();
	const { addTab, setInitialTab, replaceAllTabs } = useTabActions();

	// 初回マウントかどうかを追跡（リロード後の初期化とユーザーアクションを区別）
	const isInitialMountRef = useRef(true);

	// タブストアとcurrentBoardIdを同期
	useEffect(() => {
		if (!currentBoardId) return;

		const isInitialMount = isInitialMountRef.current;
		isInitialMountRef.current = false;

		// 初期化: タブがない場合は現在のボードをタブとして追加
		if (openTabs.length === 0) {
			const existingBoardIds = new Set(boards.map((b) => b.id));
			// localStorageから復元されなかった場合、現在のボードを初期タブとして設定
			if (existingBoardIds.has(currentBoardId)) {
				setInitialTab(currentBoardId);
			}
		} else if (!openTabs.includes(currentBoardId)) {
			// 初回マウント時（リロード後）で、有効なactiveTabIdがある場合は、そちらに切り替える
			// それ以外（Viewerからのインポート等）は、currentBoardIdをタブに追加
			if (isInitialMount && activeTabId && openTabs.includes(activeTabId)) {
				onSelectBoard(activeTabId);
			} else {
				addTab(currentBoardId);
			}
		}
	}, [
		currentBoardId,
		openTabs,
		activeTabId,
		boards,
		addTab,
		setInitialTab,
		onSelectBoard,
	]);

	// タブ切り替え時にボードを選択
	useEffect(() => {
		if (activeTabId && activeTabId !== currentBoardId) {
			onSelectBoard(activeTabId);
		}
	}, [activeTabId, currentBoardId, onSelectBoard]);

	// 注意: 削除されたボードのタブの自動クローズは行わない
	// useLiveQueryの結果が一時的に変動するため、誤検出でタブが閉じられる問題がある
	// ボード削除時のタブクローズは、削除操作を行う側（BoardManagerなど）で
	// 明示的に removeDeletedBoardTab を呼び出して処理する

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

	// 複数ボードをタブで開く（既存タブを置き換え）
	const handleOpenBoards = useCallback(
		(boardIds: string[]) => {
			if (boardIds.length === 0) return;

			// すべてのタブを置き換え（最初のボードがアクティブになる）
			replaceAllTabs(boardIds);

			// 最初のボードを開く
			onSelectBoard(boardIds[0]);
		},
		[replaceAllTabs, onSelectBoard],
	);

	// ボードマネージャーを開く（タブ追加を含むhandleOpenBoardを使用）
	const handleOpenBoardManager = useCallback(() => {
		NiceModal.show(BoardManagerModal, {
			currentBoardId,
			onOpenBoard: handleOpenBoard,
			onOpenBoards: handleOpenBoards,
			onCreateNewBoard,
		});
	}, [currentBoardId, handleOpenBoard, handleOpenBoards, onCreateNewBoard]);

	// 未保存状態のボードIDセット（今後実装）
	const unsavedBoardIds = useMemo(() => new Set<string>(), []);

	return (
		<EditorContent
			{...contentProps}
			currentBoardId={currentBoardId}
			onOpenBoardManager={handleOpenBoardManager}
		>
			{/* タブバー */}
			<BoardTabs
				boards={boards}
				unsavedBoardIds={unsavedBoardIds}
				onAddClick={handleOpenBoardManager}
				onSelectBoard={handleOpenBoard}
				onDuplicateBoard={onDuplicateBoard}
			/>
		</EditorContent>
	);
}
