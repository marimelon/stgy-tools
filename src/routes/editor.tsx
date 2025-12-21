/**
 * エディターページ
 */

import { createFileRoute } from "@tanstack/react-router";
import { EditorProvider, createEmptyBoard } from "@/lib/editor";
import {
  EditorBoard,
  EditorToolbar,
  ObjectPalette,
  PropertyPanel,
} from "@/components/editor";

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

function EditorPage() {
  const initialBoard = createEmptyBoard("新規ボード");

  return (
    <EditorProvider initialBoard={initialBoard}>
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
          {/* 左: オブジェクトパレット */}
          <ObjectPalette />

          {/* 中央: キャンバス */}
          <div className="flex-1 flex items-center justify-center bg-slate-950 overflow-auto p-4">
            <EditorBoard scale={1} />
          </div>

          {/* 右: プロパティパネル */}
          <PropertyPanel />
        </div>
      </div>
    </EditorProvider>
  );
}
