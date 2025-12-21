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
			<div className="h-screen flex items-center justify-center bg-slate-900 text-white">
				<div className="text-slate-400">読み込み中...</div>
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
		<div className="h-screen flex flex-col bg-slate-900 text-white">
			{/* ヘッダー */}
			<header className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
				<h1 className="text-lg font-bold">Strategy Board Editor</h1>
				<Link
					to="/"
					className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
				>
					ビューアーに戻る
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
						className="h-full flex items-center justify-center bg-slate-950 overflow-auto p-4"
					>
						<EditorBoard scale={scale} />
					</div>
				</ResizableLayout>
			</div>
		</div>
	);
}
