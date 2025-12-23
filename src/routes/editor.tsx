/**
 * エディターページ
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	EditorProvider,
	createEmptyBoard,
	useKeyboardShortcuts,
	useImportExport,
	useEditor,
	recalculateBoardSize,
	type GridSettings,
	type ObjectGroup,
} from "@/lib/editor";
import {
	decodeStgy,
	parseBoardData,
	encodeStgy,
	type BoardData,
} from "@/lib/stgy";
import { PanelProvider } from "@/lib/panel";
import { ResizableLayout } from "@/components/panel";
import {
	EditorBoard,
	EditorToolbar,
	LayerPanel,
	ObjectPalette,
	PropertyPanel,
} from "@/components/editor";
import { BoardManagerModal } from "@/components/editor/BoardManager";
import { useBoards } from "@/lib/boards";

/** キャンバスの基本サイズ */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

export const Route = createFileRoute("/editor")({
	component: EditorPage,
	ssr: false, // TanStack DB (useLiveQuery) requires client-side only
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
	// Board manager state
	const [showBoardManager, setShowBoardManager] = useState(false);
	const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);

	// Initial board state
	const [initialBoard, setInitialBoard] = useState<BoardData>(() =>
		createEmptyBoard("新規ボード"),
	);
	const [initialGroups, setInitialGroups] = useState<ObjectGroup[]>([]);
	const [initialGridSettings, setInitialGridSettings] =
		useState<GridSettings>(DEFAULT_GRID_SETTINGS);
	const [initialEncodeKey, setInitialEncodeKey] = useState<number>(0);

	// Key to force re-render EditorProvider when switching boards
	const [editorKey, setEditorKey] = useState(0);

	// Board operations from useBoards
	const { createBoard, updateBoard, getBoard } = useBoards();

	// Handle opening a board
	const handleOpenBoard = useCallback(
		(boardId: string) => {
			const board = getBoard(boardId);
			if (!board) return;

			const decodedBoard = decodeBoardFromStgy(board.stgyCode);
			if (!decodedBoard) return;

			setCurrentBoardId(boardId);
			// Use stored board name (may have been renamed) instead of decoded name
			setInitialBoard({ ...decodedBoard, name: board.name });
			setInitialGroups(board.groups);
			setInitialGridSettings(board.gridSettings);
			setInitialEncodeKey(board.encodeKey);
			setEditorKey((prev) => prev + 1);
		},
		[getBoard],
	);

	// Handle creating a new board
	const handleCreateNewBoard = useCallback(() => {
		const newBoard = createEmptyBoard("新規ボード");
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
		setInitialBoard(newBoard);
		setInitialGroups([]);
		setInitialGridSettings(DEFAULT_GRID_SETTINGS);
		setInitialEncodeKey(0);
		setEditorKey((prev) => prev + 1);
	}, [createBoard]);

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
					onOpenBoardManager={() => setShowBoardManager(true)}
					onSaveBoard={(name, stgyCode, encodeKey, groups, gridSettings) => {
						if (currentBoardId) {
							updateBoard(currentBoardId, {
								name,
								stgyCode,
								encodeKey,
								groups,
								gridSettings,
							});
						}
					}}
				/>
			</EditorProvider>

			{/* Board Manager Modal */}
			<BoardManagerModal
				open={showBoardManager}
				onClose={() => setShowBoardManager(false)}
				currentBoardId={currentBoardId}
				onOpenBoard={handleOpenBoard}
				onCreateNewBoard={handleCreateNewBoard}
			/>
		</PanelProvider>
	);
}

/** EditorContentのProps */
interface EditorContentProps {
	initialEncodeKey: number;
	currentBoardId: string | null;
	onOpenBoardManager: () => void;
	onSaveBoard: (
		name: string,
		stgyCode: string,
		encodeKey: number,
		groups: ObjectGroup[],
		gridSettings: GridSettings,
	) => void;
}

/**
 * エディターコンテンツ（キーボードショートカット有効化）
 */
function EditorContent({
	initialEncodeKey,
	currentBoardId,
	onOpenBoardManager,
	onSaveBoard,
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

	// Save current board when dirty
	useEffect(() => {
		if (!currentBoardId || !state.isDirty) return;

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

	return (
		<div className="h-screen flex flex-col bg-background">
			{/* ヘッダー */}
			<header className="app-header flex items-center justify-between px-4 py-2.5">
				<div className="flex items-center gap-3">
					{/* ロゴアイコン */}
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
					<h1 className="app-logo">STGY Tools Editor</h1>
				</div>
				<nav className="flex items-center gap-4">
					<Link
						to="/"
						className="text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
					>
						Viewer
					</Link>
					<Link
						to="/image/generate"
						target="_blank"
						className="text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
					>
						Image Generator
					</Link>
				</nav>
			</header>

			{/* ツールバー */}
			<EditorToolbar lastSavedAt={lastSavedAt} onOpenBoardManager={onOpenBoardManager} />

			{/* メインエリア */}
			<div className="flex-1 overflow-hidden h-full">
				<ResizableLayout
					panelComponents={{
						objectPalette: <ObjectPalette />,
						layerPanel: <LayerPanel />,
						propertyPanel: <PropertyPanel />,
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
