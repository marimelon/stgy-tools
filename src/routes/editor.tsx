/**
 * エディターページ
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { EditorProvider, createEmptyBoard, useKeyboardShortcuts } from "@/lib/editor";
import {
  EditorBoard,
  EditorToolbar,
  LayerPanel,
  ObjectPalette,
  PropertyPanel,
} from "@/components/editor";

/** キャンバスの基本サイズ */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

function EditorPage() {
  const initialBoard = createEmptyBoard("新規ボード");

  return (
    <EditorProvider initialBoard={initialBoard}>
      <EditorContent />
    </EditorProvider>
  );
}

/**
 * エディターコンテンツ（キーボードショートカット有効化）
 */
function EditorContent() {
  // キーボードショートカットを有効化
  useKeyboardShortcuts();

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
        <a
          href="/"
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          ビューアーに戻る
        </a>
      </header>

      {/* ツールバー */}
      <EditorToolbar />

      {/* メインエリア */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左: オブジェクトパレット + レイヤーパネル */}
        <div className="w-64 flex flex-col border-r border-slate-700">
          <div className="flex-1 overflow-hidden">
            <ObjectPalette />
          </div>
          <LayerPanel />
        </div>

        {/* 中央: キャンバス */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center bg-slate-950 overflow-auto p-4"
        >
          <EditorBoard scale={scale} />
        </div>

        {/* 右: プロパティパネル */}
        <PropertyPanel />
      </div>
    </div>
  );
}
