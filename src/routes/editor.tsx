/**
 * エディターページ
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	EditorProvider,
	createEmptyBoard,
	useKeyboardShortcuts,
	useImportExport,
	type GridSettings,
	type ObjectGroup,
} from "@/lib/editor";
import { decodeStgy, parseBoardData, type BoardData } from "@/lib/stgy";
import { PanelProvider } from "@/lib/panel";
import { ResizableLayout } from "@/components/panel";
import {
	EditorBoard,
	EditorToolbar,
	LayerPanel,
	ObjectPalette,
	PropertyPanel,
} from "@/components/editor";
import { loadSession, useAutoSave } from "@/lib/persistence";

/** キャンバスの基本サイズ */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

export const Route = createFileRoute("/editor")({
	component: EditorPage,
});

/** セッション復元結果 */
interface SessionRestoreResult {
	board: BoardData;
	groups: ObjectGroup[];
	gridSettings?: GridSettings;
	encodeKey: number;
}

/**
 * localStorageからセッションを復元
 */
function restoreSession(): SessionRestoreResult | null {
	const session = loadSession();
	if (!session) return null;

	try {
		const binary = decodeStgy(session.stgyCode);
		const board = parseBoardData(binary);
		return {
			board,
			groups: session.groups,
			gridSettings: session.gridSettings,
			encodeKey: session.encodeKey,
		};
	} catch (error) {
		console.warn("Failed to restore session:", error);
		return null;
	}
}

function EditorPage() {
	const [isLoading, setIsLoading] = useState(true);
	const [initialData, setInitialData] = useState<SessionRestoreResult | null>(
		null,
	);

	// セッション復元
	useEffect(() => {
		const restored = restoreSession();
		setInitialData(restored);
		setIsLoading(false);
	}, []);

	// ローディング中
	if (isLoading) {
		return (
			<div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
				<div className="w-12 h-12 rounded-lg flex items-center justify-center animate-pulse bg-muted border border-border">
					<svg 
						width="24" 
						height="24" 
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						strokeWidth="2" 
						className="text-foreground"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" />
						<circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
						<circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
						<path d="M8.5 15.5h7M15.5 8.5v7" strokeLinecap="round" />
					</svg>
				</div>
				<div className="text-muted-foreground font-display">
					読み込み中...
				</div>
			</div>
		);
	}

	// 初期データ（復元データまたは新規ボード）
	const board = initialData?.board ?? createEmptyBoard("新規ボード");
	const groups = initialData?.groups;
	const gridSettings = initialData?.gridSettings;
	const encodeKey = initialData?.encodeKey ?? null;

	return (
		<PanelProvider>
			<EditorProvider
				initialBoard={board}
				initialGroups={groups}
				initialGridSettings={gridSettings}
			>
				<EditorContent initialEncodeKey={encodeKey} />
			</EditorProvider>
		</PanelProvider>
	);
}

/** EditorContentのProps */
interface EditorContentProps {
	initialEncodeKey: number | null;
}

/**
 * エディターコンテンツ（キーボードショートカット有効化）
 */
function EditorContent({ initialEncodeKey }: EditorContentProps) {
	// キーボードショートカットを有効化
	useKeyboardShortcuts();

	// インポート/エクスポートフック（encodeKeyの管理）
	const { encodeKey, setEncodeKey } = useImportExport();

	// 初期encodeKeyを設定
	useEffect(() => {
		if (initialEncodeKey !== null) {
			setEncodeKey(initialEncodeKey);
		}
	}, [initialEncodeKey, setEncodeKey]);

	// 自動保存を有効化
	const { lastSavedAt } = useAutoSave({
		encodeKey: encodeKey ?? initialEncodeKey,
		debounceMs: 1000,
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

	return (
		<div className="h-screen flex flex-col bg-background">
			{/* ヘッダー */}
			<header className="app-header flex items-center justify-between px-4 py-2.5">
				<div className="flex items-center gap-3">
					{/* ロゴアイコン */}
					<div className="w-8 h-8 rounded-md flex items-center justify-center bg-muted border border-border">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground">
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
							<circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
							<path d="M8.5 15.5h7M15.5 8.5v7" strokeLinecap="round" />
						</svg>
					</div>
					<h1 className="app-logo">Strategy Board Editor</h1>
				</div>
				<Link
					to="/image/generate"
					target="_blank"
					className="text-sm font-medium transition-colors flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
						<polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" />
						<line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					画像生成
				</Link>
			</header>

			{/* ツールバー */}
			<EditorToolbar lastSavedAt={lastSavedAt} />

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
